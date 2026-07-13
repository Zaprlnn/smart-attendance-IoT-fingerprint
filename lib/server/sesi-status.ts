/** Status sesi dihitung saat query (bukan kolom tersimpan) — port dari lib/mock/generators.ts deriveStatus. */
export type SesiStatus = "akan-datang" | "berlangsung" | "selesai"

export function deriveSesiStatus(
  tanggalIso: string,
  jamMulai: string,
  jamSelesai: string,
  now: Date = new Date()
): SesiStatus {
  const start = new Date(`${tanggalIso}T${jamMulai}:00+07:00`)
  const end = new Date(`${tanggalIso}T${jamSelesai}:00+07:00`)
  if (now.getTime() < start.getTime()) return "akan-datang"
  if (now.getTime() > end.getTime()) return "selesai"
  return "berlangsung"
}

export type PresensiStatus = "belum_dibuka" | "dibuka" | "ditutup"

/** Status window presensi mandiri (dosen buka/tutup manual) — beda dari SesiStatus (jadwal tetap). */
export function derivePresensiStatus(
  mulai: Date | null,
  selesai: Date | null,
  now: Date = new Date()
): PresensiStatus {
  if (!mulai || !selesai) return "belum_dibuka"
  if (now.getTime() < mulai.getTime()) return "belum_dibuka"
  if (now.getTime() > selesai.getTime()) return "ditutup"
  return "dibuka"
}

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
const HARI_BY_INDEX = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

/** Nama hari (WIB) dari sebuah tanggal — port dari lib/mock/generators.ts dayNameOf. */
export function dayNameOf(date: Date): string {
  const wallClock = new Date(date.getTime() + JAKARTA_OFFSET_MS)
  const jsDay = wallClock.getUTCDay()
  return HARI_BY_INDEX[(jsDay + 6) % 7]
}

/** Tanggal kalender WIB "YYYY-MM-DD" — port dari lib/mock/generators.ts toJakartaIsoDate. */
export function toJakartaIsoDate(date: Date): string {
  const wallClock = new Date(date.getTime() + JAKARTA_OFFSET_MS)
  const y = wallClock.getUTCFullYear()
  const m = String(wallClock.getUTCMonth() + 1).padStart(2, "0")
  const d = String(wallClock.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
