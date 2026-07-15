import type { CvRenderContext } from "../ports/templateRenderer";
import type { Embedder } from "../ports/embedder";
import type { PdfExporter } from "../ports/pdfExporter";
import type { TemplateRenderer } from "../ports/templateRenderer";
import type { VectorIndex } from "../ports/vectorIndex";
import {
  isTrustedCvModel,
  type TrustedModelPolicy,
  DEFAULT_TRUSTED_MODEL_POLICY,
} from "../domain/models";
import { canonicalHash } from "../domain/hash";
import { sectionize } from "../domain/sectionize";
import { aggregateVerifyScores, diffDocuments } from "../domain/scores";
import {
  parseOssCvDocument,
  type OssCvDocument,
  type OssCvGenesis,
  type OssCvSection,
  type VerifyResult,
} from "../domain/schema";
import {
  DEFAULT_VERIFY_THRESHOLDS,
  type VerifyThresholds,
} from "../domain/thresholds";

export const OSSCV_PROMPT_VERSION = "v2-oss-repos";

export type OssCvServiceDeps = {
  embedder: Embedder;
  createIndex: () => VectorIndex;
  renderer: TemplateRenderer;
  pdfExporter: PdfExporter;
  thresholds?: VerifyThresholds;
  modelPolicy?: TrustedModelPolicy;
};

/** Facade: genesis, verify, render, PDF. */
export class OssCvService {
  private readonly embedder: Embedder;
  private readonly createIndex: () => VectorIndex;
  private readonly renderer: TemplateRenderer;
  private readonly pdfExporter: PdfExporter;
  private readonly thresholds: VerifyThresholds;
  private readonly modelPolicy: TrustedModelPolicy;

  constructor(deps: OssCvServiceDeps) {
    this.embedder = deps.embedder;
    this.createIndex = deps.createIndex;
    this.renderer = deps.renderer;
    this.pdfExporter = deps.pdfExporter;
    this.thresholds = deps.thresholds ?? DEFAULT_VERIFY_THRESHOLDS;
    this.modelPolicy = deps.modelPolicy ?? DEFAULT_TRUSTED_MODEL_POLICY;
  }

  async createGenesis(input: {
    document: unknown;
    model: string;
    promptVersion?: string;
    createdAt?: string;
  }): Promise<OssCvGenesis> {
    const document = parseOssCvDocument(input.document);
    const model = input.model.trim() || "unknown";
    const untrusted = !isTrustedCvModel(model, this.modelPolicy);
    const sections = await this.embedSections(sectionize(document));
    return {
      document,
      model,
      promptVersion: input.promptVersion ?? OSSCV_PROMPT_VERSION,
      createdAt: input.createdAt ?? new Date().toISOString(),
      contentHash: canonicalHash(document),
      sections,
      untrusted,
    };
  }

  async verify(input: {
    genesis: OssCvGenesis;
    candidate: unknown;
    thresholds?: VerifyThresholds;
  }): Promise<VerifyResult> {
    const thresholds = input.thresholds ?? this.thresholds;
    const candidate = parseOssCvDocument(input.candidate);
    const structuralChanges = diffDocuments(input.genesis.document, candidate);
    const candidateSections = await this.embedSections(sectionize(candidate));

    const index = this.createIndex();
    const genesisWithVectors = input.genesis.sections.filter(
      (s) => s.embedding && s.embedding.length,
    );
    index.build(
      genesisWithVectors.map((s) => ({
        id: s.id,
        embedding: s.embedding!,
      })),
    );

    const sectionReports = candidateSections.map((section) => {
      const hits = section.embedding?.length
        ? index.search(section.embedding, 1)
        : [];
      const hit = hits[0];
      const score = hit?.score ?? 0;
      return {
        id: section.id,
        score,
        neighborId: hit?.id ?? null,
        low: score < thresholds.sectionMin,
      };
    });

    return aggregateVerifyScores(
      sectionReports,
      structuralChanges,
      !input.genesis.untrusted && isTrustedCvModel(input.genesis.model, this.modelPolicy),
      thresholds,
    );
  }

  /** Ingest structured candidate JSON and verify against a genesis snapshot. */
  async ingestAndVerify(
    genesis: OssCvGenesis,
    candidateJson: unknown,
    thresholds?: VerifyThresholds,
  ): Promise<VerifyResult> {
    return this.verify({ genesis, candidate: candidateJson, thresholds });
  }

  async renderHtml(
    document: OssCvDocument,
    templateName?: string,
    context?: CvRenderContext,
  ): Promise<string> {
    return this.renderer.render(document, templateName, context);
  }

  async renderPdf(
    document: OssCvDocument,
    templateName?: string,
    context?: CvRenderContext,
  ): Promise<Uint8Array> {
    const html = await this.renderHtml(document, templateName, context);
    return this.pdfExporter.exportPdf(html);
  }

  private async embedSections(sections: OssCvSection[]): Promise<OssCvSection[]> {
    const out: OssCvSection[] = [];
    for (const section of sections) {
      const embedding = await this.embedder.embed(section.text);
      out.push({ ...section, embedding });
    }
    return out;
  }
}
