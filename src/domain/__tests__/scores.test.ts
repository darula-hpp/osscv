import { describe, expect, it } from "vitest";
import { aggregateVerifyScores, diffDocuments, mean } from "../scores";

describe("mean", () => {
  it("averages values and returns 0 for empty", () => {
    expect(mean([1, 2, 3])).toBe(2);
    expect(mean([])).toBe(0);
  });
});

describe("diffDocuments", () => {
  it("flags added repos paths", () => {
    const changes = diffDocuments(
      { repos: [{ name: "a" }] },
      { repos: [{ name: "a" }, { name: "b" }] },
    );
    expect(changes.some((c) => c.kind === "added" && c.path.startsWith("repos"))).toBe(
      true,
    );
  });
});

describe("aggregateVerifyScores", () => {
  it("fails invented repos even with high similarity", () => {
    const result = aggregateVerifyScores(
      [{ id: "basics.summary", score: 0.99, neighborId: "basics.summary", low: false }],
      [{ path: "repos.1", kind: "added" }],
      true,
    );
    expect(result.passed).toBe(false);
    expect(result.doctored).toBe(true);
  });

  it("fails untrusted models", () => {
    const result = aggregateVerifyScores(
      [{ id: "basics.summary", score: 0.99, neighborId: "basics.summary", low: false }],
      [],
      false,
    );
    expect(result.passed).toBe(false);
    expect(result.modelTrusted).toBe(false);
  });
});
