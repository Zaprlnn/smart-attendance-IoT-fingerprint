"use client"

import { Pause, Play, Volume2, VolumeX } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const SPEED_PRESETS = [
  { label: "Lambat", value: 6000 },
  { label: "Normal", value: 3000 },
  { label: "Cepat", value: 1200 },
]

interface LiveControlBarProps {
  isPlaying: boolean
  speedMs: number
  soundEnabled: boolean
  onTogglePlay: () => void
  onSpeedChange: (ms: number) => void
  onToggleSound: () => void
}

export function LiveControlBar({
  isPlaying,
  speedMs,
  soundEnabled,
  onTogglePlay,
  onSpeedChange,
  onToggleSound,
}: LiveControlBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="relative flex size-3">
          {isPlaying && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
          )}
          <span
            className={cn(
              "relative inline-flex size-3 rounded-full",
              isPlaying ? "bg-success" : "bg-muted-foreground/50"
            )}
          />
        </span>
        <span className="font-display text-lg font-semibold tracking-wide">
          {isPlaying ? "LIVE" : "PAUSED"}
        </span>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button
          variant={isPlaying ? "outline" : "default"}
          size="sm"
          onClick={onTogglePlay}
        >
          {isPlaying ? <Pause /> : <Play />}
          {isPlaying ? "Pause" : "Play"}
        </Button>

        <Select
          value={String(speedMs)}
          onValueChange={(value) => {
            if (value) onSpeedChange(Number(value))
          }}
        >
          <SelectTrigger className="w-28">
            <SelectValue>
              {(value: string | null) =>
                SPEED_PRESETS.find((p) => String(p.value) === value)?.label ??
                "Normal"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SPEED_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={String(preset.value)}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={onToggleSound}
          aria-label={soundEnabled ? "Matikan suara" : "Aktifkan suara"}
        >
          {soundEnabled ? <Volume2 /> : <VolumeX />}
        </Button>
      </div>
    </div>
  )
}
