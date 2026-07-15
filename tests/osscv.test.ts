import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BruteForceIndex,
  HashingEmbedder,
  HnswIndex,
  canonicalHash,
  createOssCvService,
  parseOssCvDocument,
  sectionize,
  type OssCvDocument,
} from "../src/index";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesDir = path.join(root, "templates");

const sample: OssCvDocument = {
  basics: {
    name: "Ada Lovelace",
    label: "Open source systems engineer",
    summary: "Builds reliable open source infrastructure and developer tools.",
    location: "United Kingdom",
    github: "ada",
    profiles: [{ network: "GitHub", url: "https://github.com/ada", username: "ada" }],
  },
  skills: [{ name: "Languages", keywords: ["TypeScript", "Rust", "Python"] }],
  repos: [
    {
      name: "ada/engine",
      url: "https://github.com/ada/engine",
      summary: "Public notes and algorithms for computation.",
      language: "Rust",
      stars: 42,
    },
  ],
  oss: [{ repo: "ada/engine", role: "Maintainer", impact: "Core runtime and docs." }],
};

describe("osscv", () => {
  it("sectionizes stable ids", () => {
    expect(sectionize(sample).map((s) => s.id)).toEqual([
      "basics.summary",
      "skills",
      "repos.0",
      "oss.0",
    ]);
  });

  it("hashes canonically", () => {
    expect(canonicalHash(sample)).toBe(canonicalHash(structuredClone(sample)));
  });

  it("verifies a near-copy and rejects invented repos", async () => {
    const svc = createOssCvService({
      embedder: new HashingEmbedder(),
      createIndex: () => new BruteForceIndex(),
      templatesDir,
    });
    const genesis = await svc.createGenesis({ document: sample, model: "Cursor default" });
    const near = structuredClone(sample);
    near.basics.summary =
      "Builds reliable open source infrastructure and developer tools with care.";
    expect((await svc.verify({ genesis, candidate: near })).passed).toBe(true);

    const doctored = structuredClone(sample);
    doctored.repos.push({
      name: "fake/private-corp",
      summary: "Secret proprietary platform.",
    });
    const bad = await svc.verify({ genesis, candidate: doctored });
    expect(bad.passed).toBe(false);
    expect(bad.structuralChanges.some((c) => c.path.startsWith("repos"))).toBe(true);
  });

  it("renders recruiter-facing HTML", async () => {
    const svc = createOssCvService({
      embedder: new HashingEmbedder(),
      createIndex: () => new HnswIndex(),
      templatesDir,
    });
    const html = await svc.renderHtml(
      parseOssCvDocument({
        ...sample,
        basics: {
          ...sample.basics,
          image: "https://avatars.githubusercontent.com/u/1?v=4",
        },
      }),
      undefined,
      {
        liveProfileUrl: "https://gitwork.getuigen.dev/ada",
        gitworkHomeUrl: "https://gitwork.getuigen.dev",
      },
    );
    expect(html).toContain("@ada");
    expect(html).toContain("Repositories");
    expect(html).toContain("Verified on Gitwork");
    expect(html).not.toContain("your Gitwork profile");
  });
});
