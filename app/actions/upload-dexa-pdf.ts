"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getServerUser } from "@/lib/auth/session"
import { parseDexaReportText } from "@/lib/dexa/parse-dexa-text"

const MAX_BYTES = 12 * 1024 * 1024

/** `File` is a Web API; avoid `instanceof File` at module load in the Node action bundle. */
function isFormDataFile(
  v: unknown
): v is File {
  if (v == null || typeof v !== "object") return false
  const o = v as { arrayBuffer?: unknown; size?: unknown; name?: unknown; type?: unknown }
  if (typeof o.arrayBuffer !== "function" || typeof o.size !== "number") return false
  if (typeof o.name !== "string" || typeof o.type !== "string") return false
  return true
}

const fileSchema = z
  .custom<File>(isFormDataFile, { message: "Missing file" })
  .refine(
    (f) => f.size > 0 && f.size <= MAX_BYTES,
    "File must be non-empty and 12MB or under."
  )
  .refine(
    (f) =>
      f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    "Only PDF files are allowed."
  )

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 200) || "scan.pdf"
}

export type UploadDexaPdfState =
  | {
      success: true
      scanId: string
      strategy: string
      notes: string[]
    }
  | { success: false; error: string }
  | null

export async function uploadDexaScanAction(
  _prev: UploadDexaPdfState,
  formData: FormData
): Promise<UploadDexaPdfState> {
  const { user, supabase } = await getServerUser()
  if (!user) {
    return { success: false, error: "Not signed in." }
  }
  const raw = formData.get("file")
  if (!isFormDataFile(raw)) {
    return { success: false, error: "No file uploaded." }
  }
  const p = fileSchema.safeParse(raw)
  if (!p.success) {
    return { success: false, error: p.error.flatten().formErrors.join(" ") }
  }
  const file = p.data
  const ab = await file.arrayBuffer()
  const buf = Buffer.from(ab)
  let text: string
  try {
    // Dynamic import: pdf-parse (PDF.js) needs browser globals (e.g. DOMMatrix) at load
    // time. Bundling it with other server actions on the same page would run that on the
    // server when *any* action (e.g. change password) is loaded, so we load PDF code only
    // when an upload is performed.
    const { extractTextFromPdfBuffer } = await import(
      "@/lib/dexa/extract-pdf-text.server"
    )
    text = await extractTextFromPdfBuffer(buf)
  } catch (e) {
    const m = e instanceof Error ? e.message : "Failed to read PDF"
    return { success: false, error: m }
  }

  const parsed = parseDexaReportText(text)
  if (!parsed.ok) {
    return { success: false, error: parsed.error }
  }
  const { metrics, primaryStrategy, notes, filledFrom } = parsed
  if (new Date(`${metrics.scanDate}T00:00:00Z`) > new Date()) {
    return { success: false, error: "Scanned date appears to be in the future." }
  }

  const insertRow = {
    member_id: user.id,
    scanned_at: metrics.scanDate,
    total_mass_kg: metrics.totalMassKg,
    body_fat_pct: metrics.bodyFatPct,
    lean_mass_kg: metrics.leanMassKg,
    fat_mass_kg: metrics.fatMassKg,
    bmc_g: metrics.bmcG,
    visceral_fat_area_cm2: metrics.visceralFatAreaCm2,
    source: "upload" as const,
  }

  const { data: scanRow, error: insertError } = await supabase
    .from("dexa_scans")
    .insert(insertRow)
    .select("id")
    .single()

  if (insertError || !scanRow) {
    return {
      success: false,
      error: insertError?.message ?? "Failed to save scan. Check your RLS and database.",
    }
  }

  const objectPath = `${user.id}/${Date.now()}-${safeFilename(file.name)}`
  const { error: stErr } = await supabase.storage
    .from("dexa-reports")
    .upload(objectPath, new Uint8Array(buf), {
      contentType: "application/pdf",
      upsert: false,
    })
  if (stErr) {
    notes.push(
      `Row saved; optional PDF storage skipped (${stErr.message}). Ensure the dexa-reports bucket exists.`
    )
  }

  revalidatePath("/")

  return {
    success: true,
    scanId: scanRow.id,
    strategy: [primaryStrategy, `merged:${filledFrom.join("+")}`].join(" "),
    notes: [...new Set(notes)].filter(Boolean),
  }
}
