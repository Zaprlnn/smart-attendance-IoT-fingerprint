"use client"

import { useState, useEffect } from "react"
import { useRealtimeStore } from "@/lib/stores/realtime-store"
import { devices, students } from "@/lib/mock"
import { Power, Wifi, Fingerprint } from "lucide-react"

export function HardwareSimulator() {
  const [selectedDeviceId, setSelectedDeviceId] = useState("DEV01")
  const [fingerprintState, setFingerprintState] = useState<"idle" | "scanning" | "success" | "fail">("idle")
  const [blueLedOn, setBlueLedOn] = useState(false)
  const [redLedOn, setRedLedOn] = useState(false)
  const [showStudentSelector, setShowStudentSelector] = useState(false)

  const { deviceStats, lastScanEvent, emitStudentScan, toggleDeviceStatus, clearLastScanEvent } = useRealtimeStore()

  const device = devices.find((d) => d.id === selectedDeviceId) ?? devices[0]
  const stat = deviceStats[selectedDeviceId] ?? { status: "offline", signal: 0, lastSeen: "", totalScanHariIni: 0 }
  const isOnline = stat.status === "online"

  // Heartbeat LED Biru (blink if online)
  useEffect(() => {
    if (!isOnline) {
      const timer = setTimeout(() => {
        setBlueLedOn(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    const interval = setInterval(() => {
      setBlueLedOn((prev) => !prev)
    }, 1500)

    return () => clearInterval(interval)
  }, [isOnline])

  // Handle Scan Events to Update LCD & LEDs
  useEffect(() => {
    if (!lastScanEvent || lastScanEvent.deviceId !== selectedDeviceId) return

    // Defer state updates to avoid synchronous setState in effect body warning
    const initTimer = setTimeout(() => {
      setFingerprintState("scanning")
      setBlueLedOn(true)
      setRedLedOn(false)
    }, 0)

    const timer = setTimeout(() => {
      if (lastScanEvent.success) {
        setFingerprintState("success")
        setBlueLedOn(true)
        setRedLedOn(false)
      } else {
        setFingerprintState("fail")
        setBlueLedOn(false)
        setRedLedOn(true)
      }

      // Reset back to idle after 3 seconds
      const resetTimer = setTimeout(() => {
        setFingerprintState("idle")
        setRedLedOn(false)
        clearLastScanEvent()
      }, 3000)

      return () => clearTimeout(resetTimer)
    }, 800)

    return () => {
      clearTimeout(initTimer)
      clearTimeout(timer)
    }
  }, [lastScanEvent, selectedDeviceId, clearLastScanEvent])

  // Derive LCD text dynamically during render instead of state to avoid sync effects
  const getLcdText = () => {
    if (!isOnline) {
      return {
        line1: "ESP32 OFFLINE  ",
        line2: "Hubungkan Daya ",
      }
    }

    if (fingerprintState === "scanning") {
      return {
        line1: "Membaca Sidik...",
        line2: "Tunggu Sebentar"
      }
    }

    if (fingerprintState === "success" && lastScanEvent) {
      return {
        line1: "SCAN BERHASIL!",
        line2: lastScanEvent.studentNama.slice(0, 16).padEnd(16),
      }
    }

    if (fingerprintState === "fail") {
      return {
        line1: "VERIFIKASI GAGAL",
        line2: "Jari Tak Dikenal",
      }
    }

    return {
      line1: `${device.ruang.padEnd(16).slice(0, 16)}`,
      line2: `Ready / Sinyal:${stat.signal}%`.padEnd(16).slice(0, 16),
    }
  }

  const lcdText = getLcdText()

  const handleScan = (studentId: string) => {
    if (!isOnline) return
    emitStudentScan(studentId, selectedDeviceId)
    setShowStudentSelector(false)
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">IoT Device Simulator</h3>
          <p className="text-xs text-muted-foreground">Simulasi fisik ESP32 + AS608 + LCD 16x2</p>
        </div>
        <select
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nama} ({d.ruang})
            </option>
          ))}
        </select>
      </div>

      {/* Physical Device Body */}
      <div className="relative flex flex-col items-center gap-6 rounded-2xl border-4 border-slate-700 bg-slate-900 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        
        {/* Screw Details */}
        <div className="absolute left-2 top-2 size-2 rounded-full bg-slate-600 shadow-inner" />
        <div className="absolute right-2 top-2 size-2 rounded-full bg-slate-600 shadow-inner" />
        <div className="absolute bottom-2 left-2 size-2 rounded-full bg-slate-600 shadow-inner" />
        <div className="absolute bottom-2 right-2 size-2 rounded-full bg-slate-600 shadow-inner" />

        {/* Brand Text */}
        <div className="w-full text-center">
          <span className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">
            ESP32 NodeMCU Smart Attendance v1.0
          </span>
        </div>

        {/* LCD 16x2 Screen */}
        <div className={`relative w-full rounded-md border-8 border-slate-800 p-4 font-mono shadow-inner transition-colors duration-300 ${
          isOnline
            ? "bg-emerald-950 text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.3)]"
            : "bg-slate-900 text-slate-800"
        }`}>
          {/* LCD Grid lines details */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,18,18,0.05)_50%,_rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px]" />
          
          <div className="space-y-1 text-sm tracking-widest">
            <div className="whitespace-pre uppercase">{lcdText.line1}</div>
            <div className="whitespace-pre uppercase">{lcdText.line2}</div>
          </div>
        </div>

        {/* Row for LEDs, Fingerprint, and Switch */}
        <div className="flex w-full items-center justify-between gap-4 px-2">
          
          {/* LEDs */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className={`size-3 rounded-full border border-slate-700 transition-all duration-300 ${
                  blueLedOn 
                    ? "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" 
                    : "bg-blue-950"
                }`} />
                <span className="mt-1 font-mono text-[9px] text-slate-400">LED_B</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`size-3 rounded-full border border-slate-700 transition-all duration-300 ${
                  redLedOn 
                    ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" 
                    : "bg-red-950"
                }`} />
                <span className="mt-1 font-mono text-[9px] text-slate-400">LED_R</span>
              </div>
            </div>
          </div>

          {/* AS608 Fingerprint Scanner */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              disabled={!isOnline || fingerprintState === "scanning"}
              onClick={() => setShowStudentSelector(!showStudentSelector)}
              className={`relative flex size-16 items-center justify-center rounded-full border-4 border-slate-800 transition-all duration-300 focus:outline-none ${
                !isOnline
                  ? "bg-slate-900 cursor-not-allowed"
                  : fingerprintState === "scanning"
                  ? "bg-blue-900/40 border-blue-500 animate-pulse cursor-wait"
                  : fingerprintState === "success"
                  ? "bg-emerald-900/60 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]"
                  : fingerprintState === "fail"
                  ? "bg-red-900/60 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                  : "bg-slate-800/80 hover:bg-slate-800 hover:border-slate-600 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]"
              }`}
            >
              <Fingerprint className={`size-8 transition-colors duration-300 ${
                !isOnline 
                  ? "text-slate-700" 
                  : fingerprintState === "success"
                  ? "text-emerald-400"
                  : fingerprintState === "fail"
                  ? "text-red-400"
                  : fingerprintState === "scanning"
                  ? "text-blue-400"
                  : "text-blue-500 hover:text-blue-400"
              }`} />
              
              {/* Scan Line Animation */}
              {isOnline && fingerprintState === "scanning" && (
                <div className="absolute inset-x-2 h-0.5 bg-blue-400 animate-[bounce_1.5s_infinite] shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              )}
            </button>
            <span className="font-mono text-[9px] text-slate-400 uppercase">AS608 SENSOR</span>
          </div>

          {/* Toggle Switch */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => toggleDeviceStatus(selectedDeviceId)}
              className={`flex size-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 transition-all duration-200 active:scale-95 ${
                isOnline
                  ? "text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] bg-slate-800"
                  : "text-slate-500 hover:text-slate-400"
              }`}
              title="Toggle Power ESP32"
            >
              <Power className="size-5" />
            </button>
            <span className="mt-1 font-mono text-[9px] text-slate-400">POWER</span>
          </div>

        </div>

        {/* Student Selector Overlay for Fingerprint Tap */}
        {showStudentSelector && isOnline && (
          <div className="absolute inset-x-4 bottom-16 z-10 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground">Pilih Sidik Jari untuk Di-scan:</span>
              <button
                onClick={() => setShowStudentSelector(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Tutup
              </button>
            </div>
            <div className="grid gap-1">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleScan(student.id)}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="font-medium truncate max-w-[120px]">{student.nama}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    student.fingerprintEnrolled
                      ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-500 dark:text-amber-400"
                  }`}>
                    {student.fingerprintEnrolled ? "ID: Enrolled" : "Jari Asing"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
      
      {/* Simulation Info */}
      <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        <Wifi className="size-4 shrink-0 text-primary" />
        <div>
          <span className="font-semibold text-foreground">Tip Simulasi:</span> Klik sensor sidik jari di atas untuk menempelkan sidik jari mahasiswa secara instan! Coba scan <span className="font-semibold text-amber-600 dark:text-amber-400">Nadia Permata Sari</span> untuk mensimulasikan sidik jari tidak dikenal.
        </div>
      </div>
    </div>
  )
}
