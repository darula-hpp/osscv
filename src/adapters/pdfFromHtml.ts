import type { PdfExporter } from "../ports/pdfExporter";

/**
 * HTML → PDF via Playwright when Chromium is available.
 * Falls back to a minimal text PDF so download never hard-fails in CI/serverless.
 */
export class PdfFromHtml implements PdfExporter {
  async exportPdf(html: string): Promise<Uint8Array> {
    try {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ headless: true });
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "load" });
        const buf = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
        });
        return new Uint8Array(buf);
      } finally {
        await browser.close();
      }
    } catch {
      return buildMinimalPdfFromHtml(html);
    }
  }
}

/** Very small PDF writer: one page of extracted text (no native deps). */
function buildMinimalPdfFromHtml(html: string): Uint8Array {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3500);

  const escaped = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const lines: string[] = [];
  const width = 90;
  for (let i = 0; i < escaped.length; i += width) {
    lines.push(escaped.slice(i, i + width));
  }
  if (!lines.length) lines.push("Open Source CV");

  const contentLines = ["BT", "/F1 10 Tf", "50 780 Td", "14 TL"];
  lines.slice(0, 50).forEach((line, idx) => {
    if (idx === 0) contentLines.push(`(${line}) Tj`);
    else contentLines.push(`T* (${line}) Tj`);
  });
  contentLines.push("ET");
  const stream = contentLines.join("\n");

  const objects: string[] = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj");
  objects.push(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
  );
  objects.push(
    `4 0 obj<< /Length ${Buffer.byteLength(stream, "utf8")} >>stream\n${stream}\nendstream endobj`,
  );
  objects.push("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj + "\n";
  }
  const xref = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Uint8Array(Buffer.from(pdf, "utf8"));
}
