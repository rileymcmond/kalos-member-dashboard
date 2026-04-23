"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Spinner } from "@/components/ui/spinner"
import { Label } from "@/components/ui/label"
import { isSafeRedirectPath } from "@/lib/paths"
import { createClient } from "@/lib/supabase/client"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get("next") ?? "/"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const redirectTo = isSafeRedirectPath(nextParam) ? nextParam : "/"

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setPending(false)
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-heading">Sign in</CardTitle>
        <CardDescription>
          Sign in with your email and password to open your DEXA dashboard.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              disabled={pending}
              onChange={(e) => {
                setError(null)
                setEmail(e.target.value)
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              disabled={pending}
              onChange={(e) => {
                setError(null)
                setPassword(e.target.value)
              }}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <Button type="submit" disabled={pending} className="w-full sm:w-auto min-w-[8.5rem]">
            {pending ? (
              <>
                <Spinner />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            No account?{" "}
            <Link
              className="font-medium text-primary underline underline-offset-4"
              href={
                redirectTo !== "/"
                  ? `/register?next=${encodeURIComponent(redirectTo)}`
                  : "/register"
              }
            >
              Create one
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
