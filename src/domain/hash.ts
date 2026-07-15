import { createHash } from "node:crypto";
import type { OssCvDocument } from "./schema";

/** Deterministic JSON stringify with sorted object keys. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalize(v)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(",")}}`;
}

export function canonicalHash(document: OssCvDocument): string {
  return createHash("sha256").update(canonicalize(document)).digest("hex");
}
