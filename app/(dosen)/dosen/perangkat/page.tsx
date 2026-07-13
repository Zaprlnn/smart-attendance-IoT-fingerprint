"use client"

import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { Cpu, Router, Wifi, WifiOff } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNowTick } from "@/lib/realtime/use-now-tick"
import { useDeviceRealtime } from "@/lib/realtime/use-device-realtime"
import { cn } from "@/lib/utils"

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

export default function DosenPerangkatPage() {
  useNowTick(1000)
  const { devices, loading } = useDeviceRealtime()

  return (
    <>
      <PageHeader
        title="Perangkat"
        description="Status perangkat ESP32 secara langsung."
      />

      {!loading && devices.length === 0 ? (
        <EmptyState icon={Cpu} title="Belum ada perangkat terdaftar" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => {
            const isOnline = device.status === "online"
            return (
              <Card key={device.id} className="shadow-soft hover-lift">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="size-4 text-primary" />
                      {device.nama}
                    </CardTitle>
                    <Badge variant={isOnline ? "success" : "destructive"}>
                      {isOnline ? <Wifi /> : <WifiOff />}
                      {isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Router className="size-3.5" />
                    {device.ruang}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-border p-2.5">
                      <p className="text-xs text-muted-foreground">Sinyal</p>
                      <div className="mt-1 flex items-center gap-2">
                        <SignalBars signal={device.signal} />
                        <span className="tabular-nums font-medium">{device.signal}%</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-2.5">
                      <p className="text-xs text-muted-foreground">Sensor</p>
                      <p
                        className={cn(
                          "mt-1 font-medium",
                          device.sensor_ok ? "text-success" : "text-destructive"
                        )}
                      >
                        {device.sensor_ok ? "Normal" : "Bermasalah"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-2.5 col-span-2">
                      <p className="text-xs text-muted-foreground">Scan Hari Ini</p>
                      <p className="mt-1 font-medium tabular-nums">{device.total_scan_hari_ini}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Terakhir terlihat{" "}
                    {device.last_seen
                      ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true, locale: id })
                      : "belum pernah"}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
