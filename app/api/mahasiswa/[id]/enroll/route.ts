import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { pickUnusedIdJari } from "@/lib/server/finger-cache"

// POST /api/mahasiswa/:id/enroll — antre command enroll fingerprint utk mahasiswa yg SUDAH
// terdaftar tapi belum enroll sidik jari. [dosen]
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, "lecturer")
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const mhs = await prisma.mahasiswa.findUnique({ where: { id } })
  if (!mhs) return NextResponse.json({ ok: false, error: "Mahasiswa tidak ditemukan" }, { status: 404 })

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
  return NextResponse.json({ ok: true, commandId: cmd.id })
}
