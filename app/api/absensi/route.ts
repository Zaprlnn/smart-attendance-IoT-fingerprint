/**
 * POST /api/absensi
 *
 * Endpoint yang dipanggil ESP32 setiap kali sidik jari berhasil dikenali.
 * Tidak butuh JWT — diamankan dengan header `x-device-key` (shared secret sederhana).
 *
 * Body (JSON):
 *   { "id_jari": 3, "nama": "Yuda", "status": "hadir" }
 *
 * Response:
 *   200 { ok: true, data: { id, waktu } }
 *   400 { ok: false, error: "..." }
 *   401 { ok: false, error: "Unauthorized" }
 *   500 { ok: false, error: "..." }
 */

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/server-admin"

// Shared secret antara ESP32 dan server.
// Ganti nilai ini dan samakan dengan DEVICE_KEY di sketch Arduino.
const DEVICE_KEY = process.env.DEVICE_KEY;

export async function POST(request: NextRequest) {
  // ── 1. Verifikasi device key ───────────────────────────────────────────
  const incomingKey = request.headers.get("x-device-key")
  if (incomingKey !== DEVICE_KEY) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  // ── 2. Parse body ──────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body bukan JSON yang valid" },
      { status: 400 }
    )
  }

  const { id_jari, nama, status } = body as Record<string, unknown>

  if (typeof id_jari !== "number" || !Number.isInteger(id_jari) || id_jari <= 0) {
    return NextResponse.json(
      { ok: false, error: "id_jari harus integer positif" },
      { status: 400 }
    )
  }

  const statusValue = typeof status === "string" ? status.trim() : "hadir"

  // ── 3. Cari Nama di Database ───────────────────────────────────────────
  const supabase = createAdminClient()
  
  let finalNama = (typeof nama === "string" ? nama.trim() : "")
  
  // Ambil nama dari tabel mahasiswa berdasarkan id_jari
  const { data: mhsData, error: mhsError } = await supabase
    .from("mahasiswa")
    .select("nama")
    .eq("id_jari", id_jari)
    .single()

  if (mhsData && !mhsError) {
    finalNama = mhsData.nama
  } else if (!finalNama) {
    // Jika dari ESP32 tidak mengirim nama dan tidak ada di DB
    finalNama = "ID Jari #" + id_jari
  }

  // ── 4. INSERT ke Supabase ─────────────────────────────────────────────
  const { data, error } = await supabase
    .from("absensi")
    .insert({
      id_jari,
      nama: finalNama,
      status: statusValue,
      waktu: new Date().toISOString(),
    })
    .select("id, waktu")
    .single()

  if (error) {
    console.error("[/api/absensi] Supabase error:", error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }

  console.log(`[/api/absensi] INSERT OK — id_jari=${id_jari} nama="${finalNama}"`)
  return NextResponse.json({ ok: true, data, nama: finalNama })
}

// GET sederhana untuk health-check dari browser / curl
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Smart Attendance IoT endpoint aktif. Gunakan POST untuk kirim data absensi.",
  })
}
