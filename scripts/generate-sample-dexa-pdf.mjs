/**
 * One-off generator: writes public/sample-dexa-scan.pdf
 * Text is shaped to match Layout A heuristics in lib/dexa/parse-dexa-text.ts
 */
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, "..", "public", "sample-dexa-scan.pdf")

const lines = [
  "DEMO CLINIC — DEXA Body Composition",
  "Report ID: SAMPLE-2025-001    Device: Hologic (sample for local testing)",
  "",
  "Scan Date: 01/15/2025    Study: Whole Body",
  "Patient: Sample Member    Sex: M    Age: 34    Height: 180 cm",
  "",
  "WHOLE-BODY COMPOSITION",
  "",
  "Total Body Mass: 75.2 kg",
  "Body Fat: 18.4%",
  "Percent Body Fat: 18.4%",
  "Lean Mass: 61.4 kg",
  "Fat Mass: 13.8 kg",
  "BMC: 2850 g",
  "Visceral Fat Area: 95.0 cm2",
  "",
  "This report was generated for testing the Member Dashboard upload flow.",
]

async function main() {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const size = 11
  const lineHeight = size * 1.25
  let y = 720
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size, font, color: rgb(0, 0, 0), maxWidth: 512 })
    y -= lineHeight
  }
  const bytes = await pdfDoc.save()
  writeFileSync(outPath, bytes)
  // eslint-disable-next-line no-console -- CLI script
  console.log("Wrote", outPath)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
