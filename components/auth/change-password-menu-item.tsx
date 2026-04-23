"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { changePasswordAction } from "@/app/actions/change-password"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ChangePasswordMenuItem() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function closeAndReset() {
    setOpen(false)
    setError(null)
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    setPending(true)
    const r = await changePasswordAction(null, fd)
    setPending(false)
    if (r?.success) {
      form.reset()
      closeAndReset()
      toast.success("Password updated", {
        description: "You can use your new password the next time you sign in.",
      })
      router.refresh()
      return
    }
    setError(r && !r.success ? r.error : "Could not change password.")
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault()
          setError(null)
          setOpen(true)
        }}
      >
        Change password
      </DropdownMenuItem>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setError(null)
        }}
      >
        <DialogContent className="max-w-md">
          <form onSubmit={onSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Change password</DialogTitle>
              <DialogDescription>
                Enter your current password, then choose a new one (at least 8 characters).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="cp-current">Current password</Label>
              <Input
                id="cp-current"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-new">New password</Label>
              <Input
                id="cp-new"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-confirm">Confirm new password</Label>
              <Input
                id="cp-confirm"
                name="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={pending}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={closeAndReset}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Update password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
