/**
 * Text-based DEXA report parsing (no PDF dependency) — testable, multi-strategy.
 *
 * - Layout A: common label → value lines (Hologic / many clinical exports).
 * - Layout B: alternate labels (PBF, TBM, FFM, FM) and looser “value after label” blocks.
 * - Heuristic: keyword proximity + numeric pools when tables move.
 * - Derived: fill lean/fat from total + body fat % when direct fields are missing.
 */

import { format, isValid, parse } from "date-fns"

export type ParseStrategyName = "layoutA" | "layoutB" | "heuristic" | "derived"

export type ExtractedScanMetrics = {
  totalMassKg: number
  bodyFatPct: number
  leanMassKg: number
  fatMassKg: number
  bmcG: number | null
  visceralFatAreaCm2: number | null
  /** YYYY-MM-DD for Postgres */
  scanDate: string
}

const round3 = (n: number) => Math.round(n * 1000) / 1000
const round2 = (n: number) => Math.round(n * 100) / 100
const round1 = (n: number) => Math.round(n * 10) / 10

function normalizeText(t: string) {
  return t
    .replace(/\r\n/g, "\n")
    .replace(/[\t\u00a0]+/g, " ")
    .replace(/ +/g, " ")
}

function tryParseDateBlock(text: string): string {
  const patterns: RegExp[] = [
    /(?:Scan|Study|Test|Report|Date|Acquired|Performed)[:\s]+(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i,
    /(\d{4}[./-]\d{1,2}[./-]\d{1,2})/,
    /(\d{1,2}[./-][A-Za-z]{3,9}[./-]\d{2,4})/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[1]) {
      const d = tryParseDateString(m[1])
      if (d) return d
    }
  }
  return format(new Date(), "yyyy-MM-dd")
}

function tryParseDateString(s: string): string | null {
  const formats = [
    "MM/dd/yyyy",
    "M/d/yyyy",
    "dd/MM/yyyy",
    "d/M/yyyy",
    "yyyy-MM-dd",
    "dd-MMM-yyyy",
    "dd-MMM-yy",
  ]
  for (const f of formats) {
    const d = parse(s, f, new Date())
    if (isValid(d)) return format(d, "yyyy-MM-dd")
  }
  const t = Date.parse(s)
  if (!Number.isNaN(t)) {
    return format(new Date(t), "yyyy-MM-dd")
  }
  return null
}

type PartialM = {
  bodyFatPct?: number
  totalMassKg?: number
  leanMassKg?: number
  fatMassKg?: number
  bmcG?: number | null
  visceralFatAreaCm2?: number | null
}

function firstMatch(
  text: string,
  patterns: RegExp[],
  group = 1
): number | undefined {
  for (const re of patterns) {
    const m = re.exec(text)
    if (m?.[group]) {
      const n = parseFloat(m[group])
      if (Number.isFinite(n)) return n
    }
  }
  return undefined
}

/**
 * Layout A: explicit labels (Hologic-style wording) with numbers + units.
 */
function parseLayoutA(text: string): PartialM {
  const t = text
  const o: PartialM = {}

  o.bodyFatPct = firstMatch(
    t,
    [
      /Percent(?:age)?\s*Body\s*Fat[^\d%]{0,30}?(\d+\.?\d*)\s*%/i,
      /Body\s*Fat\s*Percent[:\s]+(\d+\.?\d*)\s*%/i,
      /Body\s*Fat[:\s(]+(\d+\.?\d*)\s*%/i,
      /(?:^|\n)\s*Fat\s*%\s*[:(]?\s*(\d+\.?\d*)\s*%/im,
    ],
    1
  )
  o.totalMassKg = firstMatch(
    t,
    [
      /Total(?:\s*Body)?\s*Mass[:\s]+(\d+\.?\d*)\s*kg/i,
      /Total(?:\s*Body)?\s*Weight[:\s]+(\d+\.?\d*)\s*kg/i,
      /Weight[:\s]+(\d+\.?\d*)\s*kg/i,
    ],
    1
  )
  o.leanMassKg = firstMatch(
    t,
    [
      /Lean(?:\s*\+?\s*BMC|Mass|\s*Soft\s*Tissue)[:\s+]+(\d+\.?\d*)\s*kg/i,
      /Lean[:\s]+(\d+\.?\d*)\s*kg/i,
      /(?:Lean|LT)\s*Mass[:\s]+(\d+\.?\d*)\s*kg/i,
    ],
    1
  )
  o.fatMassKg = firstMatch(
    t,
    [
      /Fat\s*Mass[:\s]+(\d+\.?\d*)\s*kg/i,
      /Body\s*Fat\s*Mass[:\s]+(\d+\.?\d*)\s*kg/i,
    ],
    1
  )
  o.bmcG = firstMatch(
    t,
    [/(?:BMC|Bone\s*Mineral\s*Content|Bone\s*Mass)[:\s]+(\d+\.?\d*)\s*g/i],
    1
  ) ?? null
  o.visceralFatAreaCm2 = firstMatch(
    t,
    [/(?:Visceral|VAT|Android\s*Fat\s*Area)[^.\d]{0,25}?(\d+\.?\d*)\s*(?:cm2|cm²|cm)/i],
    1
  ) ?? null
  if (o.bmcG == null) {
    const bkg = firstMatch(
      t,
      [/(?:BMC|Bone)[:\s]+(\d+\.?\d*)\s*kg/i],
      1
    )
    if (bkg != null) o.bmcG = round1(bkg * 1000)
  }

  return o
}

/**
 * Layout B: alternate report wording (PBF, TBM, FFM) and “shifted” lines where
 * labels and numbers are separated (common when PDF text order differs from layout).
 */
function parseLayoutB(text: string): PartialM {
  const t = text.replace(/([a-z%])(\d)/gi, "$1 $2")
  const o: PartialM = {}
  o.bodyFatPct = firstMatch(
    t,
    [
      /(?:PBF|%\s*Fat|Tissue\s*%\s*Fat|Percent\s*Fat)\s*[:#]?\s*(\d+\.?\d*)\s*%/i,
      /(\d+\.?\d*)\s*%\s*(?:PBF|body\s*fat|percent)/i,
    ],
    1
  )
  o.totalMassKg = firstMatch(
    t,
    [/(?:TBM|Total\s*Mass|TBW)[^.\d]{0,12}?\s*(\d+\.?\d*)\s*kg/i],
    1
  )
  o.leanMassKg = firstMatch(
    t,
    [/(?:FFM|Lean\s*Mass|LM)\s*[:#]?\s*(\d+\.?\d*)\s*kg/i],
    1
  )
  o.fatMassKg = firstMatch(
    t,
    [/(?:FM|Fat)\s*Mass?\s*[:#]?\s*(\d+\.?\d*)\s*kg/i],
    1
  )
  o.visceralFatAreaCm2 =
    firstMatch(
      t,
      [/(?:VAT|VFA|Visceral)[^.\d]{0,16}?(\d+\.?\d*)\s*(?:cm2|cm²|cm)²?/i],
      1
    ) ?? null
  if (o.visceralFatAreaCm2 == null) {
    o.visceralFatAreaCm2 =
      firstMatch(
        t,
        [/(\d+\.?\d*)\s*(?:cm2|cm²|cm)²?(?:\s*|$)[^\d]{0,20}?(?:visceral|VAT|android)/i],
        1
      ) ?? null
  }
  o.bmcG = firstMatch(t, [/(?:B)\s*M?\s*C[:\s]+(\d+\.?\d*)\s*g/i], 1) ?? null
  return o
}

/**
 * Heuristic: score lines with keywords + % / kg, survive table reordering.
 */
function parseHeuristic(text: string): PartialM {
  const t = text
  const lines = t.split("\n").map((l) => l.trim())
  const o: PartialM = {}

  for (const line of lines) {
    const l = line.toLowerCase()
    if (
      (l.includes("fat") && l.includes("%")) ||
      l.includes("pbf") ||
      l.includes("percent")
    ) {
      const p = firstMatch(
        line,
        [/(\d+\.?\d*)\s*%/],
        1
      )
      if (p != null && p > 2 && p < 65) {
        o.bodyFatPct = p
        break
      }
    }
  }
  for (const line of lines) {
    const m = /(\d+\.?\d*)\s*kg/i.exec(line)
    if (!m) continue
    const v = parseFloat(m[1]!)
    if (v < 25 || v > 320) continue
    const l = line.toLowerCase()
    if (
      l.includes("total") ||
      l.includes("tbm") ||
      l.includes("weight") ||
      l.includes("mass (") ||
      /(?:^|\W)w(?:eight|t)\.?\s/i.test(line)
    ) {
      if (o.totalMassKg == null || o.totalMassKg < v) o.totalMassKg = v
    } else if ((l.includes("lean") || l.includes("ffm")) && !l.includes("ffmi")) {
      o.leanMassKg = v
    } else if (l.includes("fat") && l.includes("mass")) {
      o.fatMassKg = v
    }
  }

  if (o.leanMassKg == null) {
    const m = t.match(
      /(?:lean|ffm|fat[-\s]free)\D{0,40}?(\d+\.?\d*)\s*kg/i
    )
    if (m?.[1]) o.leanMassKg = parseFloat(m[1]!)
  }
  if (o.fatMassKg == null) {
    const m = t.match(
      /(?:fat\s*mass|fm\b)\D{0,40}?(\d+\.?\d*)\s*kg/i
    )
    if (m?.[1]) o.fatMassKg = parseFloat(m[1]!)
  }
  if (o.totalMassKg == null) {
    const m = t.match(
      /(?:\d+\.?\d*)\s*kg[^\n]{0,60}?(?:total|body|weight)\b/gi
    ) ?? t.match(
      /(?:^|\D)(\d{2,3}\.\d{1,3}|\d{2,3})\s*kg/m
    )
    if (m) {
      const m2 = /(\d+\.?\d*)\s*kg/i.exec(m[0] ?? "")
      if (m2?.[1]) {
        const v = parseFloat(m2[1]!)
        if (v > 30 && v < 300) o.totalMassKg = v
      }
    }
  }
  o.visceralFatAreaCm2 = firstMatch(
    t,
    [/(?:visceral|android|vat)\D{0,20}?(\d{1,3}\.?\d*)\D{0,5}?(?:cm2|cm²)/i],
    1
  ) ?? null
  return o
}

function mergePartials(
  a: PartialM,
  b: PartialM
): PartialM {
  return {
    bodyFatPct: a.bodyFatPct ?? b.bodyFatPct,
    totalMassKg: a.totalMassKg ?? b.totalMassKg,
    leanMassKg: a.leanMassKg ?? b.leanMassKg,
    fatMassKg: a.fatMassKg ?? b.fatMassKg,
    bmcG: a.bmcG ?? b.bmcG,
    visceralFatAreaCm2: a.visceralFatAreaCm2 ?? b.visceralFatAreaCm2,
  }
}

function merge3(a: PartialM, b: PartialM, c: PartialM): PartialM {
  return mergePartials(mergePartials(a, b), c)
}

function countCore(p: PartialM) {
  return [p.bodyFatPct, p.totalMassKg, p.leanMassKg, p.fatMassKg].filter((x) => x != null).length
}

function bestPrimary(
  a: PartialM,
  b: PartialM,
  h: PartialM
): ParseStrategyName {
  const ca = countCore(a)
  const cb = countCore(b)
  const ch = countCore(h)
  if (ca >= cb && ca >= ch && ca > 0) return "layoutA"
  if (cb >= ch && cb > 0) return "layoutB"
  return "heuristic"
}

/** Fills lean/fat/bf/total and returns a full row, or null. */
function buildFinal(
  p: PartialM,
  text: string,
  notes: string[]
): ExtractedScanMetrics | null {
  const q: PartialM = { ...p }
  const d = tryParseDateBlock(text)

  if (q.bodyFatPct != null && q.totalMassKg != null) {
    const fromBf = (q.totalMassKg * q.bodyFatPct) / 100
    if (q.fatMassKg == null) {
      q.fatMassKg = round3(fromBf)
      notes.push("Fat mass derived from total mass × body fat %.")
    }
    if (q.leanMassKg == null) {
      q.leanMassKg = round3(q.totalMassKg - (q.fatMassKg as number))
      notes.push("Lean mass derived as total mass − fat mass.")
    }
  } else if (q.leanMassKg != null && q.fatMassKg != null) {
    if (q.totalMassKg == null) {
      q.totalMassKg = round3(q.leanMassKg + q.fatMassKg)
      notes.push("Total mass taken as lean mass + fat mass.")
    }
    if (q.bodyFatPct == null && (q.totalMassKg as number) > 0) {
      q.bodyFatPct = round2((100 * (q.fatMassKg as number)) / (q.totalMassKg as number))
      notes.push("Body fat % derived from fat / total mass.")
    }
  }

  if (q.leanMassKg == null || q.fatMassKg == null) return null
  if (q.bodyFatPct == null || q.totalMassKg == null) return null

  if (q.bodyFatPct < 1.5 || q.bodyFatPct > 70) return null
  if (q.totalMassKg < 20 || q.totalMassKg > 400) return null
  if (q.leanMassKg < 1 || q.leanMassKg > 200) return null
  if (q.fatMassKg < 0.5 || q.fatMassKg > 200) return null

  const bmcG =
    q.bmcG == null || Number.isNaN(q.bmcG) ? null : round1(q.bmcG)
  const va =
    q.visceralFatAreaCm2 == null || Number.isNaN(q.visceralFatAreaCm2)
      ? null
      : round1(q.visceralFatAreaCm2)

  return {
    bodyFatPct: round2(q.bodyFatPct!),
    totalMassKg: round3(q.totalMassKg!),
    leanMassKg: round3(q.leanMassKg!),
    fatMassKg: round3(q.fatMassKg!),
    bmcG,
    visceralFatAreaCm2: va,
    scanDate: d,
  }
}

function strategiesUsed(
  a: PartialM,
  b: PartialM,
  h: PartialM
): ParseStrategyName[] {
  const out: ParseStrategyName[] = []
  if (Object.values(a).some((v) => v != null)) out.push("layoutA")
  if (Object.values(b).some((v) => v != null)) out.push("layoutB")
  if (Object.values(h).some((v) => v != null)) out.push("heuristic")
  return out
}

export function parseDexaReportText(
  raw: string
):
  | {
      ok: true
      metrics: ExtractedScanMetrics
      primaryStrategy: ParseStrategyName
      filledFrom: ParseStrategyName[]
      notes: string[]
    }
  | { ok: false; error: string } {
  const text = normalizeText(raw)
  if (text.length < 40) {
    return {
      ok: false,
      error:
        "This PDF has almost no extractable text; it may be image-based. Export a text PDF from your provider if you can.",
    }
  }
  const a = parseLayoutA(text)
  const b = parseLayoutB(text)
  const h = parseHeuristic(text)
  const base = merge3(a, b, h)
  const primaryStrategy = bestPrimary(a, b, h)
  const filledFrom = strategiesUsed(a, b, h)
  const notes: string[] = []

  let r = buildFinal({ ...base }, text, notes)
  if (!r) r = buildFinal({ ...a }, text, notes)
  if (!r) r = buildFinal({ ...b }, text, notes)
  if (!r) r = buildFinal({ ...h }, text, notes)
  if (!r) {
    return {
      ok: false,
      error:
        "Could not read enough DEXA values. Try a PDF with selectable text, or a different export from the same device.",
    }
  }

  if (notes.some((x) => x.toLowerCase().includes("deriv")) && !filledFrom.includes("derived")) {
    filledFrom.push("derived")
  }

  return { ok: true, metrics: r, primaryStrategy, filledFrom, notes }
}
