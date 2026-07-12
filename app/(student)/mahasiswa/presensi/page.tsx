"use client"

import { useEffect, useRef, useState } from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/section-card"
import { ScanVisualizer } from "@/components/realtime/scan-visualizer"
import { LiveControlBar } from "@/components/realtime/live-control-bar"
import { LivePresenceFeed } from "@/components/realtime/live-presence-feed"
import { DeviceStatusPanel } from "@/components/realtime/device-status-panel"
import { useCurrentUser } from "@/lib/stores/auth-store"
import { useRealtimeSimulator } from "@/lib/realtime/use-realtime-simulator"
import { deviceForRoom, devices, getCourseById } from "@/lib/mock"

export default function PresensiRealtimePage() {
  const currentUser = useCurrentUser()
  const student = currentUser && "nim" in currentUser ? currentUser : null

  const {
    isPlaying,
    speedMs,
    soundEnabled,
    events,
    deviceStats,
    play,
    pause,
    setSpeed,
    toggleSound,
  } = useRealtimeSimulator()

  const [burstKey, setBurstKey] = useState(0)
  const lastEventIdRef = useRef<string | null>(null)

  useEffect(() => {
    const latest = events[0]
    if (latest && latest.id !== lastEventIdRef.current) {
      lastEventIdRef.current = latest.id
      setBurstKey((k) => k + 1)
    }
  }, [events])

  if (!student) return null

  const myCourse = getCourseById(student.enrolledCourseIds[0] ?? "")
  const myDevice = myCourse ? deviceForRoom(myCourse.jadwal.ruang) : devices[0]
  const myDeviceStat = deviceStats[myDevice.id]

  return (
    <>
      <PageHeader
        title="Presensi Realtime"
        description="Pantau scan fingerprint masuk secara live dari simulator."
      />

      <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-6 shadow-soft sm:flex-row sm:justify-center sm:gap-10">
        <ScanVisualizer isActive={isPlaying} burstKey={burstKey} />
        <div className="w-full max-w-md">
          <LiveControlBar
            isPlaying={isPlaying}
            speedMs={speedMs}
            soundEnabled={soundEnabled}
            onTogglePlay={() => (isPlaying ? pause() : play())}
            onSpeedChange={setSpeed}
            onToggleSound={toggleSound}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Live Presence Feed"
            description="Scan fingerprint terbaru dari seluruh kampus, real time."
          >
            <LivePresenceFeed
              events={events}
              currentStudentId={student.id}
              isPlaying={isPlaying}
              onPlay={play}
            />
          </SectionCard>
        </div>

        <SectionCard
          title="Status Perangkat"
          description="Device di ruang kelasmu."
        >
          <DeviceStatusPanel device={myDevice} stat={myDeviceStat} />
        </SectionCard>
      </div>
    </>
  )
}
