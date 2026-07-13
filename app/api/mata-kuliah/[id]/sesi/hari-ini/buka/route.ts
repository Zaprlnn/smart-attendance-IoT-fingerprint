import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { toJakartaIsoDate } from "@/lib/server/sesi-status"
import { serializeSesiHariIni } from "@/lib/server/serializers"

// POST /api/mata-kuliah/:id/sesi/hari-ini/buka — dosen buka presensi mandiri utk pertemuan hari ini
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, "lecturer")
  if (auth instanceof NextResponse) return auth

  const { id: mataKuliahId } = await params
  const mk = await prisma.mata_kuliah.findUnique({ where: { id: mataKuliahId } })
  if (!mk) return NextResponse.json({ ok: false, error: "Mata kuliah tidak ditemukan" }, { status: 404 })
  if (mk.dosen_id !== auth.sub) {
    return NextResponse.json({ ok: false, error: "Bukan mata kuliah yang kamu ampu" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const durasiMenit = Number(body?.durasiMenit)
  if (!Number.isFinite(durasiMenit) || durasiMenit <= 0) {
    return NextResponse.json({ ok: false, error: "durasiMenit harus angka positif" }, { status: 400 })
  }
  const topikBaru = typeof body?.topik === "string" && body.topik.trim() ? body.topik.trim() : undefined

  const now = new Date()
  const tanggalIso = toJakartaIsoDate(now)
  const presensiSelesai = new Date(now.getTime() + durasiMenit * 60_000)

  let sesi = await prisma.sesi.findFirst({
    where: { mata_kuliah_id: mataKuliahId, tanggal: new Date(`${tanggalIso}T00:00:00.000Z`) },
  })

  if (sesi) {
    sesi = await prisma.sesi.update({
      where: { id: sesi.id },
      data: { presensi_mulai: now, presensi_selesai: presensiSelesai, ...(topikBaru ? { topik: topikBaru } : {}) },
    })
  } else {
    const last = await prisma.sesi.findFirst({
      where: { mata_kuliah_id: mataKuliahId },
      orderBy: { pertemuan_ke: "desc" },
    })
    const pertemuanKe = (last?.pertemuan_ke ?? 0) + 1
    sesi = await prisma.sesi.create({
      data: {
        mata_kuliah_id: mataKuliahId,
        pertemuan_ke: pertemuanKe,
        tanggal: new Date(`${tanggalIso}T00:00:00.000Z`),
        topik: topikBaru ?? `Pertemuan ke-${pertemuanKe}`,
        presensi_mulai: now,
        presensi_selesai: presensiSelesai,
      },
    })
  }

  return NextResponse.json({ ok: true, data: serializeSesiHariIni(sesi) })
}
