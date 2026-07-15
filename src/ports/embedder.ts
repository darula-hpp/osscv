/** Port: turn text into a fixed-dim embedding. */
export type Embedder = {
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
};
