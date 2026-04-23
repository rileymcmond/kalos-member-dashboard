"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Loader2 } from "lucide-react"

import { uploadDexaScanAction } from "@/app/actions/upload-dexa-pdf"
import { DexaPdfDropzone } from "@/components/dashboard/dexa-pdf-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  onUploaded?: () => void
}

export function UploadDexaForm({ onUploaded }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [fileFieldKey, setFileFieldKey] = useState(0)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    setPending(true)
    const r = await uploadDexaScanAction(null, fd)
    setPending(false)
    if (r?.success) {
      const note = r.notes.length ? ` ${r.notes[0]}` : ""
      toast.success("New scan added", { description: `Parser: ${r.strategy}.${note}` })
      form.reset()
      setFileFieldKey((k) => k + 1)
      router.refresh()
      onUploaded?.()
    } else {
      const msg = r && !r.success ? r.error : "Upload failed."
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Upload a DEXA report (PDF)</CardTitle>
        <CardDescription>
          We extract text from the PDF, run multiple parse layouts (clinical labels, alternate
          abbreviations, and keyword heuristics for messy tables), then save a new scan to your
          account. A copy may be kept in your private storage folder when the project bucket is
          set up.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="max-w-md space-y-4">
          <DexaPdfDropzone
            key={fileFieldKey}
            id="dexa-pdf-file"
            name="file"
            disabled={pending}
            aria-describedby="dexa-pdf-hint"
          />
          <p id="dexa-pdf-hint" className="text-xs text-muted-foreground">
            Text-based PDFs work best; scanned image PDFs are not supported.
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Reading PDF…
              </>
            ) : (
              "Upload and parse"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
