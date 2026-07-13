import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { serializeMahasiswa } from "@/lib/server/serializers"
import { canAccessStudent } from "@/lib/server/mahasiswa"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  if (!canAccessStudent(auth, id)) {
    return NextResponse.json({ ok: false, error: "Tidak punya akses" }, { status: 403 })
  }
  const mhs = await prisma.mahasiswa.findUnique({ where: { id } })
  if (!mhs) return NextResponse.json({ ok: false, error: "Mahasiswa tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ ok: true, data: serializeMahasiswa(mhs) })
}
