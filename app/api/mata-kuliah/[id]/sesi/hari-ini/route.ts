import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { toJakartaIsoDate } from "@/lib/server/sesi-status"
import { serializeSesiHariIni } from "@/lib/server/serializers"

// GET /api/mata-kuliah/:id/sesi/hari-ini — sesi hari ini utk course ini (null kalau belum ada)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const tanggalIso = toJakartaIsoDate(new Date())
  const sesi = await prisma.sesi.findFirst({
    where: { mata_kuliah_id: id, tanggal: new Date(`${tanggalIso}T00:00:00.000Z`) },
  })
  return NextResponse.json({ ok: true, data: sesi ? serializeSesiHariIni(sesi) : null })
}
