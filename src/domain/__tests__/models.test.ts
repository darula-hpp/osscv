import { describe, expect, it } from "vitest";
import { isTrustedCvModel, TRUSTED_CV_MODELS } from "../models";

describe("isTrustedCvModel", () => {
  it("accepts allowlisted models", () => {
    expect(isTrustedCvModel("cursor_run")).toBe(true);
    expect(isTrustedCvModel("Cursor default")).toBe(true);
    expect(TRUSTED_CV_MODELS.length).toBeGreaterThan(0);
  });

  it("rejects unknown and empty models", () => {
    expect(isTrustedCvModel("totally-unknown-model")).toBe(false);
    expect(isTrustedCvModel("")).toBe(false);
    expect(isTrustedCvModel("   ")).toBe(false);
  });
});
