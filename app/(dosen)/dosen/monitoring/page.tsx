"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/section-card"
import { LiveControlBar } from "@/components/realtime/live-control-bar"
import { MonitoringLiveFeed } from "@/components/realtime/monitoring-live-feed"
import { DeviceStatusPanel } from "@/components/realtime/device-status-panel"
import { HardwareSimulator } from "@/components/realtime/hardware-simulator"
import { AbsensiLiveFeed } from "@/components/realtime/absensi-live-feed"
import { useRealtimeSimulator } from "@/lib/realtime/use-realtime-simulator"
import { useAbsensiRealtime } from "@/lib/realtime/use-absensi-realtime"
import { courses, devices } from "@/lib/mock"
import { Fingerprint, Cpu } from "lucide-react"

export default function DosenMonitoringPage() {
  const {
    events,
    isPlaying,
    speedMs,
    soundEnabled,
    deviceStats,
    play,
    pause,
    setSpeed,
    toggleSound,
  } = useRealtimeSimulator()

  // ── Data nyata dari ESP32 via Supabase ──────────────────────────────────
  const { rows: absensiRows, isConnected, totalHariIni } = useAbsensiRealtime(50)

  const totalScanHariIni = Object.values(deviceStats).reduce(
    (acc, stat) => acc + stat.totalScanHariIni,
    0
  )

  return (
    <>
      <PageHeader
        title="Monitoring Realtime"
        description="Control room — seluruh aktivitas presensi kampus secara live."
      />

      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-[200px_200px_1fr]">
        {/* Counter simulator */}
        <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card p-6 text-center shadow-soft hover-lift">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Cpu className="h-3.5 w-3.5" />
            <p className="text-sm">Simulator</p>
          </div>
          <p className="font-display text-5xl font-semibold tabular-nums text-primary">
            {totalScanHariIni}
          </p>
        </div>

        {/* Counter ESP32 nyata */}
        <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card p-6 text-center shadow-soft hover-lift">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Fingerprint className="h-3.5 w-3.5" />
            <p className="text-sm">ESP32 Nyata</p>
          </div>
          <p className="font-display text-5xl font-semibold tabular-nums text-emerald-400">
            {totalHariIni}
          </p>
        </div>

        <LiveControlBar
          isPlaying={isPlaying}
          speedMs={speedMs}
          soundEnabled={soundEnabled}
          onTogglePlay={() => (isPlaying ? pause() : play())}
          onSpeedChange={setSpeed}
          onToggleSound={toggleSound}
        />
      </div>

      {/* ── Feed nyata dari ESP32 ───────────────────────────────────────── */}
      <SectionCard
        title="🔴 Scan Nyata dari Perangkat ESP32"
        description="Data langsung dari sensor fingerprint AS608 via Supabase Realtime."
      >
        <AbsensiLiveFeed
          rows={absensiRows}
          isConnected={isConnected}
          newCount={1}
        />
      </SectionCard>

      {/* ── Feed simulator + status device ─────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Live Presence Feed (Simulator)"
            description="Seluruh scan fingerprint kampus, real time."
          >
            <MonitoringLiveFeed events={events} courses={courses} devices={devices} />
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <HardwareSimulator />

          <SectionCard
            title="Status Perangkat"
            description="Kondisi seluruh device ESP32 di kampus."
          >
            <div className="flex flex-col gap-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="rounded-xl border border-border p-4"
                >
                  <DeviceStatusPanel device={device} stat={deviceStats[device.id]} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  )
}
