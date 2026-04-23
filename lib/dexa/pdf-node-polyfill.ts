import "server-only"

import DOMMatrix from "@thednp/dommatrix"

/**
 * PDF.js (via pdf-parse) uses Web APIs. Node does not define `globalThis.DOMMatrix`.
 * A pure-JS implementation avoids Webpack trying to pack `@napi-rs/canvas` `.node` binaries
 * (see Next `serverExternalPackages` for any runtime `require("@napi-rs/canvas")` from pdfjs).
 * Must run before `pdf-parse` (see `extract-pdf-text.server.ts` import order).
 */
const g = globalThis as unknown as Record<string, unknown>
if (g.DOMMatrix == null) g.DOMMatrix = DOMMatrix
