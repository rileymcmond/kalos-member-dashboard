"use client"

import { useState, useEffect } from "react"
import { Activity, ChevronLeft, Menu, Upload } from "lucide-react"

import { ChangePasswordMenuItem } from "@/components/auth/change-password-menu-item"
import { SignOutMenuItem } from "@/components/auth/sign-out-menu-item"
import { MemberDexaSection } from "@/components/dashboard/member-dexa-section"
import { UploadDexaForm } from "@/components/dashboard/upload-dexa-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { MemberScanSnapshot } from "@/lib/dexa/types"
import { cn } from "@/lib/utils"

type DashboardProps = {
  userEmail: string
  displayName: string
  memberScanSnapshot: MemberScanSnapshot
}

const nav = [
  { id: "scans" as const, label: "My scans", icon: Activity },
  { id: "upload" as const, label: "Upload scan", icon: Upload },
]

function initialsFromName(name: string) {
  const p = name.trim().split(/\s+/)
  if (p.length >= 2) {
    return `${p[0]![0]!}${p[p.length - 1]![0]!}`.toUpperCase()
  }
  return (name[0] ?? "M").toUpperCase()
}

export default function Dashboard({
  userEmail,
  displayName,
  memberScanSnapshot,
}: DashboardProps) {
  const [activeNav, setActiveNav] = useState<(typeof nav)[number]["id"]>("scans")
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const pageTitle = activeNav === "scans" ? "My scans" : "Upload scan"

  return (
    <div className="flex h-screen bg-muted/30">
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
          onClick={() => setSidebarOpen(true)}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <aside
        className={cn(
          isMobile
            ? "fixed left-0 top-0 z-50 flex h-full w-full max-w-[16rem] flex-col border-r border-border bg-card transition-transform duration-200 ease-out"
            : "flex w-56 flex-col border-r border-border bg-card",
          isMobile && !sidebarOpen && "-translate-x-full",
          isMobile && sidebarOpen && "translate-x-0 shadow-lg"
        )}
        aria-label="Main navigation"
      >
        {isMobile && (
          <div className="flex justify-end p-2">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} type="button">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        )}
        <div className="border-b p-4">
          <p className="text-lg font-semibold tracking-tight">Kalos</p>
          <p className="text-xs text-muted-foreground">Member</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2" role="navigation">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveNav(id)
                setSidebarOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                activeNav === id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      {isMobile && sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} type="button" className="-ml-1">
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h1 className="font-heading truncate text-lg font-semibold text-foreground">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" type="button">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt="" />
                    <AvatarFallback className="text-xs">{initialsFromName(displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-medium">{displayName}</DropdownMenuLabel>
                {userEmail ? (
                  <DropdownMenuItem
                    disabled
                    className="text-xs text-muted-foreground font-normal"
                  >
                    {userEmail}
                  </DropdownMenuItem>
                ) : null}
                <ChangePasswordMenuItem />
                <DropdownMenuSeparator />
                <SignOutMenuItem />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeNav === "scans" && (
            <MemberDexaSection snapshot={memberScanSnapshot} />
          )}
          {activeNav === "upload" && (
            <UploadDexaForm
              onUploaded={() => {
                setActiveNav("scans")
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
}
