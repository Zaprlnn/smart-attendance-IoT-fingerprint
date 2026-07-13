import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"

// POST /api/mata-kuliah/:id/enroll-diri — mahasiswa daftar sendiri ke mata kuliah
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, "student")
  if (auth instanceof NextResponse) return auth

  const { id: mataKuliahId } = await params
  const mk = await prisma.mata_kuliah.findUnique({ where: { id: mataKuliahId } })
  if (!mk) return NextResponse.json({ ok: false, error: "Mata kuliah tidak ditemukan" }, { status: 404 })

  await prisma.enrollment.upsert({
    where: { mahasiswa_id_mata_kuliah_id: { mahasiswa_id: auth.sub, mata_kuliah_id: mataKuliahId } },
    update: {},
    create: { mahasiswa_id: auth.sub, mata_kuliah_id: mataKuliahId },
  })

  return NextResponse.json({ ok: true })
}
