/** Public API for the auditable Open Source CV package. */

export type {
  OssCvBasics,
  OssCvDocument,
  OssCvGenesis,
  OssCvOssContribution,
  OssCvProfileLink,
  OssCvRepo,
  OssCvSection,
  OssCvSkill,
  SectionReport,
  StructuralChange,
  VerifyResult,
} from "./domain/schema";
export { parseOssCvDocument, parseOssCvFromLlmText } from "./domain/schema";

export {
  TRUSTED_CV_MODELS,
  DEFAULT_TRUSTED_MODEL_POLICY,
  isTrustedCvModel,
} from "./domain/models";
export type { TrustedCvModel, TrustedModelPolicy } from "./domain/models";

export { DEFAULT_VERIFY_THRESHOLDS } from "./domain/thresholds";
export type { VerifyThresholds } from "./domain/thresholds";

export { sectionize } from "./domain/sectionize";
export { canonicalHash, canonicalize } from "./domain/hash";
export { aggregateVerifyScores, diffDocuments, mean } from "./domain/scores";

export type { Embedder } from "./ports/embedder";
export type { VectorIndex, VectorHit } from "./ports/vectorIndex";
export type { CvRenderContext } from "./ports/templateRenderer";
export type { TemplateRenderer } from "./ports/templateRenderer";
export type { PdfExporter } from "./ports/pdfExporter";
export type { CvGenerator, CvGeneratorResult } from "./ports/cvGenerator";

export { HashingEmbedder } from "./adapters/hashingEmbedder";
export { BruteForceIndex } from "./adapters/bruteForceIndex";
export { HnswIndex } from "./adapters/hnswIndex";
export { NunjucksRenderer } from "./adapters/nunjucksRenderer";
export { PdfFromHtml } from "./adapters/pdfFromHtml";

export { OssCvService, OSSCV_PROMPT_VERSION } from "./application/ossCvService";
export type { OssCvServiceDeps } from "./application/ossCvService";
export { createOssCvService } from "./application/createOssCvService";
export type { CreateOssCvServiceOptions } from "./application/createOssCvService";
