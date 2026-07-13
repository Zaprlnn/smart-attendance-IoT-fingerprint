import { Router } from "express"
import { prisma } from "../lib/prisma.js"
import { requireDeviceKey } from "../lib/auth.js"

export const deviceRouter = Router()

/**
 * Presensi mandiri: dosen membuka window presensi (presensi_mulai/presensi_selesai)
 * per pertemuan dari halaman mata kuliahnya. Kalau mahasiswa yang absen ini enroll
 * di mata kuliah dg sesi yang SEDANG dibuka (now di antara presensi_mulai..presensi_selesai),
 * catat ke tabel presensi. Di luar window itu (belum dibuka / sudah ditutup), scan
 * tetap masuk log mentah `absensi` tapi tidak dihitung hadir — tidak menebak sesi mana.
 */
async function upsertPresensiJikaAdaSesiBerjalan(mahasiswaId: string, deviceKey: string | null) {
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

async function bumpDeviceHeartbeat(deviceKey: string | null, bumpScanCount: boolean) {
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

// ── POST /device/absensi — ESP32 kirim hasil scan fingerprint ──────────────
// Port 1:1 dari app/api/absensi/route.ts (frontend), kontrak request/response
// TIDAK BOLEH berubah karena firmware (scripts/Smart_Attendance_IoT.ino) hardcode
// bentuk ini. Ditambah: upsert ke tabel presensi + heartbeat device.
deviceRouter.post("/absensi", requireDeviceKey, async (req, res) => {
  const { id_jari, nama, status } = req.body ?? {}

  if (typeof id_jari !== "number" || !Number.isInteger(id_jari) || id_jari <= 0) {
    return res.status(400).json({ ok: false, error: "id_jari harus integer positif" })
  }

  const statusValue = typeof status === "string" && status.trim() ? status.trim() : "hadir"
  const deviceKey = (req.headers["x-device-key"] as string) ?? null

  const mhs = await prisma.mahasiswa.findFirst({ where: { id_jari } })
  const finalNama = mhs?.nama || (typeof nama === "string" && nama.trim()) || `ID Jari #${id_jari}`

  const [row] = await Promise.all([
    prisma.absensi.create({
      data: { id_jari, nama: finalNama, status: statusValue, waktu: new Date() },
      select: { id: true, waktu: true },
    }),
    mhs ? upsertPresensiJikaAdaSesiBerjalan(mhs.id, deviceKey) : Promise.resolve(),
    bumpDeviceHeartbeat(deviceKey, true),
  ])

  console.log(`[/device/absensi] INSERT OK — id_jari=${id_jari} nama="${finalNama}"`)
  return res.json({
    ok: true,
    data: { id: Number(row.id), waktu: row.waktu },
    nama: finalNama,
  })
})

deviceRouter.get("/absensi", (_req, res) => {
  res.json({ ok: true, message: "Smart Attendance IoT endpoint aktif. Gunakan POST untuk kirim data absensi." })
})

// ── GET /device/command — ESP32 polling perintah pending ───────────────────
// Port 1:1 dari app/api/device/command/route.ts (frontend). Ditambah heartbeat device.
deviceRouter.get("/command", requireDeviceKey, async (req, res) => {
  const deviceKey = req.headers["x-device-key"] as string

  await bumpDeviceHeartbeat(deviceKey, false)

  const cmd = await prisma.device_commands.findFirst({
    where: { device_id: deviceKey, status: "pending" },
    orderBy: { created_at: "asc" },
  })

  if (!cmd) {
    return res.json({ ok: true, command: null })
  }

  await prisma.device_commands.update({
    where: { id: cmd.id },
    data: { status: "processing", updated_at: new Date() },
  })

  return res.json({ ok: true, command: cmd.command, payload: cmd.payload, command_id: cmd.id })
})

// ── POST /device/command — ESP32 lapor hasil perintah (mis. enroll selesai) ─
deviceRouter.post("/command", requireDeviceKey, async (req, res) => {
  const { command_id, status, payload } = req.body ?? {}
  if (!command_id || !status) {
    return res.status(400).json({ ok: false, error: "Missing fields" })
  }

  try {
    const cmd = await prisma.device_commands.findUnique({ where: { id: command_id } })

    await prisma.device_commands.update({
      where: { id: command_id },
      data: { status, updated_at: new Date() },
    })

    const cmdPayload = cmd?.payload as { mahasiswa_id?: string } | null
    if (status === "completed" && payload?.id_jari && cmdPayload?.mahasiswa_id) {
      await prisma.mahasiswa.update({
        where: { id: cmdPayload.mahasiswa_id },
        data: { id_jari: payload.id_jari, fingerprint_enrolled: true },
      })
    }

    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) })
  }
})
