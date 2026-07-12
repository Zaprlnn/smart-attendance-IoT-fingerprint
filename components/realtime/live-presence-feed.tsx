"use client"

import { useEffect, useRef } from "react"
import { format } from "date-fns"
import { MapPin, Radio } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/dashboard/empty-state"
import { cn, getInitials } from "@/lib/utils"
import type { ScanEvent } from "@/lib/realtime/types"

interface LivePresenceFeedProps {
  events: ScanEvent[]
  currentStudentId: string
  isPlaying: boolean
  onPlay: () => void
}

export function LivePresenceFeed({
  events,
  currentStudentId,
  isPlaying,
  onPlay,
}: LivePresenceFeedProps) {
  // Hanya menyimpan id dari event yang sedang tampil (dibatasi store ke 50
  // entri) — dibangun ulang setiap perubahan, tidak pernah bertumbuh tanpa batas.
  const seenIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const newOwnEvent = events.find(
      (e) => e.studentId === currentStudentId && !seenIdsRef.current.has(e.id)
    )
    seenIdsRef.current = new Set(events.map((e) => e.id))

    if (newOwnEvent) {
      toast.success("Presensi kamu tercatat!", {
        description: `${newOwnEvent.courseNama} • ${newOwnEvent.ruang} • ${format(
          new Date(newOwnEvent.timestamp),
          "HH:mm:ss"
        )}`,
      })
    }
  }, [events, currentStudentId])

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Radio}
        title="Belum ada aktivitas"
        description="Simulator presensi belum berjalan. Tekan Play untuk mulai mensimulasikan scan fingerprint secara live."
        action={
          !isPlaying ? (
            <Button size="sm" onClick={onPlay}>
              Mulai Simulasi
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <ul className="flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
      {events.map((event) => {
        const isMine = event.studentId === currentStudentId
        return (
          <li
            key={event.id}
            className={cn(
              "animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border p-3 duration-300",
              isMine
                ? "border-primary/40 bg-primary/5 shadow-[0_0_0_1px_var(--primary)_inset,0_0_24px_-8px_var(--primary)]"
                : "border-border bg-card"
            )}
          >
            <Avatar>
              <AvatarFallback
                className={isMine ? "bg-primary/15 text-primary" : undefined}
              >
                {getInitials(event.studentNama)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate text-sm font-medium">
                {event.studentNama}
                {isMine && (
                  <span className="ml-1.5 text-xs font-normal text-primary">
                    (Kamu)
                  </span>
                )}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                {event.courseNama}
                <span className="text-muted-foreground/50">•</span>
                <MapPin className="size-3" />
                {event.ruang}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="success">Hadir</Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(event.timestamp), "HH:mm:ss")}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
