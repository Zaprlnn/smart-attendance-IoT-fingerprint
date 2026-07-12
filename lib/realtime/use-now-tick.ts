"use client"

import { useEffect, useState } from "react"

/**
 * Memaksa re-render setiap `intervalMs` agar label waktu relatif (mis. "5 detik
 * lalu") tetap berjalan. Interval dibersihkan otomatis saat unmount.
 */
export function useNowTick(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(interval)
  }, [intervalMs])

  return now
}
