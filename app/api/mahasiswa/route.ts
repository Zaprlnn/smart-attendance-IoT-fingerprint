import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { pickUnusedIdJari } from "@/lib/server/finger-cache"
import { serializeMahasiswa } from "@/lib/server/serializers"

// GET /api/mahasiswa — daftar semua mahasiswa [dosen]
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "lecturer")
  if (auth instanceof NextResponse) return auth

  const rows = await prisma.mahasiswa.findMany({ orderBy: { nama: "asc" } })
  return NextResponse.json({ ok: true, data: rows.map(serializeMahasiswa) })
}

// POST /api/mahasiswa — daftarkan mahasiswa baru + antre command enroll ke ESP32 [dosen]
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "lecturer")
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => null)
  const { nama, nim, prodi, semester, email } = body ?? {}
  if (!nama || !nim || !prodi || !semester || !email) {
    return NextResponse.json({ ok: false, error: "nama, nim, prodi, semester, email wajib diisi" }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(String(nama).toLowerCase().replace(/\s+/g, ""), 10)
  let mhs
  try {
    mhs = await prisma.mahasiswa.create({
      data: { nama, nim, prodi, semester: Number(semester), email, password_hash, fingerprint_enrolled: false },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ ok: false, error: "NIM atau email sudah terdaftar" }, { status: 409 })
    }
    throw err
  }

  const deviceId = process.env.DEVICE_KEY!
  const idJari = pickUnusedIdJari()
  const cmd = await prisma.device_commands.create({
    data: {
      device_id: deviceId,
      command: "enroll",
      payload: { id_jari: idJari, mahasiswa_id: mhs.id },
      status: "pending",
    },
  })

  return NextResponse.json({ ok: true, data: serializeMahasiswa(mhs), commandId: cmd.id })
}
