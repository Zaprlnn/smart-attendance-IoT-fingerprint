import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { canAccessStudent } from "@/lib/server/mahasiswa"

// GET /api/mahasiswa/:id/presensi — riwayat presensi mentah, terbaru dulu
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  if (!canAccessStudent(auth, id)) {
    return NextResponse.json({ ok: false, error: "Tidak punya akses" }, { status: 403 })
  }
  const rows = await prisma.presensi.findMany({
    where: { mahasiswa_id: id },
    include: { mata_kuliah: true, sesi: true },
    orderBy: { timestamp: "desc" },
  })
  return NextResponse.json({
    ok: true,
    data: rows.map((r) => ({
      id: r.id,
      courseId: r.mata_kuliah_id,
      courseNama: r.mata_kuliah.nama,
      sesiId: r.sesi_id,
      pertemuanKe: r.sesi.pertemuan_ke,
      timestamp: r.timestamp,
      status: r.status,
      method: r.method,
      deviceId: r.device_id,
    })),
  })
}
