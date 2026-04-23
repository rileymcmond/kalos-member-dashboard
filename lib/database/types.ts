/**
 * Public schema types aligned with `supabase/migrations/*_create_members_and_dexa_scans.sql`.
 * For generated types later, run: `npx supabase gen types typescript --local` (or linked project).
 */

export type Member = {
  id: string
  email: string
  full_name: string
  created_at: string
}

export type DexaScanSource = 'seed' | 'upload' | 'manual'

export type DexaScan = {
  id: string
  member_id: string
  scanned_at: string
  total_mass_kg: number
  body_fat_pct: number
  lean_mass_kg: number
  fat_mass_kg: number
  bmc_g: number | null
  visceral_fat_area_cm2: number | null
  source: DexaScanSource
  created_at: string
}

/** Row shape for inserting a new scan (e.g. from PDF parse or form). */
export type DexaScanInsert = {
  member_id: string
  scanned_at: string
  total_mass_kg: number
  body_fat_pct: number
  lean_mass_kg: number
  fat_mass_kg: number
  bmc_g?: number | null
  visceral_fat_area_cm2?: number | null
  source: DexaScanSource
}
