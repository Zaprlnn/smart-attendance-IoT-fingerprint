"use client"

import Link from "next/link"
import { format } from "date-fns"
import { ArrowRight, Radio } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/dashboard/empty-state"
import { LiveBadge } from "@/components/dashboard/live-badge"
import { getInitials } from "@/lib/utils"
import type { ScanEvent } from "@/lib/realtime/types"

interface MonitoringFeedPreviewProps {
  events: ScanEvent[]
  limit?: number
  viewAllHref?: string
}

/** Preview feed ringkas, dipakai di dashboard dosen & bisa dipakai ulang di halaman Monitoring penuh. */
export function MonitoringFeedPreview({
  events,
  limit = 5,
  viewAllHref,
}: MonitoringFeedPreviewProps) {
  const items = events.slice(0, limit)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <LiveBadge />
        {viewAllHref && (
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={viewAllHref} />}
            nativeButton={false}
            className="text-muted-foreground"
          >
            Lihat Semua
            <ArrowRight />
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="Belum ada aktivitas"
          description="Simulator presensi belum berjalan."
          className="border-none py-8"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-3 rounded-lg border border-border p-2.5 text-sm"
            >
              <Avatar size="sm">
                <AvatarFallback>{getInitials(event.studentNama)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{event.studentNama}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {event.courseNama} • {event.ruang}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="success">Hadir</Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.timestamp), "HH:mm:ss")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
