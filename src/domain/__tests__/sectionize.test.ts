import { describe, expect, it } from "vitest";
import { sampleDocument } from "../../testing/sampleDocument";
import { sectionize } from "../sectionize";

describe("sectionize", () => {
  it("emits stable section ids", () => {
    const sections = sectionize(sampleDocument);
    expect(sections.map((s) => s.id)).toEqual([
      "basics.summary",
      "skills",
      "repos.0",
      "oss.0",
    ]);
  });

  it("includes identity bits in the summary section text", () => {
    const summary = sectionize(sampleDocument).find((s) => s.id === "basics.summary");
    expect(summary?.text).toContain("Ada Lovelace");
    expect(summary?.text).toContain("ada");
  });
});
