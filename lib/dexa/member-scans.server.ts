import "server-only"

import type { DexaScan, DexaScanSource } from "@/lib/database/types"
import { createClient } from "@/lib/supabase/server"

import { buildMemberScanSnapshot } from "./domain"
import type { MemberScanSnapshot } from "./types"

type DexaRow = {
  id: string
  member_id: string
  scanned_at: string
  total_mass_kg: string | number
  body_fat_pct: string | number
  lean_mass_kg: string | number
  fat_mass_kg: string | number
  bmc_g: string | number | null
  visceral_fat_area_cm2: string | number | null
  source: string
  created_at: string
}

function num(v: string | number): number {
  if (typeof v === "number") return v
  return Number(v)
}

function toDexaScan(row: DexaRow): DexaScan {
  return {
    id: row.id,
    member_id: row.member_id,
    scanned_at: row.scanned_at,
    total_mass_kg: num(row.total_mass_kg),
    body_fat_pct: num(row.body_fat_pct),
    lean_mass_kg: num(row.lean_mass_kg),
    fat_mass_kg: num(row.fat_mass_kg),
    bmc_g: row.bmc_g == null ? null : num(row.bmc_g),
    visceral_fat_area_cm2:
      row.visceral_fat_area_cm2 == null ? null : num(row.visceral_fat_area_cm2),
    source: row.source as DexaScanSource,
    created_at: row.created_at,
  }
}

/**
 * Load all DEXA rows for the authenticated member (RLS) and return the Phase 3 snapshot
 * (persona, last-two comparison, trend series).
 */
export async function getMemberScanSnapshot(
  userId: string
): Promise<MemberScanSnapshot> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("dexa_scans")
    .select(
      "id, member_id, scanned_at, total_mass_kg, body_fat_pct, lean_mass_kg, fat_mass_kg, bmc_g, visceral_fat_area_cm2, source, created_at"
    )
    .eq("member_id", userId)
    .order("scanned_at", { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  const scans: DexaScan[] = ((data ?? []) as DexaRow[]).map(toDexaScan)
  return buildMemberScanSnapshot(scans)
}
