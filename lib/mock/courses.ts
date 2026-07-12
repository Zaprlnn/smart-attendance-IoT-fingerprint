import type { Course } from "@/lib/types"

export const courses: Course[] = [
  {
    id: "C01",
    kode: "SI3312",
    nama: "Pemrograman Web",
    sks: 3,
    dosenId: "DSN001",
    semester: 4,
    jadwal: { hari: "Senin", jamMulai: "08:00", jamSelesai: "10:30", ruang: "Lab.RPL 1" },
  },
  {
    id: "C02",
    kode: "SI3401",
    nama: "Internet of Things",
    sks: 3,
    dosenId: "DSN002",
    semester: 6,
    jadwal: { hari: "Selasa", jamMulai: "10:30", jamSelesai: "13:00", ruang: "Lab IoT" },
  },
  {
    id: "C03",
    kode: "SI2203",
    nama: "Basis Data",
    sks: 3,
    dosenId: "DSN001",
    semester: 4,
    jadwal: { hari: "Rabu", jamMulai: "08:00", jamSelesai: "10:30", ruang: "E.301" },
  },
  {
    id: "C04",
    kode: "SI3210",
    nama: "Analisis & Perancangan Sistem",
    sks: 3,
    dosenId: "DSN003",
    semester: 4,
    jadwal: { hari: "Kamis", jamMulai: "13:00", jamSelesai: "15:30", ruang: "E.302" },
  },
  {
    id: "C05",
    kode: "SI3420",
    nama: "Sistem Pendukung Keputusan",
    sks: 3,
    dosenId: "DSN002",
    semester: 6,
    jadwal: { hari: "Jumat", jamMulai: "08:00", jamSelesai: "10:30", ruang: "E.205" },
  },
]
