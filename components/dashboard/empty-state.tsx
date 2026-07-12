import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "animate-fade-up flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center transition-colors",
        className
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform duration-300 ease-out">
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
