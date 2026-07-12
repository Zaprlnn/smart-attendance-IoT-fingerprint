"use client"

import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import {
  Cpu,
  Fingerprint,
  Router,
  ScanLine,
  Wifi,
  WifiOff,
} from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNowTick } from "@/lib/realtime/use-now-tick"
import { useRealtimeSimulator } from "@/lib/realtime/use-realtime-simulator"
import { seededRandom } from "@/lib/mock/generators"
import { devices } from "@/lib/mock"
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

function uptimeFor(deviceId: string): string {
  const rand = seededRandom(`uptime-${deviceId}`)
  const hours = Math.floor(rand() * 71) + 1
  const minutes = Math.floor(rand() * 59)
  return `${hours}j ${minutes}m`
}

export default function DosenPerangkatPage() {
  useNowTick(1000)
  const { events, isPlaying, deviceStats } = useRealtimeSimulator()

  return (
    <>
      <PageHeader
        title="Perangkat"
        description="Status perangkat ESP32 di setiap ruang kelas."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => {
          const stat = deviceStats[device.id] ?? {
            status: device.status,
            signal: device.signal,
            lastSeen: device.lastSeen,
            totalScanHariIni: device.totalScanHariIni,
          }
          const isOnline = stat.status === "online"
          const deviceEvents = events
            .filter((e) => e.deviceId === device.id)
            .slice(0, 5)

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
                      <SignalBars signal={stat.signal} />
                      <span className="tabular-nums font-medium">{stat.signal}%</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-2.5">
                    <p className="text-xs text-muted-foreground">Sensor</p>
                    <p
                      className={cn(
                        "mt-1 font-medium",
                        device.sensorOk ? "text-success" : "text-destructive"
                      )}
                    >
                      {device.sensorOk ? "Normal" : "Bermasalah"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-2.5">
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="mt-1 font-medium tabular-nums">
                      {isOnline ? uptimeFor(device.id) : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-2.5">
                    <p className="text-xs text-muted-foreground">Scan Hari Ini</p>
                    <p className="mt-1 font-medium tabular-nums">{stat.totalScanHariIni}</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Terakhir terlihat{" "}
                  {formatDistanceToNow(new Date(stat.lastSeen), {
                    addSuffix: true,
                    locale: id,
                  })}
                </p>

                <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-2.5">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ScanLine className="size-3.5" />
                    Heartbeat Log
                  </p>
                  {deviceEvents.length === 0 ? (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {isPlaying
                        ? "Menunggu scan berikutnya..."
                        : "Simulator tidak aktif — jalankan dari halaman Monitoring."}
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1 font-mono text-[11px] text-muted-foreground">
                      {deviceEvents.map((event) => (
                        <li key={event.id} className="flex items-center gap-1.5">
                          <Fingerprint className="size-3 shrink-0 text-primary" />
                          <span className="truncate">
                            {formatDistanceToNow(new Date(event.timestamp), {
                              addSuffix: true,
                              locale: id,
                            })}{" "}
                            — {event.studentNama}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
