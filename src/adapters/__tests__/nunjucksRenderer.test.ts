import { describe, expect, it } from "vitest";
import { sampleDocument } from "../../testing/sampleDocument";
import { TEMPLATES_DIR } from "../../testing/paths";
import { NunjucksRenderer } from "../nunjucksRenderer";

describe("NunjucksRenderer", () => {
  it("renders HTML with name, handle, and model footer", () => {
    const renderer = new NunjucksRenderer({ templatesDir: TEMPLATES_DIR });
    const html = renderer.render(sampleDocument, "cv.jinja", {
      liveProfileUrl: "https://gitwork.getuigen.dev/ada",
      gitworkHomeUrl: "https://gitwork.getuigen.dev",
      generatedAt: "15 Jul 2026",
      model: "gpt-5.4-mini",
      osscvRepoUrl: "https://github.com/gitwork-oss/osscv",
    });
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("@ada");
    expect(html).toContain("ada/engine");
    expect(html).toContain("gpt-5.4-mini");
    expect(html).toContain("github.com/gitwork-oss/osscv");
    expect(html).not.toMatch(/[\u2014\u2013]/);
  });
});
