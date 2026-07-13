import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { serializeMataKuliah } from "@/lib/server/serializers"

// GET /api/mata-kuliah?dosenId=xxx — semua mata kuliah, atau milik satu dosen
export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const dosenId = request.nextUrl.searchParams.get("dosenId") ?? undefined
  const rows = await prisma.mata_kuliah.findMany({
    where: dosenId ? { dosen_id: dosenId } : undefined,
    include: { dosen: { select: { nama: true } }, _count: { select: { enrollments: true } } },
    orderBy: { kode: "asc" },
  })
  return NextResponse.json({ ok: true, data: rows.map(serializeMataKuliah) })
}
