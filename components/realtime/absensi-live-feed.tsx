"use client"

import { useEffect, useRef } from "react"
import { Fingerprint, Wifi, WifiOff } from "lucide-react"
import type { AbsensiRow } from "@/lib/types"
import { cn } from "@/lib/utils"

// ── Format waktu WIB ──────────────────────────────────────────────────────
function formatWaktuWIB(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "short",
  })
}

// ── Badge status ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const isHadir = status.toLowerCase() === "hadir"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isHadir
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-amber-500/15 text-amber-400"
      )}
    >
      {status}
    </span>
  )
}

// ── Satu baris absensi ────────────────────────────────────────────────────
function AbsensiRowItem({ row, isNew }: { row: AbsensiRow; isNew: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-border px-4 py-3 transition-all duration-500",
        isNew && "animate-in slide-in-from-top-2 fade-in-0 border-primary/40 bg-primary/5"
      )}
    >
      {/* Icon jari */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Fingerprint className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Nama */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight">{row.nama}</p>
        <p className="text-xs text-muted-foreground">{row.nim ?? `ID Jari #${row.id_jari}`}</p>
      </div>

      {/* Status + waktu */}
      <div className="ml-auto flex items-center gap-2">
        <StatusBadge status={row.status} />
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {formatWaktuWIB(row.waktu)}
        </span>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
      <Fingerprint className="h-10 w-10 opacity-30" />
      <p className="text-sm">Belum ada scan masuk.</p>
      <p className="text-xs opacity-70">
        Tempelkan jari ke perangkat ESP32 untuk mulai.
      </p>
    </div>
  )
}

// ── Komponen utama ────────────────────────────────────────────────────────
interface AbsensiLiveFeedProps {
  rows: AbsensiRow[]
  isConnected: boolean
  /** Jumlah baris baru yang dianggap "baru" (dengan animasi fade-in). Default 1. */
  newCount?: number
}

export function AbsensiLiveFeed({
  rows,
  isConnected,
  newCount = 1,
}: AbsensiLiveFeedProps) {
  const prevLengthRef = useRef(rows.length)

  useEffect(() => {
    prevLengthRef.current = rows.length
  }, [rows.length])

  return (
    <div className="flex flex-col gap-3">
      {/* Header koneksi */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">
              Terhubung ke Supabase Realtime
            </span>
            {/* Indikator LIVE berkedip */}
            <span className="ml-auto flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Live
              </span>
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Menghubungkan ke Realtime…
            </span>
          </>
        )}
      </div>

      {/* Daftar baris */}
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
          {rows.map((row, idx) => (
            <AbsensiRowItem
              key={row.id}
              row={row}
              isNew={idx < newCount}
            />
          ))}
        </div>
      )}
    </div>
  )
}
