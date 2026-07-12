"use client"

import { useId, useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PasswordInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  invalid?: boolean
  disabled?: boolean
  "aria-describedby"?: string
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  invalid,
  disabled,
  "aria-describedby": describedBy,
}: PasswordInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        id={inputId}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        disabled={disabled}
        className="pr-9"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        className={cn(
          "absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground"
        )}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}
