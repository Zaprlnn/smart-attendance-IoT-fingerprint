"use client"

import { useRealtimeStore } from "@/lib/stores/realtime-store"
import type { DeviceRuntimeStat, ScanEvent } from "@/lib/realtime/types"

interface UseRealtimeSimulatorResult {
  isPlaying: boolean
  speedMs: number
  soundEnabled: boolean
  events: ScanEvent[]
  deviceStats: Record<string, DeviceRuntimeStat>
  play: () => void
  pause: () => void
  setSpeed: (ms: number) => void
  toggleSound: () => void
  emitRandomScan: () => void
  reset: () => void
}

/**
 * Akses reaktif ke simulator presensi realtime (mock). Halaman mahasiswa/dosen
 * memanggil ini untuk "mendengarkan" feed scan & status device secara live;
 * `RealtimeProvider` memakai actions yang sama untuk menjalankan interval-nya.
 */
export function useRealtimeSimulator(): UseRealtimeSimulatorResult {
  const isPlaying = useRealtimeStore((s) => s.isPlaying)
  const speedMs = useRealtimeStore((s) => s.speedMs)
  const soundEnabled = useRealtimeStore((s) => s.soundEnabled)
  const events = useRealtimeStore((s) => s.events)
  const deviceStats = useRealtimeStore((s) => s.deviceStats)
  const play = useRealtimeStore((s) => s.play)
  const pause = useRealtimeStore((s) => s.pause)
  const setSpeed = useRealtimeStore((s) => s.setSpeed)
  const toggleSound = useRealtimeStore((s) => s.toggleSound)
  const emitRandomScan = useRealtimeStore((s) => s.emitRandomScan)
  const reset = useRealtimeStore((s) => s.reset)

  return {
    isPlaying,
    speedMs,
    soundEnabled,
    events,
    deviceStats,
    play,
    pause,
    setSpeed,
    toggleSound,
    emitRandomScan,
    reset,
  }
}
