# osscv — Open Source CV

Auditable TypeScript library for generating, rendering, and verifying **Open Source CVs** (public GitHub evidence only — not traditional resumes).

- **Jinja-syntax templates** via Nunjucks (`templates/cv.jinja`)
- **Genesis snapshots** with section embeddings and SHA-256 content hash
- **HNSW nearest-neighbor** doctoring checks against configurable thresholds
- **Ports and adapters** so embedders, indexes, PDF engines, and LLM hosts stay swappable

Used in production by [Gitwork](https://gitwork.getuigen.dev).

## Design

| Layer | Role |
|-------|------|
| `domain/` | Pure parse, sectionize, hash, score, model policy |
| `ports/` | `Embedder`, `VectorIndex`, `TemplateRenderer`, `PdfExporter`, `CvGenerator` |
| `adapters/` | Hashing embedder, HNSW, Nunjucks, HTML→PDF |
| `application/` | `OssCvService` facade + `createOssCvService` factory |

## Schema (OSS only)

- `basics` — identity, summary, location (full country name), GitHub handle/avatar
- `skills` — skill groups + keywords
- `repos` — public repositories with summaries (no invented repos)
- `oss` — notable contribution impact

No employers, job history, or education sections.

## Algorithms

1. **Sectionize** — `basics.summary`, `skills`, each `repos.*` / `oss.*`
2. **Genesis** — immutable `{ document, model, promptVersion, contentHash, sections[] }`
3. **Embed** — injectable; default `HashingEmbedder` (384-d, portable)
4. **Verify** — HNSW (or exact for N≤64); fail if mean `< 0.82`, any section `< 0.65`, invented `repos.*`, or untrusted model
5. **Structural diff** — JSON path added/removed/changed for UI

## Trusted models

See `TRUSTED_CV_MODELS` in `src/domain/models.ts`. Genesis from other models is marked `untrusted` and fails verify.

## Usage

```bash
npm install osscv nunjucks
```

```ts
import { createOssCvService, parseOssCvDocument } from "osscv";

const svc = createOssCvService();
const document = parseOssCvDocument(cvJson);
const genesis = await svc.createGenesis({
  document,
  model: "Cursor default",
});
const result = await svc.verify({ genesis, candidate: editedJson });
const html = await svc.renderHtml(genesis.document, undefined, {
  liveProfileUrl: "https://gitwork.getuigen.dev/login",
  gitworkHomeUrl: "https://gitwork.getuigen.dev",
});
const pdf = await svc.renderPdf(document);
```

## Security

This package contains **no API keys, tokens, or credentials**. Host apps inject LLM/MCP and database adapters separately.

## License

MIT
