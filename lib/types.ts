export type Hari =
  | "Senin"
  | "Selasa"
  | "Rabu"
  | "Kamis"
  | "Jumat"
  | "Sabtu"
  | "Minggu"

export interface JadwalKuliah {
  hari: Hari
  jamMulai: string
  jamSelesai: string
  ruang: string
}

export interface Student {
  id: string
  nim: string
  nama: string
  prodi: string
  semester: number
  email: string | null
  avatarUrl?: string
  fingerprintEnrolled: boolean
  idJari?: number | null
}

export interface Lecturer {
  id: string
  nip: string
  nama: string
  email: string | null
  avatarUrl?: string
}

export interface Course {
  id: string
  kode: string
  nama: string
  sks: number
  dosenId: string
  dosenNama?: string | null
  semester: number
  jadwal: JadwalKuliah
  enrolledCount?: number
}

export type SessionStatus = "selesai" | "berlangsung" | "akan-datang"

export interface Session {
  id: string
  courseId: string
  pertemuanKe: number
  /** ISO date (YYYY-MM-DD). */
  tanggal: string
  topik: string
  status: SessionStatus
}

export type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpha"
export type AttendanceMethod = "fingerprint" | "manual"

export interface AttendanceRecord {
  id: string
  courseId: string
  courseNama: string
  sesiId: string
  pertemuanKe: number
  /** ISO datetime. */
  timestamp: string
  status: AttendanceStatus
  method: AttendanceMethod
  deviceId: string | null
}

export type DeviceStatus = "online" | "offline"

export interface Device {
  id: string
  nama: string
  ruang: string
  status: DeviceStatus
  sensorOk: boolean
  /** 0-100 */
  signal: number
  /** ISO datetime. */
  lastSeen: string
  totalScanHariIni: number
}

export type UserRole = "student" | "lecturer"

export type AuthResult =
  | { role: "student"; user: Student }
  | { role: "lecturer"; user: Lecturer }

export interface CourseAttendanceDetail {
  session: Session
  record: AttendanceRecord | null
}

export interface AttendanceSummary {
  courseId: string
  courseNama: string
  totalSessions: number
  hadir: number
  izin: number
  sakit: number
  alpha: number
  /** 0-100 */
  persentaseHadir: number
  /** true jika persentaseHadir < 75 */
  isWarning: boolean
}

export type PresensiStatus = "belum_dibuka" | "dibuka" | "ditutup"

/** Jadwal + status hari ini utk 1 mata kuliah yang di-enroll mahasiswa — GET /mahasiswa/:id/dashboard */
export interface TodayCourseEntry {
  course: Course
  sesi: {
    id: string
    pertemuanKe: number
    status: SessionStatus
    presensiStatus: PresensiStatus
  } | null
  record: { status: AttendanceStatus } | null
}

/** GET /mata-kuliah/:id/sesi/hari-ini — window presensi mandiri pertemuan hari ini. */
export interface SesiHariIni {
  sesiId: string
  pertemuanKe: number
  topik: string
  /** ISO datetime, null kalau belum pernah dibuka. */
  presensiMulai: string | null
  presensiSelesai: string | null
  status: PresensiStatus
}

/** GET /presensi?mataKuliahId=&sesiId= — roster + status hadir utk 1 pertemuan spesifik. */
export interface LiveRosterEntry {
  mahasiswa: { id: string; nim: string; nama: string }
  record: PresensiRow | null
}

export interface RosterEntry {
  student: Student
  hadir: number
  izin: number
  sakit: number
  alpha: number
  persentaseHadir: number
  isWarning: boolean
}

export interface RecentActivityEntry {
  id: string
  courseId: string
  courseNama: string
  /** ISO datetime. */
  timestamp: string
  status: AttendanceStatus
}

export interface StudentDashboardData {
  summaries: AttendanceSummary[]
  todayCourses: TodayCourseEntry[]
  recentActivity: RecentActivityEntry[]
}

/** Baris mentah dari tabel `presensi` di Supabase (dipakai oleh hook realtime). */
export interface PresensiRow {
  id: string
  mahasiswa_id: string
  mata_kuliah_id: string
  sesi_id: string
  status: AttendanceStatus
  method: AttendanceMethod
  device_id: string | null
  timestamp: string
}

/** GET /mata-kuliah/hari-ini/list */
export interface TodaySesiEntry {
  sesiId: string
  pertemuanKe: number
  topik: string
  status: SessionStatus
  mataKuliah: Course
}

export interface DosenTodayEntry {
  course: Course
  sesi: { id: string; pertemuanKe: number; status: SessionStatus }
  hadirCount: number
  totalEnrolled: number
}

export interface DosenAtRiskRow {
  studentId: string
  nama: string
  nim: string
  courseId: string
  courseNama: string
  persentaseHadir: number
}

export interface DosenDashboardData {
  myCourses: Course[]
  uniqueStudentCount: number
  todayEntries: DosenTodayEntry[]
  hadirHariIni: number
  onlineDevices: number
  totalDevices: number
  rateData: { kode: string; nama: string; rate: number }[]
  trendData: { date: string; hadir: number }[]
  atRiskRows: DosenAtRiskRow[]
  hariIni: string
}

/** Baris dari tabel `absensi` di Supabase — dikirim langsung oleh ESP32. */
export interface AbsensiRow {
  id: number
  id_jari: number
  nama: string
  /** "hadir" atau nilai lain yang dikirim ESP32. */
  status: string
  /** ISO datetime (timestamptz). */
  waktu: string
  created_at: string
}

