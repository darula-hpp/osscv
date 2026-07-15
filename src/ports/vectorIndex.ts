/** Port: nearest-neighbor index over genesis section vectors. */

export type VectorHit = {
  id: string;
  score: number;
};

export type VectorIndex = {
  build(items: { id: string; embedding: number[] }[]): void;
  search(embedding: number[], k?: number): VectorHit[];
};
