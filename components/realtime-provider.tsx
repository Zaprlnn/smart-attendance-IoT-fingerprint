"use client"

import { useEffect } from "react"

import { useRealtimeSimulator } from "@/lib/realtime/use-realtime-simulator"

export function RealtimeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { isPlaying, speedMs, emitRandomScan } = useRealtimeSimulator()

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(emitRandomScan, speedMs)
    return () => clearInterval(interval)
  }, [isPlaying, speedMs, emitRandomScan])

  return <>{children}</>
}
