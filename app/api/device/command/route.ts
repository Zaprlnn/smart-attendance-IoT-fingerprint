/**
 * GET/POST /api/device/command — ESP32 polling perintah pending & lapor hasil
 * (mis. enroll selesai). Path ini hardcode di firmware (kirimAbsensi/TaskPollServer
 * di scripts/Smart_Attendance_IoT.ino), tidak boleh diubah.
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { hasValidDeviceKey } from "@/lib/server/auth"
import { setFingerCacheEntry } from "@/lib/server/finger-cache"
import { bumpDeviceHeartbeat } from "@/lib/server/device"

export async function GET(request: NextRequest) {
  if (!hasValidDeviceKey(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  const deviceKey = request.headers.get("x-device-key")!

  // Cari + klaim command pending tertua jadi 1 query atomik (bukan findFirst
  // lalu update terpisah) -- ESP32 punya timeout 2s buat polling ini, 2 query
  // berurutan (~2.2-2.4s) sering telat sehingga command "hilang" (status
  // kelanjur processing tapi ESP32 gak sempat baca respons). Heartbeat gak
  // perlu ditunggu, jalan di background.
  bumpDeviceHeartbeat(deviceKey, false).catch((err) => console.error("[/api/device/command] heartbeat gagal:", err))

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
    return NextResponse.json({ ok: true, command: null })
  }

  return NextResponse.json({ ok: true, command: cmd.command, payload: cmd.payload, command_id: cmd.id })
}

export async function POST(request: NextRequest) {
  if (!hasValidDeviceKey(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const { command_id, status, payload } = body ?? {}
  if (!command_id || !status) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 })
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
      setFingerCacheEntry(payload.id_jari, { mahasiswaId: mhs.id, nama: mhs.nama, nim: mhs.nim })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
