"use client"

import { Fingerprint, Router, Wifi, WifiOff } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/section-card"
import { AbsensiLiveFeed } from "@/components/realtime/absensi-live-feed"
import { Badge } from "@/components/ui/badge"
import { useAbsensiRealtime } from "@/lib/realtime/use-absensi-realtime"
import { useDeviceRealtime } from "@/lib/realtime/use-device-realtime"

export default function DosenMonitoringPage() {
  const { rows: absensiRows, isConnected, totalHariIni } = useAbsensiRealtime(50)
  const { devices } = useDeviceRealtime()

  return (
    <>
      <PageHeader
        title="Monitoring Realtime"
        description="Aktivitas presensi fingerprint secara live, langsung dari perangkat ESP32."
      />

      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card p-6 text-center shadow-soft hover-lift">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Fingerprint className="h-3.5 w-3.5" />
            <p className="text-sm">Scan Hari Ini</p>
          </div>
          <p className="font-display text-5xl font-semibold tabular-nums text-emerald-400">
            {totalHariIni}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-soft">
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada perangkat terdaftar.</p>
          ) : (
            devices.map((device) => {
              const isOnline = device.status === "online"
              return (
                <div key={device.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Router className="size-4 text-muted-foreground" />
                    <span className="font-medium">{device.nama}</span>
                    <span className="text-xs text-muted-foreground">{device.ruang}</span>
                  </div>
                  <Badge variant={isOnline ? "success" : "destructive"}>
                    {isOnline ? <Wifi /> : <WifiOff />}
                    {isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
              )
            })
          )}
        </div>
      </div>

      <SectionCard
        title="Scan Fingerprint Terbaru"
        description="Data langsung dari sensor fingerprint AS608 via Supabase Realtime."
      >
        <AbsensiLiveFeed rows={absensiRows} isConnected={isConnected} newCount={1} />
      </SectionCard>
    </>
  )
}
