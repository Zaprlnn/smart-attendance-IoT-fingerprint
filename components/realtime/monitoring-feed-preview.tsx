"use client"

import Link from "next/link"
import { ArrowRight, Fingerprint, Radio } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/dashboard/empty-state"
import { LiveBadge } from "@/components/dashboard/live-badge"
import { getInitials } from "@/lib/utils"
import type { AbsensiRow } from "@/lib/types"

interface MonitoringFeedPreviewProps {
  rows: AbsensiRow[]
  isConnected: boolean
  limit?: number
  viewAllHref?: string
}

/** Preview feed ringkas (data absensi real dari ESP32), dipakai di dashboard dosen. */
export function MonitoringFeedPreview({
  rows,
  isConnected,
  limit = 5,
  viewAllHref,
}: MonitoringFeedPreviewProps) {
  const items = rows.slice(0, limit)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <LiveBadge isLive={isConnected} />
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
          description="Belum ada scan fingerprint yang masuk."
          className="border-none py-8"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((row) => (
            <li
              key={row.id}
              className="flex items-center gap-3 rounded-lg border border-border p-2.5 text-sm"
            >
              <Avatar size="sm">
                <AvatarFallback>
                  {row.nama ? getInitials(row.nama) : <Fingerprint className="size-3.5" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{row.nama}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {row.nim ?? `ID Jari #${row.id_jari}`}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="success">{row.status}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(row.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
