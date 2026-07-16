import { describe, expect, it } from "vitest";
import { BruteForceIndex } from "../bruteForceIndex";

describe("BruteForceIndex", () => {
  it("returns nearest neighbors by cosine similarity", () => {
    const index = new BruteForceIndex();
    index.build([
      { id: "a", embedding: [1, 0, 0] },
      { id: "b", embedding: [0, 1, 0] },
      { id: "c", embedding: [0.9, 0.1, 0] },
    ]);
    const hits = index.search([1, 0, 0], 2);
    expect(hits[0]?.id).toBe("a");
    expect(hits.map((h) => h.id)).toContain("c");
  });
});
