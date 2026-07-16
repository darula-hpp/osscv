import { describe, expect, it } from "vitest";
import { BruteForceIndex } from "../../adapters/bruteForceIndex";
import { HashingEmbedder } from "../../adapters/hashingEmbedder";
import { HnswIndex } from "../../adapters/hnswIndex";
import { sampleDocument } from "../../testing/sampleDocument";
import { TEMPLATES_DIR } from "../../testing/paths";
import { createOssCvService } from "../createOssCvService";

describe("OssCvService", () => {
  it("passes a near-copy against genesis", async () => {
    const svc = createOssCvService({
      embedder: new HashingEmbedder(),
      createIndex: () => new HnswIndex(),
      templatesDir: TEMPLATES_DIR,
    });
    const genesis = await svc.createGenesis({
      document: sampleDocument,
      model: "cursor_run",
    });
    expect(genesis.untrusted).toBe(false);

    const candidate = structuredClone(sampleDocument);
    candidate.basics.summary =
      "Builds reliable open source infrastructure and developer tools with care.";

    const result = await svc.verify({ genesis, candidate });
    expect(result.passed).toBe(true);
    expect(result.doctored).toBe(false);
    expect(result.overall).toBeGreaterThan(0.82);
  });

  it("fails heavily rewritten summary and invented repos", async () => {
    const svc = createOssCvService({
      embedder: new HashingEmbedder(),
      createIndex: () => new BruteForceIndex(),
      templatesDir: TEMPLATES_DIR,
    });
    const genesis = await svc.createGenesis({
      document: sampleDocument,
      model: "cursor_run",
    });

    const candidate = structuredClone(sampleDocument);
    candidate.basics.summary =
      "World famous astronaut and private equity partner with classified patents.";
    candidate.repos = [
      ...candidate.repos,
      {
        name: "fake/private-corp",
        summary: "Secret proprietary platform pretending to be open source.",
      },
    ];

    const result = await svc.verify({ genesis, candidate });
    expect(result.doctored).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.structuralChanges.some((c) => c.path.startsWith("repos"))).toBe(true);
  });

  it("marks untrusted models", async () => {
    const svc = createOssCvService({ templatesDir: TEMPLATES_DIR });
    const genesis = await svc.createGenesis({
      document: sampleDocument,
      model: "totally-unknown-model",
    });
    expect(genesis.untrusted).toBe(true);
    const result = await svc.verify({ genesis, candidate: sampleDocument });
    expect(result.passed).toBe(false);
  });

  it("renders HTML with repos and model", async () => {
    const svc = createOssCvService({ templatesDir: TEMPLATES_DIR });
    const html = await svc.renderHtml(sampleDocument, undefined, {
      liveProfileUrl: "https://gitwork.getuigen.dev/ada",
      gitworkHomeUrl: "https://gitwork.getuigen.dev",
      generatedAt: "15 Jul 2026",
      model: "gpt-5.4-mini",
    });
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("@ada");
    expect(html).toContain("Repositories");
    expect(html).toContain("gpt-5.4-mini");
    expect(html).not.toContain("Experience");
  });

  it("exports PDF bytes", async () => {
    const svc = createOssCvService({ templatesDir: TEMPLATES_DIR });
    const result = await svc.renderPdf(sampleDocument);
    const pdf =
      result instanceof Uint8Array ? result : (result as { pdf: Uint8Array }).pdf;
    expect(pdf.byteLength).toBeGreaterThan(100);
    expect(Buffer.from(pdf.slice(0, 5)).toString("utf8")).toBe("%PDF-");
  });
});
