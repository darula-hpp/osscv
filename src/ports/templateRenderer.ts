import type { OssCvDocument } from "../domain/schema";

/** Extra template vars (live links, attribution). */
export type CvRenderContext = {
  liveProfileUrl?: string;
  gitworkHomeUrl?: string;
  /** Public GitHub repo for the osscv format / verify package (auditor link). */
  osscvRepoUrl?: string;
  generatedAt?: string;
  /** LLM model that produced the CV genesis (footer attribution). */
  model?: string;
};

/** Port: Jinja-compatible template → HTML. */
export type TemplateRenderer = {
  render(
    document: OssCvDocument,
    templateName?: string,
    context?: CvRenderContext,
  ): Promise<string> | string;
};
