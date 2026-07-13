import { prisma } from "@/lib/server/prisma"

/**
 * Presensi mandiri: dosen membuka window presensi (presensi_mulai/presensi_selesai)
 * per pertemuan dari halaman mata kuliahnya. Kalau mahasiswa yang absen ini enroll
 * di mata kuliah dg sesi yang SEDANG dibuka (now di antara presensi_mulai..presensi_selesai),
 * catat ke tabel presensi. Di luar window itu (belum dibuka / sudah ditutup), scan
 * tetap masuk log mentah `absensi` tapi tidak dihitung hadir — tidak menebak sesi mana.
 */
export async function upsertPresensiJikaAdaSesiBerjalan(mahasiswaId: string, deviceKey: string | null) {
  const now = new Date()

  const sesi = await prisma.sesi.findFirst({
    where: {
      mata_kuliah: { enrollments: { some: { mahasiswa_id: mahasiswaId } } },
      presensi_mulai: { lte: now },
      presensi_selesai: { gte: now },
    },
  })
  if (!sesi) return

  await prisma.presensi.upsert({
    where: { mahasiswa_id_sesi_id: { mahasiswa_id: mahasiswaId, sesi_id: sesi.id } },
    update: { status: "hadir", method: "fingerprint", device_id: deviceKey, timestamp: now },
    create: {
      mahasiswa_id: mahasiswaId,
      mata_kuliah_id: sesi.mata_kuliah_id,
      sesi_id: sesi.id,
      status: "hadir",
      method: "fingerprint",
      device_id: deviceKey,
      timestamp: now,
    },
  })
}

export async function bumpDeviceHeartbeat(deviceKey: string | null, bumpScanCount: boolean) {
  if (!deviceKey) return
  await prisma.device.updateMany({
    where: { device_key: deviceKey },
    data: {
      status: "online",
      last_seen: new Date(),
      ...(bumpScanCount ? { total_scan_hari_ini: { increment: 1 } } : {}),
    },
  })
}
