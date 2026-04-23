"use client"

import { useId, useRef, useState } from "react"

import { FileText, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const MAX_BYTES = 12 * 1024 * 1024

function formatFileSize(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function isPdf(f: File): boolean {
  return f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
}

function validateFile(f: File): string | null {
  if (f.size === 0) return "File is empty."
  if (f.size > MAX_BYTES) return "File must be 12MB or smaller."
  if (!isPdf(f)) return "Only PDF files are allowed."
  return null
}

type Props = {
  name?: string
  id?: string
  disabled?: boolean
  "aria-describedby"?: string
}

/**
 * Custom drop zone + screen-reader-only file input. Keeps `name` on the real input
 * for FormData submission.
 */
export function DexaPdfDropzone({
  name = "file",
  id: idProp,
  disabled = false,
  "aria-describedby": describedBy,
}: Props) {
  const genId = useId()
  const id = idProp ?? `dexa-pdf-${genId}`
  const errId = `${id}-err`
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const describedByMerged = [localError && errId, describedBy]
    .filter((x): x is string => Boolean(x && x.length))
    .join(" ")

  function setInputFiles(file: File | null) {
    const el = inputRef.current
    if (!el) return
    if (!file) {
      el.value = ""
      return
    }
    const dt = new DataTransfer()
    dt.items.add(file)
    el.files = dt.files
  }

  function applyFile(file: File) {
    const err = validateFile(file)
    if (err) {
      setLocalError(err)
      setInputFiles(null)
      setSelected(null)
      return
    }
    setLocalError(null)
    setInputFiles(file)
    setSelected(file)
  }

  function clearFile() {
    setLocalError(null)
    setInputFiles(null)
    setSelected(null)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) {
      clearFile()
      return
    }
    applyFile(file)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setDragOver(true)
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (!file) return
    applyFile(file)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-foreground">
        DEXA report
      </Label>

      {localError ? (
        <p className="text-sm text-destructive" id={errId} role="alert">
          {localError}
        </p>
      ) : null}

      <div
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative rounded-lg border-2 border-dashed p-1 transition-[border-color,background-color,box-shadow] focus-within:ring-2 focus-within:ring-ring/60 focus-within:ring-offset-2 focus-within:ring-offset-background",
          dragOver && !disabled && "border-primary bg-primary/5",
          !selected && !dragOver && "border-muted-foreground/25",
          selected && "border-solid border-border bg-muted/30",
          disabled && "pointer-events-none cursor-not-allowed opacity-50"
        )}
      >
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept="application/pdf,.pdf"
          required
          disabled={disabled}
          className="sr-only"
          aria-invalid={!!localError}
          aria-describedby={describedByMerged || undefined}
          onChange={onInputChange}
          onFocus={() => setDragOver(false)}
        />
        {selected ? (
          <div className="flex items-center gap-3 p-3">
            <FileText className="h-9 w-9 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{selected.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selected.size)} · PDF
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  inputRef.current?.click()
                }}
              >
                Change
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={disabled}
                aria-label="Remove file"
                onClick={() => {
                  clearFile()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-2 py-5 text-center",
              !disabled && "cursor-pointer"
            )}
            onClick={() => {
              if (!disabled) inputRef.current?.click()
            }}
          >
            <FileText className="h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Drop your DEXA PDF here</p>
            <p className="text-xs text-muted-foreground">or click to choose a file from your device</p>
            <p className="text-xs text-muted-foreground">PDF only · up to 12MB · text-based reports parse best</p>
          </div>
        )}
        {disabled ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/60">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Working…
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
