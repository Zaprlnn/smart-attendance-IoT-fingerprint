import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"

// GET /api/presensi/rekap?mataKuliahId= — semua presensi utk mata kuliah milik dosen yg login
// (dipivot di frontend, seperti rekap page). Kalau mataKuliahId tidak diisi, semua matkul
// yg diampu dosen ini. [dosen]
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "lecturer")
  if (auth instanceof NextResponse) return auth

  const mataKuliahId = request.nextUrl.searchParams.get("mataKuliahId")
  const myCourseIds = (
    await prisma.mata_kuliah.findMany({ where: { dosen_id: auth.sub }, select: { id: true } })
  ).map((c) => c.id)

  const scopedCourseIds = mataKuliahId && myCourseIds.includes(mataKuliahId) ? [mataKuliahId] : myCourseIds

  const rows = await prisma.presensi.findMany({
    where: { mata_kuliah_id: { in: scopedCourseIds } },
    include: { mahasiswa: true, mata_kuliah: true, sesi: true },
    orderBy: { timestamp: "desc" },
  })
  return NextResponse.json({
    ok: true,
    data: rows.map((r) => ({
      id: r.id,
      mahasiswa: { id: r.mahasiswa.id, nim: r.mahasiswa.nim, nama: r.mahasiswa.nama },
      courseId: r.mata_kuliah_id,
      courseNama: r.mata_kuliah.nama,
      sesiId: r.sesi_id,
      pertemuanKe: r.sesi.pertemuan_ke,
      tanggal: r.sesi.tanggal,
      jamMulai: r.mata_kuliah.jam_mulai,
      timestamp: r.timestamp,
      status: r.status,
      method: r.method,
    })),
  })
}
