"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/client"
import type { AbsensiRow } from "@/lib/types"

interface UseAbsensiRealtimeResult {
  rows: AbsensiRow[]
  isConnected: boolean
  totalHariIni: number
}

/**
 * Hook untuk subscribe ke tabel `absensi` via Supabase Realtime.
 *
 * - Mengambil 50 data terbaru saat mount (urutan terbaru di atas).
 * - Mendengarkan INSERT baru secara realtime tanpa perlu refresh.
 * - Cleanup subscription saat unmount.
 *
 * @param limit  Jumlah baris awal yang diambil. Default 50.
 */
export function useAbsensiRealtime(limit = 50): UseAbsensiRealtimeResult {
  const [rows, setRows] = useState<AbsensiRow[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const addRow = useCallback((newRow: AbsensiRow) => {
    setRows((prev) => {
      // Hindari duplikat (kalau event datang 2x)
      if (prev.some((r) => r.id === newRow.id)) return prev
      return [newRow, ...prev]
    })
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // ── 1. Ambil data awal ──────────────────────────────────────────────
    supabase
      .from("absensi")
      .select("*")
      .order("waktu", { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (error) {
          console.error("[useAbsensiRealtime] fetch awal gagal:", error.message)
          return
        }
        setRows((data as AbsensiRow[]) ?? [])
      })

    // ── 2. Subscribe realtime INSERT ────────────────────────────────────
    const channel = supabase
      .channel("absensi-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "absensi",
        },
        (payload) => {
          addRow(payload.new as AbsensiRow)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [limit, addRow])

  // Hitung total scan hari ini (WIB = UTC+7)
  const todayWIB = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  )
    .toISOString()
    .slice(0, 10) // "YYYY-MM-DD"

  const totalHariIni = rows.filter((r) => {
    const waktuWIB = new Date(r.waktu).toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    })
    return new Date(waktuWIB).toISOString().slice(0, 10) === todayWIB
  }).length

  return { rows, isConnected, totalHariIni }
}
