import { describe, expect, it } from "vitest";
import * as osscv from "../index";
import { sampleDocument } from "../testing/sampleDocument";

describe("index", () => {
  it("exports the public API surface", () => {
    expect(typeof osscv.createOssCvService).toBe("function");
    expect(typeof osscv.parseOssCvDocument).toBe("function");
    expect(typeof osscv.sectionize).toBe("function");
    expect(typeof osscv.canonicalHash).toBe("function");
    expect(osscv.DEFAULT_VERIFY_THRESHOLDS.overallMin).toBe(0.82);
  });

  it("hashes via the package entry", () => {
    expect(osscv.canonicalHash(sampleDocument)).toHaveLength(64);
  });
});
