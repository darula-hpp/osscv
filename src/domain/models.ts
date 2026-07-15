/** Models allowed to produce genesis Open Source CVs. */

export const TRUSTED_CV_MODELS = [
  "Cursor default",
  "cursor_run", // legacy stored genesis label
  "composer-2",
  "composer-2.5",
  "claude-4-sonnet",
  "claude-4-opus",
  "claude-sonnet-4",
  "claude-opus-4",
  "gpt-5",
  "gpt-4.1",
] as const;

export type TrustedCvModel = (typeof TRUSTED_CV_MODELS)[number];

export type TrustedModelPolicy = {
  allowlist: readonly string[];
};

export const DEFAULT_TRUSTED_MODEL_POLICY: TrustedModelPolicy = {
  allowlist: TRUSTED_CV_MODELS,
};

export function isTrustedCvModel(
  model: string,
  policy: TrustedModelPolicy = DEFAULT_TRUSTED_MODEL_POLICY,
): boolean {
  const m = model.trim().toLowerCase();
  if (!m) return false;
  return policy.allowlist.some((allowed) => {
    const a = allowed.toLowerCase();
    if (a.endsWith("*")) return m.startsWith(a.slice(0, -1));
    return m === a || m.startsWith(`${a}-`) || m.startsWith(`${a}/`);
  });
}
