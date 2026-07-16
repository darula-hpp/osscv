import type { OssCvDocument } from "../domain/schema";

/** Modest Open Source CV fixture for unit tests. */
export const sampleDocument: OssCvDocument = {
  basics: {
    name: "Ada Lovelace",
    label: "Open source systems engineer",
    summary: "Builds reliable open source infrastructure and developer tools.",
    location: "London",
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
    },
  ],
  oss: [{ repo: "ada/engine", role: "Maintainer", impact: "Core runtime and docs." }],
};
