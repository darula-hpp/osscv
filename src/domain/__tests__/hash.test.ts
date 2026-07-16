import { describe, expect, it } from "vitest";
import { sampleDocument } from "../../testing/sampleDocument";
import { canonicalHash, canonicalize } from "../hash";

describe("canonicalize", () => {
  it("sorts object keys for stable JSON", () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });
});

describe("canonicalHash", () => {
  it("is stable across deep clones", () => {
    const a = canonicalHash(sampleDocument);
    const b = canonicalHash(structuredClone(sampleDocument));
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("changes when content changes", () => {
    const next = structuredClone(sampleDocument);
    next.basics.summary = "Different summary.";
    expect(canonicalHash(next)).not.toBe(canonicalHash(sampleDocument));
  });
});
