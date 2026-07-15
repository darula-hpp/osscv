/** Doctoring / drift thresholds — policy object, not magic numbers in call sites. */

export type VerifyThresholds = {
  /** Mean section similarity must be >= this to pass. */
  overallMin: number;
  /** Any section below this is flagged low and fails the CV. */
  sectionMin: number;
};

export const DEFAULT_VERIFY_THRESHOLDS: VerifyThresholds = {
  overallMin: 0.82,
  sectionMin: 0.65,
};
