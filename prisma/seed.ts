/**
 * Seed dosen, mata kuliah, jadwal sesi 1 semester, dan enrollment mahasiswa.
 * Data & rumus jadwal di-port 1:1 dari lib/mock/{courses,students,lecturers,generators}.ts
 * di project frontend (sudah teruji di sana), bukan ditulis ulang dari nol.
 *
 * Aman dijalankan berkali-kali (idempotent via upsert) — tidak menimpa mahasiswa
 * yang sudah punya id_jari/fingerprint_enrolled nyata dari hardware.
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

function derivePassword(nama: string): string {
  return nama.toLowerCase().replace(/\s+/g, "")
}

const HARI_INDEX: Record<string, number> = {
  Senin: 0, Selasa: 1, Rabu: 2, Kamis: 3, Jumat: 4, Sabtu: 5, Minggu: 6,
}
const HARI_BY_INDEX = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000

function toJakartaWallClock(date: Date): Date {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS)
}
function dayNameOf(date: Date): string {
  const jsDay = toJakartaWallClock(date).getUTCDay()
  return HARI_BY_INDEX[(jsDay + 6) % 7]
}
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * ONE_DAY_MS)
}
function toJakartaIsoDate(date: Date): string {
  const w = toJakartaWallClock(date)
  const y = w.getUTCFullYear()
  const m = String(w.getUTCMonth() + 1).padStart(2, "0")
  const d = String(w.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
/** Date-only kolom Postgres (@db.Date) dibaca Prisma sebagai UTC-midnight — simpan
 * tanggal kalender WIB sebagai UTC-midnight dari string ISO-nya, bukan instant WIB
 * apa adanya (yang kalau di-UTC-kan bisa mundur satu hari). */
function toDateColumn(tanggalIso: string): Date {
  return new Date(`${tanggalIso}T00:00:00.000Z`)
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return hash >>> 0
}
function mulberry32(seed: number) {
  let state = seed
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function seededRandom(key: string): () => number {
  return mulberry32(hashString(key))
}
function pickStatus(rng: () => number): string {
  const r = rng()
  if (r < 0.82) return "hadir"
  if (r < 0.88) return "izin"
  if (r < 0.94) return "sakit"
  return "alpha"
}

/** Tanggal (00:00 WIB) setiap pertemuan mingguan, mulai dari hari jadwal pertama sejak startDate. */
function weeklyDates(hari: string, startDate: Date, count: number): Date[] {
  const offset = (HARI_INDEX[hari] - HARI_INDEX[dayNameOf(startDate)] + 7) % 7
  const first = addDays(startDate, offset)
  return Array.from({ length: count }, (_, i) => addDays(first, i * 7))
}

const SEMESTER_START = new Date("2026-04-06T00:00:00+07:00")
const SESSION_COUNT = 13

const dosenSeed = [
  { nip: "60880123", nama: "Hendro Wicaksono", email: "hendro.wicaksono@uad.ac.id" },
  { nip: "60910256", nama: "Siti Maryam Hidayati", email: "siti.hidayati@uad.ac.id" },
  { nip: "60950341", nama: "Bambang Sutopo", email: "bambang.sutopo@uad.ac.id" },
]

const mataKuliahSeed = [
  { kode: "SI3312", nama: "Pemrograman Web", sks: 3, dosenNip: "60880123", semester: 4, hari: "Senin", jamMulai: "08:00", jamSelesai: "10:30", ruang: "Lab.RPL 1" },
  { kode: "SI3401", nama: "Internet of Things", sks: 3, dosenNip: "60910256", semester: 6, hari: "Selasa", jamMulai: "10:30", jamSelesai: "13:00", ruang: "Lab IoT" },
  { kode: "SI2203", nama: "Basis Data", sks: 3, dosenNip: "60880123", semester: 4, hari: "Rabu", jamMulai: "08:00", jamSelesai: "10:30", ruang: "E.301" },
  { kode: "SI3210", nama: "Analisis & Perancangan Sistem", sks: 3, dosenNip: "60950341", semester: 4, hari: "Kamis", jamMulai: "13:00", jamSelesai: "15:30", ruang: "E.302" },
  { kode: "SI3420", nama: "Sistem Pendukung Keputusan", sks: 3, dosenNip: "60910256", semester: 6, hari: "Jumat", jamMulai: "08:00", jamSelesai: "10:30", ruang: "E.205" },
]

const TOPICS: Record<string, string[]> = {
  SI3312: ["Pengenalan HTML5 & Struktur Dokumen", "CSS3 & Responsive Layout", "Dasar JavaScript & DOM", "Form Handling & Validasi", "Pengenalan React", "State & Props di React", "Routing & Client-side Navigation", "Konsumsi REST API", "Autentikasi Berbasis Token", "Deployment Aplikasi Web", "Studi Kasus: Dashboard Data", "Review & Persiapan Proyek Akhir", "Ujian Akhir Semester (UAS)"],
  SI3401: ["Pengenalan Internet of Things", "Mikrokontroler ESP32", "Protokol Komunikasi MQTT", "Sensor & Aktuator Dasar", "Sensor Fingerprint AS608", "Integrasi ESP32 ke Wi-Fi & Server", "Penyimpanan Data Sensor", "Keamanan Perangkat IoT", "Dashboard Monitoring Realtime", "Studi Kasus: Sistem Presensi IoT", "Optimasi Daya & Reliabilitas", "Presentasi Proyek IoT", "Ujian Akhir Semester (UAS)"],
  SI2203: ["Konsep Dasar Basis Data", "Model Relasional & ERD", "Normalisasi Data", "Bahasa SQL: DDL & DML", "Query Lanjut & Join", "Stored Procedure & Trigger", "Transaksi & Concurrency Control", "Indexing & Optimasi Query", "Basis Data NoSQL", "Backup & Recovery", "Studi Kasus Perancangan Basis Data", "Review Materi", "Ujian Akhir Semester (UAS)"],
  SI3210: ["Konsep Analisis & Perancangan Sistem", "Identifikasi Kebutuhan Sistem", "Pemodelan Proses Bisnis", "Use Case & Activity Diagram", "Perancangan Basis Data Sistem", "Perancangan Antarmuka Pengguna", "Perancangan Arsitektur Sistem", "Dokumentasi Teknis Sistem", "Pengujian Kebutuhan Sistem", "Studi Kasus Sistem Informasi Akademik", "Presentasi Rancangan Sistem", "Review Materi", "Ujian Akhir Semester (UAS)"],
  SI3420: ["Konsep Sistem Pendukung Keputusan", "Proses Pengambilan Keputusan", "Metode Simple Additive Weighting", "Metode AHP", "Metode TOPSIS", "Metode Profile Matching", "Implementasi SPK Berbasis Web", "Studi Kasus Seleksi & Penilaian", "Visualisasi Hasil Keputusan", "Evaluasi Model SPK", "Presentasi Proyek SPK", "Review Materi", "Ujian Akhir Semester (UAS)"],
}

const SEMESTER_6_KODE = ["SI3401", "SI3210", "SI3420"]
const SEMESTER_4_KODE = ["SI3312", "SI2203", "SI3210"]

const mahasiswaSeed = [
  { nim: "2300016035", nama: "Alvindra Ramadhan", semester: 6 },
  { nim: "2300016045", nama: "Muhammad Ibnu ZS", semester: 6 },
  { nim: "2300016053", nama: "Ardiansyah", semester: 6 },
  { nim: "2300016012", nama: "Dewi Lestari Putri", semester: 6 },
  { nim: "2300016019", nama: "Rizky Maulana Akbar", semester: 6 },
  { nim: "2300016027", nama: "Putri Ayu Wulandari", semester: 6 },
  { nim: "2400016008", nama: "Fajar Nur Hidayat", semester: 4 },
  { nim: "2400016014", nama: "Anisa Rahmawati", semester: 4 },
  { nim: "2400016021", nama: "Bayu Setiawan", semester: 4 },
  { nim: "2400016030", nama: "Salsabila Putri Anggraini", semester: 4 },
  { nim: "2400016038", nama: "Galih Pratama", semester: 4 },
  { nim: "2400016044", nama: "Nadia Permata Sari", semester: 4 },
]

async function main() {
  const dosenIdByNip = new Map<string, string>()
  for (const d of dosenSeed) {
    const password_hash = await bcrypt.hash(derivePassword(d.nama), 10)
    const row = await prisma.dosen.upsert({
      where: { nip: d.nip },
      update: { nama: d.nama, email: d.email },
      create: { ...d, password_hash },
    })
    dosenIdByNip.set(d.nip, row.id)
  }

  const mkIdByKode = new Map<string, string>()
  for (const c of mataKuliahSeed) {
    const row = await prisma.mata_kuliah.upsert({
      where: { kode: c.kode },
      update: {
        nama: c.nama, sks: c.sks, semester: c.semester, hari: c.hari,
        jam_mulai: c.jamMulai, jam_selesai: c.jamSelesai, ruang: c.ruang,
        dosen_id: dosenIdByNip.get(c.dosenNip)!,
      },
      create: {
        kode: c.kode, nama: c.nama, sks: c.sks, semester: c.semester, hari: c.hari,
        jam_mulai: c.jamMulai, jam_selesai: c.jamSelesai, ruang: c.ruang,
        dosen_id: dosenIdByNip.get(c.dosenNip)!,
      },
    })
    mkIdByKode.set(c.kode, row.id)
  }

  const mhsIdByNim = new Map<string, string>()
  const enrolledKodeByNim = new Map<string, string[]>()
  for (const s of mahasiswaSeed) {
    const password_hash = await bcrypt.hash(derivePassword(s.nama), 10)
    const row = await prisma.mahasiswa.upsert({
      where: { nim: s.nim },
      update: { password_hash },
      create: {
        nim: s.nim,
        nama: s.nama,
        prodi: "Sistem Informasi",
        semester: s.semester,
        email: `${s.nim}@webmail.uad.ac.id`,
        password_hash,
      },
    })
    mhsIdByNim.set(s.nim, row.id)

    const enrolledKode = s.semester >= 6 ? SEMESTER_6_KODE : SEMESTER_4_KODE
    enrolledKodeByNim.set(s.nim, enrolledKode)
    for (const kode of enrolledKode) {
      const mata_kuliah_id = mkIdByKode.get(kode)!
      await prisma.enrollment.upsert({
        where: { mahasiswa_id_mata_kuliah_id: { mahasiswa_id: row.id, mata_kuliah_id } },
        update: {},
        create: { mahasiswa_id: row.id, mata_kuliah_id },
      })
    }
  }

  // sesiByKode: dipakai lagi di bawah untuk backfill presensi historis.
  const sesiByKode = new Map<string, { id: string; pertemuanKe: number; tanggalIso: string }[]>()
  for (const c of mataKuliahSeed) {
    const mata_kuliah_id = mkIdByKode.get(c.kode)!
    const dates = weeklyDates(c.hari, SEMESTER_START, SESSION_COUNT)
    const topics = TOPICS[c.kode] ?? []
    const list: { id: string; pertemuanKe: number; tanggalIso: string }[] = []
    for (let i = 0; i < SESSION_COUNT; i++) {
      const pertemuan_ke = i + 1
      const tanggalIso = toJakartaIsoDate(dates[i])
      const row = await prisma.sesi.upsert({
        where: { mata_kuliah_id_pertemuan_ke: { mata_kuliah_id, pertemuan_ke } },
        update: { tanggal: toDateColumn(tanggalIso), topik: topics[i] ?? `Pertemuan ${pertemuan_ke}` },
        create: {
          mata_kuliah_id,
          pertemuan_ke,
          tanggal: toDateColumn(tanggalIso),
          topik: topics[i] ?? `Pertemuan ${pertemuan_ke}`,
        },
      })
      list.push({ id: row.id, pertemuanKe: pertemuan_ke, tanggalIso })
    }
    sesiByKode.set(c.kode, list)
  }

  // Backfill presensi historis (sesi yang sudah lewat) supaya dashboard tidak kosong total
  // begitu mock dihapus — status di-random secara deterministik seperti lib/mock/attendance.ts,
  // kecuali pasangan Galih Pratama + Basis Data yang sengaja dibuat <75% (demo warning).
  // method selalu "manual" karena ini backfill, bukan scan fingerprint asli.
  const LOW_ATTENDANCE_NIM = "2400016038" // Galih Pratama
  const LOW_ATTENDANCE_KODE = "SI2203" // Basis Data
  const now = new Date()

  // Satu findMany saja untuk tahu kombinasi (mahasiswa,sesi) yang sudah ada — dipakai untuk
  // skip, supaya rerun seed tidak menimpa presensi asli hasil scan fingerprint sungguhan.
  // (Menghindari pola N+1 findUnique+upsert per baris yang lambat lewat pooler.)
  const existingKeys = new Set(
    (await prisma.presensi.findMany({ select: { mahasiswa_id: true, sesi_id: true } })).map(
      (r) => `${r.mahasiswa_id}:${r.sesi_id}`
    )
  )

  const toCreate: {
    mahasiswa_id: string; mata_kuliah_id: string; sesi_id: string
    status: string; method: string; timestamp: Date
  }[] = []

  for (const s of mahasiswaSeed) {
    const mahasiswa_id = mhsIdByNim.get(s.nim)!
    for (const kode of enrolledKodeByNim.get(s.nim) ?? []) {
      const mata_kuliah_id = mkIdByKode.get(kode)!
      const isLowAttendancePair = s.nim === LOW_ATTENDANCE_NIM && kode === LOW_ATTENDANCE_KODE
      const course = mataKuliahSeed.find((m) => m.kode === kode)!

      for (const sesi of sesiByKode.get(kode) ?? []) {
        const end = new Date(`${sesi.tanggalIso}T${course.jamSelesai}:00+07:00`)
        if (now.getTime() <= end.getTime()) continue // sesi belum selesai, jangan backfill
        if (existingKeys.has(`${mahasiswa_id}:${sesi.id}`)) continue // sudah ada (asli atau backfill sebelumnya)

        const rng = seededRandom(`${s.nim}-${kode}-${sesi.pertemuanKe}`)
        let status = pickStatus(rng)
        if (isLowAttendancePair) {
          status = sesi.pertemuanKe % 2 === 1 ? "alpha" : status
        }

        toCreate.push({
          mahasiswa_id,
          mata_kuliah_id,
          sesi_id: sesi.id,
          status,
          method: "manual",
          timestamp: new Date(`${sesi.tanggalIso}T${course.jamMulai}:00+07:00`),
        })
      }
    }
  }

  if (toCreate.length > 0) {
    await prisma.presensi.createMany({ data: toCreate, skipDuplicates: true })
  }

  // ponytail: hanya 1 ESP32 fisik yang benar-benar ada (lihat DEVICE_KEY di .env/.ino),
  // jadi cuma 1 baris device yang di-seed — bukan simulasi banyak device seperti mock lama.
  const deviceKey = process.env.DEVICE_KEY
  if (deviceKey) {
    await prisma.device.upsert({
      where: { device_key: deviceKey },
      update: {},
      create: {
        nama: "ESP32 Presensi",
        ruang: "Lab IoT",
        device_key: deviceKey,
        status: "offline",
        sensor_ok: true,
        signal: 0,
      },
    })
  }

  console.log("Seed selesai.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
