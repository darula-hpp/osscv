import type { OssCvDocument } from "../domain/schema";

/** Port: LLM (or other) generator of structured CV JSON. */
export type CvGeneratorResult = {
  document: OssCvDocument;
  model: string;
  rawText?: string;
};

export type CvGenerator = {
  generate(input: {
    systemPrompt: string;
    userPrompt: string;
  }): Promise<CvGeneratorResult>;
};
