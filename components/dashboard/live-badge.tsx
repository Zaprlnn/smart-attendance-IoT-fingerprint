"use client"

import { cn } from "@/lib/utils"
import { useRealtimeSimulator } from "@/lib/realtime/use-realtime-simulator"

export function LiveBadge() {
  const { isPlaying } = useRealtimeSimulator()

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        isPlaying
          ? "bg-success/10 text-success ring-success/20"
          : "bg-muted text-muted-foreground ring-border"
      )}
    >
      <span className="relative flex size-2">
        {isPlaying && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            isPlaying ? "bg-success" : "bg-muted-foreground/60"
          )}
        />
      </span>
      {isPlaying ? "LIVE" : "IDLE"}
    </span>
  )
}
