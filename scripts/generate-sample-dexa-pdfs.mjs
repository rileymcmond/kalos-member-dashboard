/**
 * Generates text-based sample DEXA PDFs for local testing. Each file is tailored to
 * exercise a different path in lib/dexa/parse-dexa-text.ts (Layout A, B, heuristic, derived, dates, BMC).
 * Output: public/samples/dexa/
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, "..", "public", "samples", "dexa")

/**
 * @param {string} filename
 * @param {string[]} lines
 */
async function writeSamplePdf(filename, lines) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const size = 10
  const lineHeight = size * 1.2
  const marginX = 48
  const pageW = 612
  const pageH = 792
  let page = pdfDoc.addPage([pageW, pageH])
  let y = pageH - 52

  for (const line of lines) {
    if (y < 48) {
      page = pdfDoc.addPage([pageW, pageH])
      y = pageH - 52
    }
    page.drawText(line, { x: marginX, y, size, font, color: rgb(0, 0, 0), maxWidth: pageW - 2 * marginX })
    y -= lineHeight
  }

  const outPath = join(outDir, filename)
  writeFileSync(outPath, await pdfDoc.save())
  return outPath
}

async function main() {
  mkdirSync(outDir, { recursive: true })

  const samples = [
    {
      file: "1-layout-a-hologic-clinical.pdf",
      lines: [
        "DEMO CLINIC — DEXA Whole-Body Body Composition (Layout A: clinical labels)",
        "Report: HA-2026-SAMPLE-001   Device: Hologic Discovery (text export for tests)",
        "",
        "Scan Date: 01/15/2026   Study: Whole body",
        "Patient: Demo User   M   Age 36   Ht 178 cm",
        "",
        "=== RESULTS (WHOLE BODY) ===",
        "",
        "Total Body Mass: 75.2 kg",
        "Body Fat: (18.4)%",
        "Percent Body Fat: 18.4 %",
        "Lean Mass: 61.4 kg",
        "Fat Mass: 13.8 kg",
        "BMC: 2850 g",
        "Visceral Fat Area: 95.0 cm2",
        "",
        "End of summary — this PDF exists to test Layout A and pdf text extraction.",
      ],
    },
    {
      file: "2-layout-b-abbreviated-pbf-tbm-ffm.pdf",
      lines: [
        "KALOS LAB — BCA REPORT (Layout B: PBF / TBM / FFM / FM / VAT)",
        "Ref: B-2026-02   System: research export",
        "",
        "Test date: 20/03/2026  Whole body",
        "",
        "PBF#  18.4 %",
        "TBM   75.2 kg",
        "FFM: 61.4 kg",
        "FM Mass  13.8 kg",
        "B MC  2850 g",
        "VAT  95.0 cm2",
        "",
        "Minimal spell-out; avoid duplicate Total Body Mass wording; parser uses Layout B.",
      ],
    },
    {
      file: "3-derived-lean-fat-from-bf-and-total.pdf",
      lines: [
        "SAMPLE CENTER — minimal export (triggers derived lean + fat in buildFinal)",
        "ID: der-2026-001",
        "",
        "Date acquired: 2026-01-20",
        "",
        "Key indices:",
        "Total Body Mass: 78.0 kg",
        "Percent Body Fat: 22.0 %",
        "",
        "BMC: 2900 g",
        "",
        "This document omits direct lean and fat mass lines. The app derives fat from",
        "total mass times body fat percent, then lean as total minus fat. Check upload notes.",
      ],
    },
    {
      file: "4-heuristic-messy-order.pdf",
      lines: [
        "VENDOR Y — MESSY TEXT ORDER (heuristic + Layout B; merged partials)",
        "Batch dump; values out of order vs a standard Hologic printout.",
        "",
        "Visceral  90.0 cm2  (android reference)",
        "PBF:  17.0 %",
        "TBM:  74.1 kg",
        "trunk  lean  61.5 kg",
        "tissue  fat mass  12.6 kg",
        "Scan Date: 10/02/2026",
        "",
        "Interleaved keywords; TBM PBF and kg lines support Layout B and heuristic together.",
      ],
    },
    {
      file: "5-dates-iso-yyyy-mm-dd.pdf",
      lines: [
        "DATE FORMAT SAMPLE — explicit yyyy-MM-dd in body (tryParseDateBlock)",
        "Ref ISO-1",
        "",
        "2026-04-10  Study: whole body (DEXA)",
        "",
        "Total Body Mass: 72.0 kg",
        "Body Fat: 20.0%",
        "Lean + BMC: 57.5 kg",
        "Fat Mass: 14.4 kg",
        "BMC: 2800 g",
        "Visceral Fat Area: 88.0 cm2",
        "",
        "The scan date 2026-04-10 should be picked from the ISO line above.",
      ],
    },
    {
      file: "6-bone-mineral-kg-to-g.pdf",
      lines: [
        "BONE MINERAL (kg) — 'Bone: 2.8 kg' matches the kg path and becomes grams (no separate BMC: … g).",
        "ID: bmc-kg-1",
        "Scan: 12/31/2025",
        "",
        "Total Body Mass: 80.0 kg",
        "Percent Body Fat: 19.0%",
        "Lean Mass: 64.8 kg",
        "Fat Mass: 15.2 kg",
        "Bone: 2.8 kg",
        "Visceral Fat Area: 102.0 cm2",
        "",
        "Layout A converts the Bone: … kg line to grams. Prefer text exports; avoid 'BMC: 3.0 kg' in labels when possible (suffix parsing quirk in some tools).",
      ],
    },
  ]

  for (const s of samples) {
    const p = await writeSamplePdf(s.file, s.lines)
    // eslint-disable-next-line no-console -- CLI script
    console.log("Wrote", p)
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console -- CLI script
  console.error(e)
  process.exit(1)
})
