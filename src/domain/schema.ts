/** Open Source CV document — LLM and form boundary DTO (OSS only). */

export type OssCvProfileLink = {
  network: string;
  url: string;
  username?: string;
};

export type OssCvBasics = {
  name: string;
  label: string;
  summary: string;
  /** GitHub avatar URL (enriched from scout card; not invented by the LLM). */
  image?: string;
  /** GitHub login / handle without @. */
  github?: string;
  location?: string;
  email?: string;
  url?: string;
  profiles: OssCvProfileLink[];
};

export type OssCvSkill = {
  name: string;
  keywords: string[];
};

/** A public GitHub repository featured on the Open Source CV. */
export type OssCvRepo = {
  /** Repo name or owner/name. */
  name: string;
  url?: string;
  /** Short summary of what the repo is / does. */
  summary: string;
  language?: string;
  stars?: number;
};

/** Notable OSS contribution (often to others' repos). */
export type OssCvOssContribution = {
  repo: string;
  role: string;
  impact: string;
};

export type OssCvDocument = {
  basics: OssCvBasics;
  skills: OssCvSkill[];
  repos: OssCvRepo[];
  oss: OssCvOssContribution[];
};

export type OssCvSection = {
  id: string;
  text: string;
  embedding?: number[];
};

export type OssCvGenesis = {
  document: OssCvDocument;
  model: string;
  promptVersion: string;
  createdAt: string;
  contentHash: string;
  sections: OssCvSection[];
  untrusted: boolean;
};

export type StructuralChange = {
  path: string;
  kind: "added" | "removed" | "changed";
};

export type SectionReport = {
  id: string;
  score: number;
  neighborId: string | null;
  low: boolean;
};

export type VerifyResult = {
  doctored: boolean;
  overall: number;
  passed: boolean;
  sectionReports: SectionReport[];
  structuralChanges: StructuralChange[];
  modelTrusted: boolean;
};

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.replace(/\u2014|\u2013/g, "-").trim() : fallback;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => asString(x)).filter(Boolean);
}

function parseProfiles(v: unknown): OssCvProfileLink[] {
  if (!Array.isArray(v)) return [];
  const out: OssCvProfileLink[] = [];
  for (const p of v) {
    if (!p || typeof p !== "object") continue;
    const o = p as Record<string, unknown>;
    const network = asString(o.network);
    const url = asString(o.url);
    if (!network || !url) continue;
    const username = asString(o.username);
    out.push({ network, url, ...(username ? { username } : {}) });
  }
  return out;
}

function parseSkills(v: unknown): OssCvSkill[] {
  if (!Array.isArray(v)) return [];
  const out: OssCvSkill[] = [];
  for (const s of v) {
    if (!s || typeof s !== "object") continue;
    const o = s as Record<string, unknown>;
    const name = asString(o.name);
    if (!name) continue;
    out.push({ name, keywords: asStringArray(o.keywords) });
  }
  return out;
}

function parseRepos(v: unknown): OssCvRepo[] {
  if (!Array.isArray(v)) return [];
  const out: OssCvRepo[] = [];
  for (const p of v) {
    if (!p || typeof p !== "object") continue;
    const o = p as Record<string, unknown>;
    const name = asString(o.name) || asString(o.repo);
    if (!name) continue;
    const url = asString(o.url);
    const language = asString(o.language);
    const summary =
      asString(o.summary) ||
      asString(o.description) ||
      asStringArray(o.highlights).join("; ");
    const starsRaw = o.stars;
    const stars =
      typeof starsRaw === "number" && Number.isFinite(starsRaw)
        ? Math.max(0, Math.round(starsRaw))
        : undefined;
    out.push({
      name,
      summary,
      ...(url ? { url } : {}),
      ...(language ? { language } : {}),
      ...(stars != null ? { stars } : {}),
    });
  }
  return out;
}

function parseOss(v: unknown): OssCvOssContribution[] {
  if (!Array.isArray(v)) return [];
  const out: OssCvOssContribution[] = [];
  for (const p of v) {
    if (!p || typeof p !== "object") continue;
    const o = p as Record<string, unknown>;
    const repo = asString(o.repo);
    if (!repo) continue;
    out.push({
      repo,
      role: asString(o.role),
      impact: asString(o.impact),
    });
  }
  return out;
}

/** Parse and sanitize LLM / form JSON into OssCvDocument. Throws on missing basics. */
export function parseOssCvDocument(input: unknown): OssCvDocument {
  if (!input || typeof input !== "object") {
    throw new Error("CV document must be an object.");
  }
  const root = input as Record<string, unknown>;
  const basicsRaw = root.basics;
  if (!basicsRaw || typeof basicsRaw !== "object") {
    throw new Error("CV document requires basics.");
  }
  const b = basicsRaw as Record<string, unknown>;
  const name = asString(b.name);
  if (!name) throw new Error("CV basics.name is required.");

  const image = asString(b.image);
  const github = asString(b.github).replace(/^@/, "");

  // Prefer repos[]; accept legacy projects[] from older genesis payloads.
  const reposRaw = root.repos ?? root.projects;

  return {
    basics: {
      name,
      label: asString(b.label) || "Open Source Engineer",
      summary: asString(b.summary),
      ...(image ? { image } : {}),
      ...(github ? { github } : {}),
      location: asString(b.location) || undefined,
      email: asString(b.email) || undefined,
      url: asString(b.url) || undefined,
      profiles: parseProfiles(b.profiles),
    },
    skills: parseSkills(root.skills),
    repos: parseRepos(reposRaw),
    oss: parseOss(root.oss),
  };
}

/** Strip markdown fences and parse JSON CV payload from an LLM. */
export function parseOssCvFromLlmText(raw: string): OssCvDocument {
  let text = raw.replace(/\u2014|\u2013/g, "-").trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  return parseOssCvDocument(JSON.parse(text) as unknown);
}
