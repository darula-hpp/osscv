import { describe, expect, it } from "vitest";
import { PdfFromHtml } from "../pdfFromHtml";

function asPdfBytes(result: unknown): Uint8Array {
  if (result instanceof Uint8Array) return result;
  if (result && typeof result === "object" && "pdf" in result) {
    return (result as { pdf: Uint8Array }).pdf;
  }
  throw new Error("unexpected PDF export result");
}

describe("PdfFromHtml", () => {
  it("exports PDF bytes from HTML", async () => {
    const exporter = new PdfFromHtml();
    const pdf = asPdfBytes(
      await exporter.exportPdf("<html><body><h1>Ada</h1></body></html>"),
    );
    expect(pdf.byteLength).toBeGreaterThan(100);
    expect(Buffer.from(pdf.slice(0, 5)).toString("utf8")).toBe("%PDF-");
  });
});
