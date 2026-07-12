"use client"

import { create } from "zustand"

import { courses, devices, students } from "@/lib/mock"
import { playBeep } from "@/lib/realtime/beep"
import type { DeviceRuntimeStat, ScanEvent } from "@/lib/realtime/types"

const MAX_EVENTS = 50
const DEFAULT_SPEED_MS = 4000
const MIN_SIGNAL = 35

const eligibleStudents = students.filter((s) => s.fingerprintEnrolled)

function initialDeviceStats(): Record<string, DeviceRuntimeStat> {
  return devices.reduce<Record<string, DeviceRuntimeStat>>((acc, device) => {
    acc[device.id] = {
      status: device.status,
      signal: device.signal,
      lastSeen: device.lastSeen,
      totalScanHariIni: device.totalScanHariIni,
    }
    return acc
  }, {})
}

function randomItem<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(Math.random() * items.length)]
}

function jitterSignal(signal: number): number {
  const next = signal + Math.round((Math.random() - 0.5) * 10)
  return Math.min(100, Math.max(MIN_SIGNAL, next))
}

interface RealtimeState {
  isPlaying: boolean
  speedMs: number
  soundEnabled: boolean
  events: ScanEvent[]
  deviceStats: Record<string, DeviceRuntimeStat>
  lastScanEvent: {
    deviceId: string
    studentNama: string
    nim: string
    success: boolean
    timestamp: string
  } | null
  play: () => void
  pause: () => void
  setSpeed: (ms: number) => void
  toggleSound: () => void
  emitRandomScan: () => void
  emitStudentScan: (studentId: string, deviceId: string) => void
  toggleDeviceStatus: (deviceId: string) => void
  clearLastScanEvent: () => void
  reset: () => void
}

export const useRealtimeStore = create<RealtimeState>()((set, get) => ({
  isPlaying: false,
  speedMs: DEFAULT_SPEED_MS,
  soundEnabled: false,
  events: [],
  deviceStats: initialDeviceStats(),
  lastScanEvent: null,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setSpeed: (ms) => set({ speedMs: ms }),
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

  clearLastScanEvent: () => set({ lastScanEvent: null }),

  toggleDeviceStatus: (deviceId) => {
    set((s) => {
      const current = s.deviceStats[deviceId]
      if (!current) return s
      const isOnline = current.status === "online"
      return {
        deviceStats: {
          ...s.deviceStats,
          [deviceId]: {
            ...current,
            status: isOnline ? "offline" : "online",
            signal: isOnline ? 0 : 80,
            lastSeen: new Date().toISOString(),
          },
        },
      }
    })
  },

  emitStudentScan: (studentId, deviceId) => {
    const { deviceStats, soundEnabled } = get()
    const deviceStat = deviceStats[deviceId]
    const device = devices.find((d) => d.id === deviceId)
    const student = students.find((s) => s.id === studentId)

    if (!deviceStat || deviceStat.status !== "online" || !device || !student) return

    const timestamp = new Date().toISOString()
    const course = courses.find((c) => c.jadwal.ruang === device.ruang)
    const success = student.fingerprintEnrolled

    // Play sounds
    if (soundEnabled) {
      if (success) {
        playBeep()
      } else {
        // Play double error beep
        try {
          const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          if (AudioCtx) {
            const ctx = new AudioCtx()
            const playErrorTone = (delay: number) => {
              const osc = ctx.createOscillator()
              const gain = ctx.createGain()
              osc.type = "sawtooth"
              osc.frequency.value = 220
              gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay)
              gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + delay + 0.01)
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.15)
              osc.connect(gain)
              gain.connect(ctx.destination)
              osc.start(ctx.currentTime + delay)
              osc.stop(ctx.currentTime + delay + 0.16)
            }
            playErrorTone(0)
            playErrorTone(0.2)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }

    if (success) {
      const event: ScanEvent = {
        id: `SCAN-${timestamp}-${student.id}`,
        studentId: student.id,
        studentNama: student.nama,
        deviceId,
        deviceNama: device.nama,
        ruang: device.ruang,
        courseId: course?.id ?? null,
        courseNama: course?.nama ?? "Presensi Umum",
        timestamp,
      }

      set((s) => {
        const previousStat = s.deviceStats[deviceId]
        return {
          events: [event, ...s.events].slice(0, MAX_EVENTS),
          lastScanEvent: {
            deviceId,
            studentNama: student.nama,
            nim: student.nim,
            success: true,
            timestamp,
          },
          deviceStats: {
            ...s.deviceStats,
            [deviceId]: {
              ...previousStat,
              totalScanHariIni: previousStat.totalScanHariIni + 1,
              signal: jitterSignal(previousStat.signal),
              lastSeen: timestamp,
            },
          },
        }
      })
    } else {
      // Failed scan (fingerprint not recognized)
      set({
        lastScanEvent: {
          deviceId,
          studentNama: student.nama,
          nim: student.nim,
          success: false,
          timestamp,
        },
      })
    }
  },

  emitRandomScan: () => {
    const { deviceStats } = get()
    const onlineDeviceIds = Object.entries(deviceStats)
      .filter(([, stat]) => stat.status === "online")
      .map(([id]) => id)

    const deviceId = randomItem(onlineDeviceIds)
    // 10% chance to simulate a failed scan of Nadia Permata Sari (fingerprint not registered)
    const simulateFail = Math.random() < 0.1
    let student
    if (simulateFail) {
      student = students.find((s) => !s.fingerprintEnrolled) || randomItem(eligibleStudents)
    } else {
      student = randomItem(eligibleStudents)
    }

    if (!deviceId || !student) return
    get().emitStudentScan(student.id, deviceId)
  },

  reset: () =>
    set({
      events: [],
      deviceStats: initialDeviceStats(),
      isPlaying: false,
      lastScanEvent: null,
    }),
}))
