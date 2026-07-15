import type { OssCvDocument, OssCvSection } from "./schema";

function joinParts(...parts: string[]): string {
  return parts.map((p) => p.trim()).filter(Boolean).join(" | ");
}

/** Split a CV into stable text chunks for embedding and HNSW verify. */
export function sectionize(document: OssCvDocument): OssCvSection[] {
  const sections: OssCvSection[] = [];

  const summary = joinParts(
    document.basics.name,
    document.basics.label,
    document.basics.summary,
    document.basics.location ?? "",
    document.basics.github ?? "",
  );
  if (summary) sections.push({ id: "basics.summary", text: summary });

  if (document.skills.length) {
    const skillsText = document.skills
      .map((s) => joinParts(s.name, s.keywords.join(", ")))
      .join("; ");
    sections.push({ id: "skills", text: skillsText });
  }

  document.repos.forEach((r, i) => {
    const text = joinParts(r.name, r.summary, r.url ?? "", r.language ?? "");
    if (text) sections.push({ id: `repos.${i}`, text });
  });

  document.oss.forEach((o, i) => {
    const text = joinParts(o.repo, o.role, o.impact);
    if (text) sections.push({ id: `oss.${i}`, text });
  });

  return sections;
}
