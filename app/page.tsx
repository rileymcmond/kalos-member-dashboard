import { redirect } from "next/navigation"

import Dashboard from "@/components/dashboard/dashboard"

/** PDF upload action can run in this route; allow time for text extraction. */
export const maxDuration = 60
import { getServerUser } from "@/lib/auth/session"
import { getMemberScanSnapshot } from "@/lib/dexa/member-scans.server"

export default async function Home() {
  const { user } = await getServerUser()
  if (!user) {
    redirect("/login")
  }
  const displayName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] ?? "Member"

  const memberScanSnapshot = await getMemberScanSnapshot(user.id)

  return (
    <Dashboard
      userEmail={user.email ?? ""}
      displayName={displayName}
      memberScanSnapshot={memberScanSnapshot}
    />
  )
}
