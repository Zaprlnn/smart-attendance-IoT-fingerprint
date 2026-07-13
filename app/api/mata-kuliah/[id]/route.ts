import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { serializeMataKuliah } from "@/lib/server/serializers"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const mk = await prisma.mata_kuliah.findUnique({
    where: { id },
    include: { dosen: { select: { nama: true } }, _count: { select: { enrollments: true } } },
  })
  if (!mk) return NextResponse.json({ ok: false, error: "Mata kuliah tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ ok: true, data: serializeMataKuliah(mk) })
}
