import { describe, expect, it } from "vitest";
import { TEMPLATES_DIR } from "../../testing/paths";
import { createOssCvService } from "../createOssCvService";

describe("createOssCvService", () => {
  it("returns a wired OssCvService", () => {
    const svc = createOssCvService({ templatesDir: TEMPLATES_DIR });
    expect(typeof svc.createGenesis).toBe("function");
    expect(typeof svc.verify).toBe("function");
    expect(typeof svc.renderHtml).toBe("function");
  });
});
