"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import type { PresensiRow } from "@/lib/types"

interface UsePresensiRealtimeResult {
  rows: PresensiRow[]
  isConnected: boolean
}

/**
 * Subscribe ke tabel `presensi` via Supabase Realtime, difilter per mahasiswa.
 * Sama persis polanya dengan use-absensi-realtime.ts, dipakai untuk menampilkan
 * status presensi mahasiswa yang login secara live begitu ESP32 mencatat scan-nya.
 */
export function usePresensiRealtime(mahasiswaId: string | undefined, limit = 20): UsePresensiRealtimeResult {
  const [rows, setRows] = useState<PresensiRow[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const addRow = useCallback((newRow: PresensiRow) => {
    setRows((prev) => {
      const withoutOld = prev.filter((r) => r.id !== newRow.id)
      return [newRow, ...withoutOld]
    })
  }, [])

  useEffect(() => {
    if (!mahasiswaId) return
    const supabase = createClient()

    supabase
      .from("presensi")
      .select("*")
      .eq("mahasiswa_id", mahasiswaId)
      .order("timestamp", { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (error) {
          console.error("[usePresensiRealtime] fetch awal gagal:", error.message)
          return
        }
        setRows((data as PresensiRow[]) ?? [])
      })

    const channel = supabase
      .channel(`presensi-${mahasiswaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "presensi",
          filter: `mahasiswa_id=eq.${mahasiswaId}`,
        },
        (payload) => {
          addRow(payload.new as PresensiRow)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mahasiswaId, limit, addRow])

  return { rows, isConnected }
}

/**
 * Subscribe ke tabel `presensi` difilter per sesi (bukan per mahasiswa) — dipakai
 * roster live dosen di halaman kontrol presensi mandiri, supaya nama mahasiswa yang
 * baru scan langsung muncul tanpa refresh/polling.
 */
export function usePresensiBySesiRealtime(sesiId: string | undefined): UsePresensiRealtimeResult {
  const [rows, setRows] = useState<PresensiRow[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const addRow = useCallback((newRow: PresensiRow) => {
    setRows((prev) => {
      const withoutOld = prev.filter((r) => r.id !== newRow.id)
      return [newRow, ...withoutOld]
    })
  }, [])

  useEffect(() => {
    if (!sesiId) return
    const supabase = createClient()

    supabase
      .from("presensi")
      .select("*")
      .eq("sesi_id", sesiId)
      .then(({ data, error }) => {
        if (error) {
          console.error("[usePresensiBySesiRealtime] fetch awal gagal:", error.message)
          return
        }
        setRows((data as PresensiRow[]) ?? [])
      })

    const channel = supabase
      .channel(`presensi-sesi-${sesiId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "presensi", filter: `sesi_id=eq.${sesiId}` },
        (payload) => {
          addRow(payload.new as PresensiRow)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sesiId, addRow])

  return { rows, isConnected }
}
