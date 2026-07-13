/**
 * POST /api/absensi — ESP32 kirim hasil scan fingerprint. Kontrak request/response
 * TIDAK BOLEH berubah karena firmware (scripts/Smart_Attendance_IoT.ino) hardcode
 * bentuk ini dan hardcode path ini (bukan /api/device/absensi).
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { hasValidDeviceKey } from "@/lib/server/auth"
import { getFingerCacheEntry } from "@/lib/server/finger-cache"
import { bumpDeviceHeartbeat, upsertPresensiJikaAdaSesiBerjalan } from "@/lib/server/device"

export async function POST(request: NextRequest) {
  if (!hasValidDeviceKey(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const { id_jari, nama, status } = body ?? {}

  if (typeof id_jari !== "number" || !Number.isInteger(id_jari) || id_jari <= 0) {
    return NextResponse.json({ ok: false, error: "id_jari harus integer positif" }, { status: 400 })
  }

  const statusValue = typeof status === "string" && status.trim() ? status.trim() : "hadir"
  const deviceKey = request.headers.get("x-device-key")
  const namaFallback = typeof nama === "string" && nama.trim() ? nama.trim() : null

  const cached = getFingerCacheEntry(id_jari)
  const finalNama = cached?.nama ?? namaFallback ?? `ID Jari #${id_jari}`
  const waktu = new Date()

  // Jawab ESP32 dulu (instan, 0 round-trip ke Supabase -- ESP32 cuma baca field
  // "nama" dari respons ini, gak baca data.id/waktu). Insert absensi + bookkeeping
  // beneran jalan setelahnya di background.
  // ponytail: kalau proses crash persis di antara respons ini & insert selesai, 1
  // scan itu bisa gak kesimpan. Upgrade path kalau itu jadi masalah nyata: tulis
  // ke antrian lokal dulu (mis. SQLite) sebelum respons.
  prisma.absensi
    .create({ data: { id_jari, nama: finalNama, nim: cached?.nim ?? null, status: statusValue, waktu } })
    .then(() => {
      console.log(`[/api/absensi] INSERT OK — id_jari=${id_jari} nama="${finalNama}"`)
      return Promise.all([
        cached ? upsertPresensiJikaAdaSesiBerjalan(cached.mahasiswaId, deviceKey) : Promise.resolve(),
        bumpDeviceHeartbeat(deviceKey, true),
      ])
    })
    .catch((err) => console.error("[/api/absensi] background insert/bookkeeping gagal:", err))

  return NextResponse.json({ ok: true, data: { id: 0, waktu }, nama: finalNama })
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Smart Attendance IoT endpoint aktif. Gunakan POST untuk kirim data absensi." })
}
