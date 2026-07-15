import { HashingEmbedder } from "../adapters/hashingEmbedder";
import { HnswIndex } from "../adapters/hnswIndex";
import { NunjucksRenderer } from "../adapters/nunjucksRenderer";
import { PdfFromHtml } from "../adapters/pdfFromHtml";
import type { Embedder } from "../ports/embedder";
import type { PdfExporter } from "../ports/pdfExporter";
import type { TemplateRenderer } from "../ports/templateRenderer";
import type { VectorIndex } from "../ports/vectorIndex";
import type { TrustedModelPolicy } from "../domain/models";
import type { VerifyThresholds } from "../domain/thresholds";
import { OssCvService, type OssCvServiceDeps } from "./ossCvService";

export type CreateOssCvServiceOptions = {
  embedder?: Embedder;
  createIndex?: () => VectorIndex;
  renderer?: TemplateRenderer;
  pdfExporter?: PdfExporter;
  thresholds?: VerifyThresholds;
  modelPolicy?: TrustedModelPolicy;
  templatesDir?: string;
};

/** Composition root / factory — wire defaults once. */
export function createOssCvService(opts: CreateOssCvServiceOptions = {}): OssCvService {
  const deps: OssCvServiceDeps = {
    embedder: opts.embedder ?? new HashingEmbedder(),
    createIndex: opts.createIndex ?? (() => new HnswIndex()),
    renderer:
      opts.renderer ??
      new NunjucksRenderer({
        templatesDir: opts.templatesDir,
      }),
    pdfExporter: opts.pdfExporter ?? new PdfFromHtml(),
    thresholds: opts.thresholds,
    modelPolicy: opts.modelPolicy,
  };
  return new OssCvService(deps);
}
