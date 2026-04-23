import type { DexaScan } from "@/lib/database/types"

import type {
  HealthDirection,
  LastTwoComparison,
  MemberScanPersona,
  MemberScanSnapshot,
  MetricChange,
  MetricId,
  TrendPoint,
} from "./types"

export function resolvePersona(scanCount: number): MemberScanPersona {
  if (scanCount === 0) return "no_scans"
  if (scanCount === 1) return "first"
  if (scanCount === 2) return "second"
  return "returning"
}

function healthDirection(
  id: MetricId,
  /** newer - older */
  delta: number
): HealthDirection {
  if (Math.abs(delta) < 0.0005) return "unchanged"
  if (id === "total_mass_kg") {
    // Ambiguous for goals; do not label better/worse.
    return "neutral"
  }
  if (id === "body_fat_pct" || id === "fat_mass_kg" || id === "visceral_fat_area_cm2") {
    if (delta < 0) return "improved"
    if (delta > 0) return "regressed"
  }
  if (id === "lean_mass_kg") {
    if (delta > 0) return "improved"
    if (delta < 0) return "regressed"
  }
  return "neutral"
}

const METRIC_LABEL: Record<MetricId, string> = {
  body_fat_pct: "Body fat %",
  lean_mass_kg: "Lean mass (kg)",
  fat_mass_kg: "Fat mass (kg)",
  total_mass_kg: "Total mass (kg)",
  visceral_fat_area_cm2: "Visceral fat area (cm²)",
}

function getMetric(scan: DexaScan, id: MetricId): number {
  if (id === "body_fat_pct") return scan.body_fat_pct
  if (id === "lean_mass_kg") return scan.lean_mass_kg
  if (id === "fat_mass_kg") return scan.fat_mass_kg
  if (id === "total_mass_kg") return scan.total_mass_kg
  if (id === "visceral_fat_area_cm2") {
    if (scan.visceral_fat_area_cm2 == null) {
      return Number.NaN
    }
    return scan.visceral_fat_area_cm2
  }
  return 0
}

const COMPARE_IDS: MetricId[] = [
  "body_fat_pct",
  "lean_mass_kg",
  "fat_mass_kg",
  "total_mass_kg",
  "visceral_fat_area_cm2",
]

function compareLastTwo(older: DexaScan, newer: DexaScan): LastTwoComparison {
  const changes: MetricChange[] = []
  for (const id of COMPARE_IDS) {
    const a = getMetric(older, id)
    const b = getMetric(newer, id)
    if (Number.isNaN(a) || Number.isNaN(b)) continue
    const d = b - a
    changes.push({
      id,
      label: METRIC_LABEL[id],
      olderValue: a,
      newerValue: b,
      absoluteDelta: d,
      direction: healthDirection(id, d),
    })
  }
  return { olderScan: older, newerScan: newer, changes }
}

export function buildTrendPoints(scans: DexaScan[]): TrendPoint[] {
  return scans.map((s) => ({
    scannedAt: s.scanned_at,
    bodyFatPct: s.body_fat_pct,
    totalMassKg: s.total_mass_kg,
    leanMassKg: s.lean_mass_kg,
  }))
}

/**
 * Pure builder for the read model used on the server after scans are loaded from the database.
 */
export function buildMemberScanSnapshot(scans: DexaScan[]): MemberScanSnapshot {
  const n = scans.length
  const persona = resolvePersona(n)
  const lastTwoComparison =
    n >= 2 ? compareLastTwo(scans[n - 2]!, scans[n - 1]!) : null
  return {
    scans,
    persona,
    lastTwoComparison,
    trend: buildTrendPoints(scans),
  }
}
