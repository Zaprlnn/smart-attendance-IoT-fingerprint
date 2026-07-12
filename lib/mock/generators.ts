import type { Course, Hari, Session, SessionStatus } from "@/lib/types"

/** Password mock = nama lengkap, lowercase, tanpa spasi. */
export function derivePassword(nama: string): string {
  return nama.toLowerCase().replace(/\s+/g, "")
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

/** PRNG deterministik (mulberry32) — hasil sama setiap kali dijalankan untuk seed yang sama. */
function mulberry32(seed: number) {
  let state = seed
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** RNG deterministik yang seed-nya diturunkan dari sebuah string kunci (mis. id mahasiswa+sesi). */
export function seededRandom(key: string): () => number {
  return mulberry32(hashString(key))
}

const HARI_INDEX: Record<Hari, number> = {
  Senin: 0,
  Selasa: 1,
  Rabu: 2,
  Kamis: 3,
  Jumat: 4,
  Sabtu: 5,
  Minggu: 6,
}

const HARI_BY_INDEX: Hari[] = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
]

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000

/**
 * Geser sebuah instant ke "jam dinding" WIB lalu baca komponennya via UTC
 * getters. Ini membuat perhitungan kalender (hari/tanggal) konsisten dengan
 * waktu Indonesia terlepas dari timezone server tempat kode dijalankan.
 */
function toJakartaWallClock(date: Date): Date {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS)
}

export function dayNameOf(date: Date): Hari {
  // getUTCDay(): 0=Minggu..6=Sabtu -> remap ke indeks Senin..Minggu
  const jsDay = toJakartaWallClock(date).getUTCDay()
  return HARI_BY_INDEX[(jsDay + 6) % 7]
}

/** Format tanggal kalender WIB sebagai "YYYY-MM-DD", apa pun timezone host. */
export function toJakartaIsoDate(date: Date): string {
  const wallClock = toJakartaWallClock(date)
  const y = wallClock.getUTCFullYear()
  const m = String(wallClock.getUTCMonth() + 1).padStart(2, "0")
  const d = String(wallClock.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * ONE_DAY_MS)
}

function deriveStatus(
  tanggalIso: string,
  jamMulai: string,
  jamSelesai: string
): SessionStatus {
  const start = new Date(`${tanggalIso}T${jamMulai}:00+07:00`)
  const end = new Date(`${tanggalIso}T${jamSelesai}:00+07:00`)
  const now = new Date()
  if (now.getTime() < start.getTime()) return "akan-datang"
  if (now.getTime() > end.getTime()) return "selesai"
  return "berlangsung"
}

/**
 * Buat rangkaian pertemuan mingguan untuk satu mata kuliah, dimulai dari
 * tanggal pertama yang jatuh pada hari jadwal mata kuliah tersebut.
 */
export function generateWeeklySessions(
  course: Course,
  options: { startDate: Date; count: number; topics: string[] }
): Session[] {
  const { startDate, count, topics } = options
  const targetDayIndex = HARI_INDEX[course.jadwal.hari]

  const offset = (targetDayIndex - HARI_INDEX[dayNameOf(startDate)] + 7) % 7
  const firstDate = addDays(startDate, offset)

  return Array.from({ length: count }, (_, i) => {
    const tanggalIso = toJakartaIsoDate(addDays(firstDate, i * 7))
    const pertemuanKe = i + 1

    return {
      id: `${course.id}-S${String(pertemuanKe).padStart(2, "0")}`,
      courseId: course.id,
      pertemuanKe,
      tanggal: tanggalIso,
      topik: topics[i] ?? `Pertemuan ${pertemuanKe}`,
      status: deriveStatus(
        tanggalIso,
        course.jadwal.jamMulai,
        course.jadwal.jamSelesai
      ),
    }
  })
}
