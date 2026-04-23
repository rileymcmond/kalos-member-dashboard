/**
 * After generating sample PDFs, run: npx --yes tsx ./scripts/verify-sample-dexa-pdfs.ts
 * Confirms each file extracts text and parseDexaReportText({ ok: true }).
 * (Does not import extract-pdf-text.server.ts; that module uses "server-only".)
 * Polyfill must be applied before the dynamic import of pdf-parse (same as server).
 */
import { readdir, readFile } from "node:fs/promises"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { parseDexaReportText } from "../lib/dexa/parse-dexa-text"

let pdfParse: typeof import("pdf-parse")["PDFParse"] | null = null

async function ensurePdf() {
  const g = globalThis as unknown as Record<string, unknown>
  if (g.DOMMatrix == null) {
    const { default: DOMMatrix } = await import("@thednp/dommatrix")
    g.DOMMatrix = DOMMatrix
  }
  if (pdfParse == null) {
    const mod = await import("pdf-parse")
    pdfParse = mod.PDFParse
  }
  return pdfParse
}

async function extractTextFromPdfBuffer(buf: Buffer): Promise<string> {
  const PDFParse = (await ensurePdf())!
  const data = new Uint8Array(buf)
  const parser = new PDFParse({ data })
  const result = await parser.getText()
  return result.text
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const sampleDir = join(__dirname, "..", "public", "samples", "dexa")

async function main() {
  const names = (await readdir(sampleDir))
    .filter((n) => n.endsWith(".pdf"))
    .sort()
  if (names.length === 0) {
    console.error("No PDFs in", sampleDir, "— run npm run generate:sample-dexa-pdf first")
    process.exit(1)
  }
  for (const name of names) {
    const buf = await readFile(join(sampleDir, name))
    const text = await extractTextFromPdfBuffer(buf)
    const p = parseDexaReportText(text)
    if (!p.ok) {
      console.error("FAIL", name, p.error, "\n--- text preview ---\n", text.slice(0, 400))
      process.exit(1)
    }
    console.log("OK  ", name, "→", p.metrics.scanDate, p.primaryStrategy, p.filledFrom.join("+"), p.notes)
  }
  console.log("All", names.length, "sample PDFs parse successfully.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
