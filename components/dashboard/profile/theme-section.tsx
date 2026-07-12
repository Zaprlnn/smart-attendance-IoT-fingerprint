"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Laptop, Moon, Sun } from "lucide-react"

import { SectionCard } from "@/components/dashboard/section-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const THEME_OPTIONS = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Laptop },
] as const

export function ThemeSection() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  return (
    <SectionCard
      title="Tampilan"
      description="Pilih tema yang paling nyaman buat kamu."
    >
      <div className="grid grid-cols-3 gap-2">
        {THEME_OPTIONS.map((option) => {
          const isActive = mounted && theme === option.value
          return (
            <Button
              key={option.value}
              type="button"
              variant={isActive ? "default" : "outline"}
              className={cn("flex h-auto flex-col gap-1.5 py-3", !mounted && "opacity-0")}
              onClick={() => setTheme(option.value)}
            >
              <option.icon className="size-4" />
              {option.label}
            </Button>
          )
        })}
      </div>
    </SectionCard>
  )
}
