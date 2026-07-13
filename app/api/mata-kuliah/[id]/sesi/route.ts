import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { deriveSesiStatus, toJakartaIsoDate } from "@/lib/server/sesi-status"

// GET /api/mata-kuliah/:id/sesi — semua pertemuan, status dihitung saat request
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const now = new Date()
  const [rows, mk] = await Promise.all([
    prisma.sesi.findMany({ where: { mata_kuliah_id: id }, orderBy: { pertemuan_ke: "asc" } }),
    prisma.mata_kuliah.findUnique({ where: { id } }),
  ])
  if (!mk) return NextResponse.json({ ok: false, error: "Mata kuliah tidak ditemukan" }, { status: 404 })

  const data = rows.map((s) => {
    const tanggalIso = toJakartaIsoDate(s.tanggal)
    return {
      id: s.id,
      courseId: mk.id,
      pertemuanKe: s.pertemuan_ke,
      tanggal: tanggalIso,
      topik: s.topik,
      status: deriveSesiStatus(tanggalIso, mk.jam_mulai, mk.jam_selesai, now),
    }
  })
  return NextResponse.json({ ok: true, data })
}
