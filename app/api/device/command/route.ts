import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/server-admin"

// ── GET: ESP32 melakukan polling untuk mengecek perintah ───────────────────
export async function GET(req: NextRequest) {
  const deviceKey = req.headers.get("x-device-key")
  const expectedKey = process.env.DEVICE_KEY;

  if (deviceKey !== expectedKey) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Ambil 1 perintah paling lama yang statusnya 'pending'
  const { data, error } = await supabase
    .from("device_commands")
    .select("*")
    .eq("device_id", expectedKey) // Anggap expectedKey sbg device_id
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .single()

  if (error || !data) {
    // Tidak ada perintah baru
    return NextResponse.json({ ok: true, command: null })
  }

  // Tandai sebagai sedang diproses
  await supabase
    .from("device_commands")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", data.id)

  return NextResponse.json({
    ok: true,
    command: data.command,
    payload: data.payload,
    command_id: data.id,
  })
}

// ── POST: ESP32 melaporkan hasil dari perintah (misal sukses enroll) ───────
export async function POST(req: NextRequest) {
  const deviceKey = req.headers.get("x-device-key")
  const expectedKey = process.env.DEVICE_KEY;

  if (deviceKey !== expectedKey) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { command_id, status, payload } = body

    if (!command_id || !status) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Ambil data command asli untuk mendapatkan mahasiswa_id
    const { data: cmdData } = await supabase
      .from("device_commands")
      .select("payload")
      .eq("id", command_id)
      .single()

    // 2. Update status di tabel device_commands
    await supabase
      .from("device_commands")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", command_id)

    // 3. Jika ini perintah 'enroll' dan statusnya 'completed'
    // ESP32 mengirim id_jari (misal { id_jari: 7 })
    if (status === "completed" && payload?.id_jari && cmdData?.payload?.mahasiswa_id) {
      // Update tabel mahasiswa bahwa sidik jarinya sudah terdaftar
      await supabase
        .from("mahasiswa")
        .update({
          id_jari: payload.id_jari,
          fingerprint_enrolled: true,
        })
        .eq("id", cmdData.payload.mahasiswa_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
