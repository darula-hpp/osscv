import { describe, expect, it } from "vitest";
import { HashingEmbedder } from "../hashingEmbedder";

describe("HashingEmbedder", () => {
  it("returns a fixed-dimension L2-ish unit vector", async () => {
    const emb = new HashingEmbedder(32);
    const v = await emb.embed("open source infrastructure");
    expect(v).toHaveLength(32);
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it("is deterministic", async () => {
    const emb = new HashingEmbedder();
    const a = await emb.embed("same text");
    const b = await emb.embed("same text");
    expect(a).toEqual(b);
  });
});
