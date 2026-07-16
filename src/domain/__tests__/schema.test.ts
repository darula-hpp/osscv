import { describe, expect, it } from "vitest";
import { sampleDocument } from "../../testing/sampleDocument";
import { parseOssCvDocument } from "../schema";

describe("parseOssCvDocument", () => {
  it("accepts a well-formed document", () => {
    const doc = parseOssCvDocument(sampleDocument);
    expect(doc.basics.name).toBe("Ada Lovelace");
    expect(doc.repos).toHaveLength(1);
  });

  it("maps legacy projects[] into repos and drops experience", () => {
    const doc = parseOssCvDocument({
      basics: sampleDocument.basics,
      skills: sampleDocument.skills,
      projects: [
        {
          name: "legacy-repo",
          description: "Old project shape",
          highlights: ["one"],
        },
      ],
      oss: [],
      experience: [{ company: "Nope", position: "CEO", summary: "ignored" }],
    });
    expect(doc.repos).toEqual([
      {
        name: "legacy-repo",
        summary: "Old project shape",
      },
    ]);
    expect(doc).not.toHaveProperty("experience");
  });
});
