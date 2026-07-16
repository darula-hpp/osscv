import { describe, expect, it } from "vitest";
import { HnswIndex } from "../hnswIndex";

describe("HnswIndex", () => {
  it("builds and searches small corpora", () => {
    const index = new HnswIndex();
    index.build([
      { id: "x", embedding: [1, 0] },
      { id: "y", embedding: [0, 1] },
    ]);
    const hits = index.search([1, 0], 1);
    expect(hits[0]?.id).toBe("x");
  });
});
