"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Fingerprint } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useEnrollCommand } from "@/lib/realtime/use-enroll-realtime"

type Step = "idle" | "place-1" | "lift" | "place-2" | "done"

const STEP_LABEL: Record<Step, string> = {
  idle: "Klik mulai, lalu minta mahasiswa menempelkan jari pada sensor ESP32.",
  "place-1": "Letakkan jari pada sensor...",
  lift: "Bagus. Angkat jari dari sensor...",
  "place-2": "Letakkan jari yang sama sekali lagi untuk konfirmasi...",
  done: "Sidik jari berhasil didaftarkan!",
}

const STEP_PROGRESS: Record<Step, number> = {
  idle: 0,
  "place-1": 35,
  lift: 55,
  "place-2": 80,
  done: 100,
}

interface FingerprintEnrollProps {
  onEnrolled: () => void
  commandId: string | null
  onStartEnroll: () => void
  className?: string
}

export function FingerprintEnroll({ onEnrolled, commandId, onStartEnroll, className }: FingerprintEnrollProps) {
  const status = useEnrollCommand(commandId)
  
  // Mapping status dari backend ke state UI
  let step: Step = "idle"
  if (status === "pending") step = commandId ? "place-1" : "idle"
  if (status === "processing") step = "place-2" // Asumsi processing = ESP32 sedang scan
  if (status === "completed") step = "done"

  // Panggil callback ketika selesai
  useEffect(() => {
    if (status === "completed") {
      onEnrolled()
    }
  }, [status, onEnrolled])

  const isScanning = step === "place-1" || step === "place-2"
  const isDone = step === "done"

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center",
        className
      )}
    >
      <div className="relative flex size-16 items-center justify-center">
        {isScanning && (
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        )}
        <span
          className={cn(
            "relative flex size-16 items-center justify-center rounded-full transition-colors",
            isDone ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
          )}
        >
          {isDone ? (
            <CheckCircle2 className="size-8" />
          ) : (
            <Fingerprint className={cn("size-8", isScanning && "animate-pulse")} />
          )}
        </span>
      </div>

      <p className="text-sm font-medium text-foreground">{STEP_LABEL[step]}</p>

      <Progress value={STEP_PROGRESS[step]} className="w-full max-w-xs" />

      {step === "idle" && (
        <Button type="button" size="sm" onClick={onStartEnroll}>
          <Fingerprint />
          Mulai Enroll Sidik Jari
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        Terkoneksi — menunggu input dari sensor ESP32 nyata.
      </p>
    </div>
  )
}
