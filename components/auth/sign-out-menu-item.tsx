"use client"

import { useRouter } from "next/navigation"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

/**
 * Server session is stored in HTTP-only cookies; this clears them via the browser client.
 */
export function SignOutMenuItem() {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <DropdownMenuItem
      className="cursor-pointer"
      onSelect={(e) => {
        void signOut()
      }}
    >
      Log out
    </DropdownMenuItem>
  )
}
