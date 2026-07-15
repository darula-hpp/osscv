/** Port: HTML (or document) → PDF bytes. */
export type PdfExporter = {
  exportPdf(html: string): Promise<Uint8Array>;
};
