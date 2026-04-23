"use client"

import { Eye, EyeOff } from "lucide-react"
import { forwardRef, useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">

/**
 * Password field with a show/hide toggle. Toggles only masking, not the underlying value.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, disabled, id: idProp, ...props }, ref) {
    const autoId = useId()
    const id = idProp ?? autoId
    const [visible, setVisible] = useState(false)

    return (
      <div className="relative">
        <Input
          id={id}
          ref={ref}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={cn("pe-10", className)}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="absolute end-0 top-0 h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
          onMouseDown={(e) => e.preventDefault()}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </Button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"
