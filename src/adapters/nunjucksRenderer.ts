import fs from "node:fs";
import path from "node:path";
import nunjucks from "nunjucks";
import type { OssCvDocument } from "../domain/schema";
import type { CvRenderContext, TemplateRenderer } from "../ports/templateRenderer";

function defaultTemplatesDir(): string {
  return path.resolve(process.cwd(), "templates");
}

export class NunjucksRenderer implements TemplateRenderer {
  private readonly env: nunjucks.Environment;
  private readonly defaultTemplate: string;
  private readonly templatesDir: string;

  constructor(opts?: { templatesDir?: string; defaultTemplate?: string }) {
    this.templatesDir = opts?.templatesDir ?? defaultTemplatesDir();
    this.defaultTemplate = opts?.defaultTemplate ?? "cv.jinja";
    this.env = nunjucks.configure(this.templatesDir, {
      autoescape: true,
      throwOnUndefined: false,
      noCache: process.env.NODE_ENV !== "production",
    });
  }

  render(
    document: OssCvDocument,
    templateName = this.defaultTemplate,
    context: CvRenderContext = {},
  ): string {
    const full = path.join(this.templatesDir, templateName);
    if (!fs.existsSync(full)) {
      throw new Error(`CV template not found: ${full}`);
    }
    const github =
      document.basics.github ||
      document.basics.profiles.find((p) => /github/i.test(p.network))?.username ||
      "";
    return this.env.render(templateName, {
      cv: document,
      github,
      nameInitial: (document.basics.name.trim()[0] || "?").toUpperCase(),
      meta: {
        liveProfileUrl: context.liveProfileUrl ?? "",
        gitworkHomeUrl: context.gitworkHomeUrl ?? "https://gitwork.getuigen.dev",
        osscvRepoUrl: context.osscvRepoUrl ?? "https://github.com/darula-hpp/osscv",
        generatedAt: context.generatedAt ?? "",
      },
    });
  }
}
