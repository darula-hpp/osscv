import type { VectorHit, VectorIndex } from "../ports/vectorIndex";
import { BruteForceIndex } from "./bruteForceIndex";

function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

type Node = {
  id: string;
  embedding: number[];
  /** Neighbors per layer (layer 0 = base). */
  neighbors: string[][];
};

/**
 * Lightweight Hierarchical NSW (HNSW) in pure TypeScript.
 * No native deps — auditable and Vercel-safe. Falls back to exact search for tiny N.
 */
export class HnswIndex implements VectorIndex {
  private readonly M: number;
  private readonly efConstruction: number;
  private readonly efSearch: number;
  private nodes = new Map<string, Node>();
  private entryPoint: string | null = null;
  private maxLayer = 0;
  private readonly exact = new BruteForceIndex();

  constructor(opts?: { M?: number; efConstruction?: number; efSearch?: number }) {
    this.M = opts?.M ?? 16;
    this.efConstruction = opts?.efConstruction ?? 64;
    this.efSearch = opts?.efSearch ?? 32;
  }

  build(items: { id: string; embedding: number[] }[]): void {
    this.nodes.clear();
    this.entryPoint = null;
    this.maxLayer = 0;
    this.exact.build(items);

    // Exact is fine and deterministic for CV-sized corpora.
    if (items.length <= 64) {
      for (const item of items) {
        this.nodes.set(item.id, {
          id: item.id,
          embedding: item.embedding,
          neighbors: [[]],
        });
      }
      this.entryPoint = items[0]?.id ?? null;
      return;
    }

    for (const item of items) {
      this.insert(item.id, item.embedding);
    }
  }

  search(embedding: number[], k = 1): VectorHit[] {
    if (this.nodes.size <= 64) {
      return this.exact.search(embedding, k);
    }
    if (!this.entryPoint) return [];

    let curr = this.entryPoint;
    for (let layer = this.maxLayer; layer >= 1; layer--) {
      curr = this.greedySearch(embedding, curr, layer);
    }
    const candidates = this.searchLayer(embedding, [curr], 0, Math.max(this.efSearch, k));
    return candidates.slice(0, k).map((c) => ({
      id: c.id,
      score: cosine(embedding, this.nodes.get(c.id)!.embedding),
    }));
  }

  private insert(id: string, embedding: number[]): void {
    const layer = this.randomLevel();
    const node: Node = {
      id,
      embedding,
      neighbors: Array.from({ length: layer + 1 }, () => []),
    };

    if (!this.entryPoint) {
      this.nodes.set(id, node);
      this.entryPoint = id;
      this.maxLayer = layer;
      return;
    }

    let curr = this.entryPoint;
    for (let lc = this.maxLayer; lc > layer; lc--) {
      curr = this.greedySearch(embedding, curr, lc);
    }

    for (let lc = Math.min(layer, this.maxLayer); lc >= 0; lc--) {
      const neighbors = this.searchLayer(embedding, [curr], lc, this.efConstruction);
      const selected = neighbors.slice(0, this.M).map((n) => n.id);
      node.neighbors[lc] = selected;
      for (const nid of selected) {
        const other = this.nodes.get(nid)!;
        while (other.neighbors.length <= lc) other.neighbors.push([]);
        other.neighbors[lc]!.push(id);
        if (other.neighbors[lc]!.length > this.M) {
          other.neighbors[lc] = this.prune(other.embedding, other.neighbors[lc]!, this.M);
        }
      }
      if (neighbors.length) curr = neighbors[0]!.id;
    }

    this.nodes.set(id, node);
    if (layer > this.maxLayer) {
      this.maxLayer = layer;
      this.entryPoint = id;
    }
  }

  private randomLevel(): number {
    let level = 0;
    const ml = 1 / Math.log(this.M);
    while (Math.random() < Math.exp(-level / ml) && level < 16) level += 1;
    return Math.max(0, level - 1);
  }

  private greedySearch(query: number[], entry: string, layer: number): string {
    let curr = entry;
    let improved = true;
    while (improved) {
      improved = false;
      const node = this.nodes.get(curr);
      if (!node) break;
      const neighbors = node.neighbors[layer] ?? [];
      let best = curr;
      let bestScore = cosine(query, node.embedding);
      for (const nid of neighbors) {
        const n = this.nodes.get(nid);
        if (!n) continue;
        const s = cosine(query, n.embedding);
        if (s > bestScore) {
          bestScore = s;
          best = nid;
          improved = true;
        }
      }
      curr = best;
    }
    return curr;
  }

  private searchLayer(
    query: number[],
    entryPoints: string[],
    layer: number,
    ef: number,
  ): { id: string; score: number }[] {
    const visited = new Set<string>(entryPoints);
    const candidates: { id: string; score: number }[] = [];
    const results: { id: string; score: number }[] = [];

    for (const id of entryPoints) {
      const node = this.nodes.get(id);
      if (!node) continue;
      const score = cosine(query, node.embedding);
      candidates.push({ id, score });
      results.push({ id, score });
    }
    candidates.sort((a, b) => b.score - a.score);
    results.sort((a, b) => b.score - a.score);

    while (candidates.length) {
      const current = candidates.shift()!;
      const worstResult = results[results.length - 1]?.score ?? -Infinity;
      if (current.score < worstResult && results.length >= ef) break;

      const node = this.nodes.get(current.id);
      if (!node) continue;
      for (const nid of node.neighbors[layer] ?? []) {
        if (visited.has(nid)) continue;
        visited.add(nid);
        const n = this.nodes.get(nid);
        if (!n) continue;
        const score = cosine(query, n.embedding);
        const worst = results[results.length - 1]?.score ?? -Infinity;
        if (score > worst || results.length < ef) {
          candidates.push({ id: nid, score });
          candidates.sort((a, b) => b.score - a.score);
          results.push({ id: nid, score });
          results.sort((a, b) => b.score - a.score);
          if (results.length > ef) results.pop();
        }
      }
    }
    return results;
  }

  private prune(center: number[], neighborIds: string[], m: number): string[] {
    return neighborIds
      .map((id) => ({
        id,
        score: cosine(center, this.nodes.get(id)?.embedding ?? []),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, m)
      .map((x) => x.id);
  }
}
