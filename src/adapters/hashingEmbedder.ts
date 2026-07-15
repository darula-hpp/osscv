import type { Embedder } from "../ports/embedder";

const DEFAULT_DIM = 384;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function hashToken(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function l2Normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum) || 1;
  return v.map((x) => x / norm);
}

/**
 * Portable deterministic embedder (no ONNX).
 * Good enough for HNSW doctoring checks when MiniLM is unavailable (e.g. Vercel).
 */
export class HashingEmbedder implements Embedder {
  readonly dimensions: number;

  constructor(dimensions = DEFAULT_DIM) {
    this.dimensions = dimensions;
  }

  async embed(text: string): Promise<number[]> {
    const vec = new Array<number>(this.dimensions).fill(0);
    const tokens = tokenize(text);
    if (!tokens.length) return vec;
    for (const token of tokens) {
      const h = hashToken(token);
      const i = h % this.dimensions;
      vec[i]! += 1;
      vec[(h >>> 8) % this.dimensions]! += 0.5;
    }
    return l2Normalize(vec);
  }
}
