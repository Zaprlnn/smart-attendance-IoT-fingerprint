import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { toJakartaIsoDate } from "@/lib/server/sesi-status"
import { serializeSesiHariIni } from "@/lib/server/serializers"

// POST /api/mata-kuliah/:id/sesi/hari-ini/tutup — dosen tutup presensi lebih awal
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, "lecturer")
  if (auth instanceof NextResponse) return auth

  const { id: mataKuliahId } = await params
  const mk = await prisma.mata_kuliah.findUnique({ where: { id: mataKuliahId } })
  if (!mk) return NextResponse.json({ ok: false, error: "Mata kuliah tidak ditemukan" }, { status: 404 })
  if (mk.dosen_id !== auth.sub) {
    return NextResponse.json({ ok: false, error: "Bukan mata kuliah yang kamu ampu" }, { status: 403 })
  }

  const tanggalIso = toJakartaIsoDate(new Date())
  const sesi = await prisma.sesi.findFirst({
    where: { mata_kuliah_id: mataKuliahId, tanggal: new Date(`${tanggalIso}T00:00:00.000Z`) },
  })
  if (!sesi || !sesi.presensi_mulai) {
    return NextResponse.json({ ok: false, error: "Presensi belum pernah dibuka hari ini" }, { status: 400 })
  }

  const updated = await prisma.sesi.update({ where: { id: sesi.id }, data: { presensi_selesai: new Date() } })
  return NextResponse.json({ ok: true, data: serializeSesiHariIni(updated) })
}
