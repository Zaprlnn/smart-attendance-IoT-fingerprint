"use client"

import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { Wifi, WifiOff } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useNowTick } from "@/lib/realtime/use-now-tick"
import { cn } from "@/lib/utils"
import type { DeviceRuntimeStat } from "@/lib/realtime/types"
import type { Device } from "@/lib/types"

const SIGNAL_BAR_THRESHOLDS = [25, 50, 75, 100]

function SignalBars({ signal }: { signal: number }) {
  return (
    <div className="flex items-end gap-0.5" aria-hidden="true">
      {SIGNAL_BAR_THRESHOLDS.map((threshold, i) => (
        <span
          key={threshold}
          className={cn(
            "w-1.5 rounded-sm bg-muted",
            signal >= threshold && "bg-primary"
          )}
          style={{ height: `${6 + i * 4}px` }}
        />
      ))}
    </div>
  )
}

interface DeviceStatusPanelProps {
  device: Device
  stat: DeviceRuntimeStat
}

export function DeviceStatusPanel({ device, stat }: DeviceStatusPanelProps) {
  // Re-render tiap detik agar "terakhir terlihat" tetap berjalan; interval
  // dibersihkan otomatis oleh hook saat komponen unmount.
  useNowTick(1000)

  const isOnline = stat.status === "online"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{device.nama}</p>
          <p className="text-xs text-muted-foreground">{device.ruang}</p>
        </div>
        <Badge variant={isOnline ? "success" : "destructive"}>
          {isOnline ? <Wifi /> : <WifiOff />}
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Sinyal</span>
        <div className="flex items-center gap-2">
          <SignalBars signal={stat.signal} />
          <span className="text-muted-foreground tabular-nums">
            {stat.signal}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Scan Hari Ini</span>
        <span className="font-medium tabular-nums">
          {stat.totalScanHariIni}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Terakhir Terlihat</span>
        <span className="text-right font-medium">
          {formatDistanceToNow(new Date(stat.lastSeen), {
            addSuffix: true,
            locale: id,
          })}
        </span>
      </div>
    </div>
  )
}
