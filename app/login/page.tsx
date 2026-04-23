import { redirect } from "next/navigation"
import { Suspense } from "react"

import { AuthSplitLayout } from "@/components/auth/auth-split-layout"
import { getServerUser } from "@/lib/auth/session"
import { LoginForm } from "./login-form"

export default async function LoginPage() {
  const { user } = await getServerUser()
  if (user) {
    redirect("/")
  }
  return (
    <AuthSplitLayout>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  )
}
