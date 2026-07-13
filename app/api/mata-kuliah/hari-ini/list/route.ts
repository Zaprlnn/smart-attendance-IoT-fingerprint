import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { deriveSesiStatus, toJakartaIsoDate } from "@/lib/server/sesi-status"
import { serializeMataKuliah } from "@/lib/server/serializers"

// GET /api/mata-kuliah/hari-ini/list — mata kuliah dg sesi HARI INI utk dosen yg login (atau semua kalau student)
export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const now = new Date()
  const tanggalIso = toJakartaIsoDate(now)
  const sesiHariIni = await prisma.sesi.findMany({
    where: { tanggal: new Date(`${tanggalIso}T00:00:00.000Z`) },
    include: {
      mata_kuliah: { include: { dosen: { select: { nama: true } }, _count: { select: { enrollments: true } } } },
    },
  })

  const filtered =
    auth.role === "lecturer" ? sesiHariIni.filter((s) => s.mata_kuliah.dosen_id === auth.sub) : sesiHariIni

  return NextResponse.json({
    ok: true,
    data: filtered.map((s) => ({
      sesiId: s.id,
      pertemuanKe: s.pertemuan_ke,
      topik: s.topik,
      status: deriveSesiStatus(tanggalIso, s.mata_kuliah.jam_mulai, s.mata_kuliah.jam_selesai, now),
      mataKuliah: serializeMataKuliah(s.mata_kuliah),
    })),
  })
}
