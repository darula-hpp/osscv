import type { VectorHit, VectorIndex } from "../ports/vectorIndex";

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

/** Exact cosine search — ideal for tests and tiny section counts. */
export class BruteForceIndex implements VectorIndex {
  private items: { id: string; embedding: number[] }[] = [];

  build(items: { id: string; embedding: number[] }[]): void {
    this.items = items.slice();
  }

  search(embedding: number[], k = 1): VectorHit[] {
    return this.items
      .map((item) => ({ id: item.id, score: cosine(embedding, item.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}
