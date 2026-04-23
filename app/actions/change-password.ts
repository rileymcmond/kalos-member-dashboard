"use server"

import { z } from "zod"

import { getServerUser } from "@/lib/auth/session"

const schema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required.")
      .max(2000, "Input too long."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(2000, "Input too long."),
    confirmNewPassword: z
      .string()
      .min(1, "Please confirm the new password.")
      .max(2000, "Input too long."),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "New passwords do not match.",
    path: ["confirmNewPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must be different from your current password.",
    path: ["newPassword"],
  })

export type ChangePasswordState =
  | { success: true }
  | { success: false; error: string }
  | null

/**
 * Re-authenticates with the current password, then sets a new password (Supabase Auth).
 */
export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const { user, supabase } = await getServerUser()
  if (!user) {
    return { success: false, error: "Not signed in." }
  }
  const idents = user.identities
  if (
    idents &&
    idents.length > 0 &&
    !idents.some((i) => i.provider === "email")
  ) {
    return {
      success: false,
      error:
        "This account was not created with a password. Use the provider you use to sign in to manage your account.",
    }
  }
  if (!user.email) {
    return { success: false, error: "No email on file for this account." }
  }

  const v = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword"),
  }
  const parsed = schema.safeParse({
    currentPassword: typeof v.currentPassword === "string" ? v.currentPassword : "",
    newPassword: typeof v.newPassword === "string" ? v.newPassword : "",
    confirmNewPassword:
      typeof v.confirmNewPassword === "string" ? v.confirmNewPassword : "",
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }
  const { currentPassword, newPassword } = parsed.data

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) {
    return { success: false, error: "Current password is incorrect." }
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) {
    return { success: false, error: updateError.message }
  }
  return { success: true }
}
