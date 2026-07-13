"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { useNowTick } from "@/lib/realtime/use-now-tick"

export interface DeviceDB {
  id: string
  nama: string
  ruang: string
  device_key: string
  status: string
  sensor_ok: boolean
  signal: number
  last_seen: string | null
  total_scan_hari_ini: number
}

const OFFLINE_AFTER_MS = 15_000 // ESP32 poll /device/command tiap 3 detik saat idle

/** Subscribe ke tabel `device` via Supabase Realtime — sama pola dengan use-mahasiswa.ts. */
export function useDeviceRealtime() {
  const [devices, setDevices] = useState<DeviceDB[]>([])
  const [loading, setLoading] = useState(true)
  const now = useNowTick(5000)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from("device")
      .select("*")
      .order("nama", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setDevices(data as DeviceDB[])
        setLoading(false)
      })

    const channel = supabase
      .channel("device-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "device" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDevices((prev) => [...prev, payload.new as DeviceDB])
          } else if (payload.eventType === "UPDATE") {
            setDevices((prev) =>
              prev.map((d) => (d.id === payload.new.id ? (payload.new as DeviceDB) : d))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // last_seen basi (>15 detik) dianggap offline, walau kolom status di DB belum sempat diupdate.
  const withFreshStatus = devices.map((d) => {
    const lastSeenMs = d.last_seen ? new Date(d.last_seen).getTime() : 0
    const isStale = now - lastSeenMs > OFFLINE_AFTER_MS
    return isStale ? { ...d, status: "offline", signal: 0 } : d
  })

  return { devices: withFreshStatus, loading }
}
