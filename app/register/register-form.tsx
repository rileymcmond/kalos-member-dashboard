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

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get("next") ?? "/"
  const redirectTo = isSafeRedirectPath(nextParam) ? nextParam : "/"
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setPending(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
      },
    })
    if (signUpError) {
      setError(signUpError.message)
      setPending(false)
      return
    }
    if (data.session) {
      router.push("/")
      router.refresh()
      return
    }
    setMessage(
      "If email confirmation is enabled, check your inbox to finish sign-up. You can then sign in."
    )
    setPending(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-heading">Create account</CardTitle>
        <CardDescription>
          Your name is used on your member profile.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              disabled={pending}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              disabled={pending}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              value={password}
              disabled={pending}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <Button type="submit" disabled={pending} className="w-full sm:w-auto min-w-[9.5rem]">
            {pending ? (
              <>
                <Spinner />
                Creating…
              </>
            ) : (
              "Create account"
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            Already have an account?{" "}
            <Link
              className="font-medium text-primary underline underline-offset-4"
              href={
                redirectTo !== "/"
                  ? `/login?next=${encodeURIComponent(redirectTo)}`
                  : "/login"
              }
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
