import { Router } from "express"
import { prisma } from "../lib/prisma.js"
import { requireDeviceKey } from "../lib/auth.js"

export const deviceRouter = Router()

// Cache in-memory id_jari -> {mahasiswaId, nama}, biar respons ke ESP32 gak
// perlu nunggu round-trip ke Supabase (jaringan lambat, ~1-1.2s/query). Data
// mahasiswa cuma berubah pas enroll (jarang), jadi cache ini di-refresh di
// tempat itu aja, bukan tiap request.
const fingerCache = new Map<number, { mahasiswaId: string; nama: string }>()

export async function loadFingerCache() {
  const rows = await prisma.mahasiswa.findMany({
    where: { id_jari: { not: null } },
    select: { id: true, id_jari: true, nama: true },
  })
  fingerCache.clear()
  for (const r of rows) {
    if (r.id_jari != null) fingerCache.set(r.id_jari, { mahasiswaId: r.id, nama: r.nama })
  }
  console.log(`[fingerCache] dimuat ${fingerCache.size} mahasiswa`)
}

// AS608 nyimpen sidik jari per slot ID (1-127) -- kalau 2 mahasiswa kepilih id_jari
// yang sama, template lama ketiban yang baru dan nama di cache ikut ketuker.
// Cari angka yang belum dipakai siapapun (bukan asal random tanpa cek).
export function pickUnusedIdJari(): number {
  for (let attempt = 0; attempt < 127; attempt++) {
    const candidate = Math.floor(Math.random() * 127) + 1
    if (!fingerCache.has(candidate)) return candidate
  }
  throw new Error("Semua slot id_jari (1-127) sudah terpakai")
}

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
  const namaFallback = typeof nama === "string" && nama.trim() ? nama.trim() : null

  const cached = fingerCache.get(id_jari)
  const finalNama = cached?.nama ?? namaFallback ?? `ID Jari #${id_jari}`
  const waktu = new Date()

  // Jawab ESP32 dari cache in-memory dulu (instan, 0 round-trip ke Supabase --
  // ESP32 cuma baca field "nama" dari respons ini, gak baca data.id/waktu).
  // Insert absensi + bookkeeping beneran jalan setelahnya di background.
  // ponytail: kalau proses crash persis di antara respons ini & insert
  // selesai, 1 scan itu bisa gak kesimpan. Upgrade path kalau itu jadi
  // masalah nyata: tulis ke antrian lokal dulu (mis. SQLite) sebelum respons.
  res.json({ ok: true, data: { id: 0, waktu }, nama: finalNama })

  prisma.absensi
    .create({ data: { id_jari, nama: finalNama, status: statusValue, waktu } })
    .then(() => {
      console.log(`[/device/absensi] INSERT OK — id_jari=${id_jari} nama="${finalNama}"`)
      return Promise.all([
        cached ? upsertPresensiJikaAdaSesiBerjalan(cached.mahasiswaId, deviceKey) : Promise.resolve(),
        bumpDeviceHeartbeat(deviceKey, true),
      ])
    })
    .catch((err) => console.error("[/device/absensi] background insert/bookkeeping gagal:", err))
})

deviceRouter.get("/absensi", (_req, res) => {
  res.json({ ok: true, message: "Smart Attendance IoT endpoint aktif. Gunakan POST untuk kirim data absensi." })
})

// ── GET /device/command — ESP32 polling perintah pending ───────────────────
// Port 1:1 dari app/api/device/command/route.ts (frontend). Ditambah heartbeat device.
deviceRouter.get("/command", requireDeviceKey, async (req, res) => {
  const deviceKey = req.headers["x-device-key"] as string

  // Cari + klaim command pending tertua jadi 1 query atomik (bukan findFirst
  // lalu update terpisah) -- ESP32 punya timeout 2s buat polling ini, 2 query
  // berurutan (~2.2-2.4s) sering telat sehingga command "hilang" (status
  // kelanjur processing tapi ESP32 gak sempat baca respons). Heartbeat gak
  // perlu ditunggu, jalan di background.
  bumpDeviceHeartbeat(deviceKey, false).catch((err) => console.error("[/device/command] heartbeat gagal:", err))

  const [cmd] = await prisma.$queryRaw<
    { id: string; command: string; payload: unknown }[]
  >`
    UPDATE device_commands
    SET status = 'processing', updated_at = now()
    WHERE id = (
      SELECT id FROM device_commands
      WHERE device_id = ${deviceKey} AND status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
    )
    RETURNING id, command, payload
  `

  if (!cmd) {
    return res.json({ ok: true, command: null })
  }

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
      const mhs = await prisma.mahasiswa.update({
        where: { id: cmdPayload.mahasiswa_id },
        data: { id_jari: payload.id_jari, fingerprint_enrolled: true },
      })
      fingerCache.set(payload.id_jari, { mahasiswaId: mhs.id, nama: mhs.nama })
    }

    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) })
  }
})
