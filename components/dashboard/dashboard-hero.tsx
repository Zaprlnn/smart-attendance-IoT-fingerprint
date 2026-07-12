import { Fingerprint } from "lucide-react"

import { cn } from "@/lib/utils"

interface DashboardHeroProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

/** Soft teal gradient banner for dashboard greetings, with a faint breathing
 * fingerprint watermark — the recurring brand motif, kept subtle. */
export function DashboardHero({
  title,
  description,
  actions,
  className,
}: DashboardHeroProps) {
  return (
    <div
      className={cn(
        "gradient-teal-soft relative overflow-hidden rounded-2xl border border-border p-6 shadow-soft",
        className
      )}
    >
      <Fingerprint
        aria-hidden="true"
        className="animate-fingerprint-breathe pointer-events-none absolute -top-6 -right-6 size-40 text-primary"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="relative flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}
