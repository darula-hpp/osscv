import { describe, expect, it } from "vitest";
import { DEFAULT_VERIFY_THRESHOLDS } from "../thresholds";

describe("DEFAULT_VERIFY_THRESHOLDS", () => {
  it("keeps section floor below overall floor", () => {
    expect(DEFAULT_VERIFY_THRESHOLDS.sectionMin).toBeLessThan(
      DEFAULT_VERIFY_THRESHOLDS.overallMin,
    );
    expect(DEFAULT_VERIFY_THRESHOLDS.overallMin).toBe(0.82);
    expect(DEFAULT_VERIFY_THRESHOLDS.sectionMin).toBe(0.65);
  });
});
