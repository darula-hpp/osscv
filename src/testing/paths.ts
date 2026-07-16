import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Package root (`osscv/`). */
export const OSSCV_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

export const TEMPLATES_DIR = join(OSSCV_ROOT, "templates");
