import type { Session } from "@/lib/types"
import { courses } from "@/lib/mock/courses"
import { generateWeeklySessions } from "@/lib/mock/generators"

// Semester berjalan dimulai awal April 2026, 13 pertemuan mingguan per matkul
// (12 sudah berlangsung sampai pertengahan tahun ajaran, 1 pertemuan terakhir
// berupa UAS yang masih akan datang).
const SEMESTER_START = new Date("2026-04-06T00:00:00+07:00")
const SESSION_COUNT = 13

const TOPICS: Record<string, string[]> = {
  C01: [
    "Pengenalan HTML5 & Struktur Dokumen",
    "CSS3 & Responsive Layout",
    "Dasar JavaScript & DOM",
    "Form Handling & Validasi",
    "Pengenalan React",
    "State & Props di React",
    "Routing & Client-side Navigation",
    "Konsumsi REST API",
    "Autentikasi Berbasis Token",
    "Deployment Aplikasi Web",
    "Studi Kasus: Dashboard Data",
    "Review & Persiapan Proyek Akhir",
    "Ujian Akhir Semester (UAS)",
  ],
  C02: [
    "Pengenalan Internet of Things",
    "Mikrokontroler ESP32",
    "Protokol Komunikasi MQTT",
    "Sensor & Aktuator Dasar",
    "Sensor Fingerprint AS608",
    "Integrasi ESP32 ke Wi-Fi & Server",
    "Penyimpanan Data Sensor",
    "Keamanan Perangkat IoT",
    "Dashboard Monitoring Realtime",
    "Studi Kasus: Sistem Presensi IoT",
    "Optimasi Daya & Reliabilitas",
    "Presentasi Proyek IoT",
    "Ujian Akhir Semester (UAS)",
  ],
  C03: [
    "Konsep Dasar Basis Data",
    "Model Relasional & ERD",
    "Normalisasi Data",
    "Bahasa SQL: DDL & DML",
    "Query Lanjut & Join",
    "Stored Procedure & Trigger",
    "Transaksi & Concurrency Control",
    "Indexing & Optimasi Query",
    "Basis Data NoSQL",
    "Backup & Recovery",
    "Studi Kasus Perancangan Basis Data",
    "Review Materi",
    "Ujian Akhir Semester (UAS)",
  ],
  C04: [
    "Konsep Analisis & Perancangan Sistem",
    "Identifikasi Kebutuhan Sistem",
    "Pemodelan Proses Bisnis",
    "Use Case & Activity Diagram",
    "Perancangan Basis Data Sistem",
    "Perancangan Antarmuka Pengguna",
    "Perancangan Arsitektur Sistem",
    "Dokumentasi Teknis Sistem",
    "Pengujian Kebutuhan Sistem",
    "Studi Kasus Sistem Informasi Akademik",
    "Presentasi Rancangan Sistem",
    "Review Materi",
    "Ujian Akhir Semester (UAS)",
  ],
  C05: [
    "Konsep Sistem Pendukung Keputusan",
    "Proses Pengambilan Keputusan",
    "Metode Simple Additive Weighting",
    "Metode AHP",
    "Metode TOPSIS",
    "Metode Profile Matching",
    "Implementasi SPK Berbasis Web",
    "Studi Kasus Seleksi & Penilaian",
    "Visualisasi Hasil Keputusan",
    "Evaluasi Model SPK",
    "Presentasi Proyek SPK",
    "Review Materi",
    "Ujian Akhir Semester (UAS)",
  ],
}

export const sessions: Session[] = courses.flatMap((course) =>
  generateWeeklySessions(course, {
    startDate: SEMESTER_START,
    count: SESSION_COUNT,
    topics: TOPICS[course.id] ?? [],
  })
)
