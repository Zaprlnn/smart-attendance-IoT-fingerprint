/**
 * GET/POST /api/device/command
 *
 * Proxy tipis ke backend/ (Express + Prisma, src/routes/device.ts). Sama
 * seperti /api/absensi — tetap di port 3000 karena firmware ESP32 hardcode
 * URL ini (lihat kirimAbsensi/TaskPollServer di Smart_Attendance_IoT.ino).
 */
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000"

export async function GET(request: NextRequest) {
  const upstream = await fetch(`${BACKEND_URL}/device/command`, {
    headers: { "x-device-key": request.headers.get("x-device-key") ?? "" },
  })
  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const upstream = await fetch(`${BACKEND_URL}/device/command`, {
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
