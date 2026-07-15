import type { SectionReport, StructuralChange, VerifyResult } from "./schema";
import type { VerifyThresholds } from "./thresholds";
import { DEFAULT_VERIFY_THRESHOLDS } from "./thresholds";

export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function aggregateVerifyScores(
  sectionReports: SectionReport[],
  structuralChanges: StructuralChange[],
  modelTrusted: boolean,
  thresholds: VerifyThresholds = DEFAULT_VERIFY_THRESHOLDS,
): VerifyResult {
  const overall = mean(sectionReports.map((r) => r.score));
  const anyLow = sectionReports.some((r) => r.score < thresholds.sectionMin);
  const inventedRepos = structuralChanges.some(
    (c) => c.kind === "added" && c.path.startsWith("repos"),
  );
  const passed =
    modelTrusted &&
    overall >= thresholds.overallMin &&
    !anyLow &&
    !inventedRepos;
  return {
    doctored: !passed,
    overall,
    passed,
    sectionReports,
    structuralChanges,
    modelTrusted,
  };
}

/** Field-level JSON path diff for UI + structural hard fails. */
export function diffDocuments(
  genesis: unknown,
  candidate: unknown,
  path = "",
): StructuralChange[] {
  const changes: StructuralChange[] = [];

  if (genesis === candidate) return changes;

  if (Array.isArray(genesis) || Array.isArray(candidate)) {
    const gArr = Array.isArray(genesis) ? genesis : [];
    const cArr = Array.isArray(candidate) ? candidate : [];
    const max = Math.max(gArr.length, cArr.length);
    for (let i = 0; i < max; i++) {
      const p = path ? `${path}.${i}` : String(i);
      if (i >= gArr.length) {
        changes.push({ path: p, kind: "added" });
      } else if (i >= cArr.length) {
        changes.push({ path: p, kind: "removed" });
      } else {
        changes.push(...diffDocuments(gArr[i], cArr[i], p));
      }
    }
    return changes;
  }

  if (
    genesis !== null &&
    candidate !== null &&
    typeof genesis === "object" &&
    typeof candidate === "object"
  ) {
    const g = genesis as Record<string, unknown>;
    const c = candidate as Record<string, unknown>;
    const keys = new Set([...Object.keys(g), ...Object.keys(c)]);
    for (const key of keys) {
      const p = path ? `${path}.${key}` : key;
      if (!(key in g)) changes.push({ path: p, kind: "added" });
      else if (!(key in c)) changes.push({ path: p, kind: "removed" });
      else changes.push(...diffDocuments(g[key], c[key], p));
    }
    return changes;
  }

  if (genesis !== candidate) {
    changes.push({ path: path || "$", kind: "changed" });
  }
  return changes;
}
