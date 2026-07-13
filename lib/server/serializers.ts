import { derivePresensiStatus } from "@/lib/server/sesi-status"

export function serializeSesiHariIni(sesi: {
  id: string; pertemuan_ke: number; topik: string
  presensi_mulai: Date | null; presensi_selesai: Date | null
}) {
  return {
    sesiId: sesi.id,
    pertemuanKe: sesi.pertemuan_ke,
    topik: sesi.topik,
    presensiMulai: sesi.presensi_mulai,
    presensiSelesai: sesi.presensi_selesai,
    status: derivePresensiStatus(sesi.presensi_mulai, sesi.presensi_selesai),
  }
}

export function serializeMataKuliah(mk: {
  id: string; kode: string; nama: string; sks: number; semester: number
  hari: string; jam_mulai: string; jam_selesai: string; ruang: string; dosen_id: string
  dosen?: { nama: string } | null
  _count?: { enrollments: number }
}) {
  return {
    id: mk.id, kode: mk.kode, nama: mk.nama, sks: mk.sks, semester: mk.semester,
    dosenId: mk.dosen_id, dosenNama: mk.dosen?.nama ?? null,
    jadwal: { hari: mk.hari, jamMulai: mk.jam_mulai, jamSelesai: mk.jam_selesai, ruang: mk.ruang },
    enrolledCount: mk._count?.enrollments ?? undefined,
  }
}

export function serializeMahasiswa(m: {
  id: string; nim: string; nama: string; prodi: string; semester: number
  email: string | null; id_jari: number | null; fingerprint_enrolled: boolean | null
}) {
  return {
    id: m.id, nim: m.nim, nama: m.nama, prodi: m.prodi, semester: m.semester,
    email: m.email, idJari: m.id_jari, fingerprintEnrolled: !!m.fingerprint_enrolled,
  }
}
