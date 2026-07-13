/**
 * POST /api/absensi
 *
 * Proxy tipis ke backend/ (Express + Prisma, src/routes/device.ts) — logic
 * asli (cari nama by id_jari, insert absensi, upsert presensi) sekarang
 * hidup di sana. Route ini TETAP di port 3000 karena firmware ESP32
 * (scripts/Smart_Attendance_IoT.ino) hardcode URL ini dan tidak boleh diubah.
 */
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const upstream = await fetch(`${BACKEND_URL}/device/absensi`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-device-key": request.headers.get("x-device-key") ?? "",
    },
    body,
  })
  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}

export async function GET() {
  const upstream = await fetch(`${BACKEND_URL}/device/absensi`)
  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}
