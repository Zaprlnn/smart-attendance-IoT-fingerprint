import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { canAccessStudent, computeSummaries } from "@/lib/server/mahasiswa"

// GET /api/mahasiswa/:id/presensi-summary — rekap per mata kuliah (hadir/izin/sakit/alpha/%)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { id: mahasiswaId } = await params
  if (!canAccessStudent(auth, mahasiswaId)) {
    return NextResponse.json({ ok: false, error: "Tidak punya akses" }, { status: 403 })
  }
  const enrollments = await prisma.enrollment.findMany({
    where: { mahasiswa_id: mahasiswaId },
    include: { mata_kuliah: true },
  })
  const data = await computeSummaries(mahasiswaId, enrollments)
  return NextResponse.json({ ok: true, data })
}
