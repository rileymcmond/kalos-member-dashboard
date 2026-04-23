import "server-only"

import "./pdf-node-polyfill"
import { PDFParse } from "pdf-parse"

/** Extracts UTF-8-ish text for regex parsing (Node / server only). */
export async function extractTextFromPdfBuffer(buf: ArrayBuffer | Buffer): Promise<string> {
  const data = buf instanceof Buffer ? new Uint8Array(buf) : new Uint8Array(buf)
  const parser = new PDFParse({ data })
  const result = await parser.getText()
  return result.text
}
