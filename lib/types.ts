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
  /** Lowercase, tanpa spasi, diturunkan dari `nama` sesuai aturan login. */
  password: string
  prodi: string
  semester: number
  email: string
  avatarUrl?: string
  fingerprintEnrolled: boolean
  enrolledCourseIds: string[]
}

export interface Lecturer {
  id: string
  nip: string
  nama: string
  /** Lowercase, tanpa spasi, diturunkan dari `nama` sesuai aturan login. */
  password: string
  email: string
  avatarUrl?: string
}

export interface Course {
  id: string
  kode: string
  nama: string
  sks: number
  dosenId: string
  semester: number
  jadwal: JadwalKuliah
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
  studentId: string
  courseId: string
  sessionId: string
  /** ISO datetime. */
  timestamp: string
  status: AttendanceStatus
  method: AttendanceMethod
  deviceId: string
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

