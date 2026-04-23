import type { DexaScan } from "@/lib/database/types"

/**
 * How many DEXA scans the member has — used to drive dashboard UX in later phases.
 */
export type MemberScanPersona = "no_scans" | "first" | "second" | "returning"

export type MetricId =
  | "body_fat_pct"
  | "lean_mass_kg"
  | "fat_mass_kg"
  | "total_mass_kg"
  | "visceral_fat_area_cm2"

export type HealthDirection = "improved" | "regressed" | "unchanged" | "neutral"

export type MetricChange = {
  id: MetricId
  label: string
  olderValue: number
  newerValue: number
  /** `newer - older` in the same units as the values */
  absoluteDelta: number
  /** Whether the change is favorable for common fitness goals (lower body fat, more lean, etc.) */
  direction: HealthDirection
}

export type LastTwoComparison = {
  olderScan: DexaScan
  newerScan: DexaScan
  changes: MetricChange[]
}

export type TrendPoint = {
  scannedAt: string
  bodyFatPct: number
  totalMassKg: number
  leanMassKg: number
}

/** Precomputed read model for the member dashboard (Phase 3). */
export type MemberScanSnapshot = {
  scans: DexaScan[]
  persona: MemberScanPersona
  /** Set when at least two scans exist (compares the most recent two). */
  lastTwoComparison: LastTwoComparison | null
  /** Non-empty for trend charts (same ordering as `scans`). */
  trend: TrendPoint[]
}
