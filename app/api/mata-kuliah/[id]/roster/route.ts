import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { serializeMahasiswa } from "@/lib/server/serializers"

const MIN_ATTENDANCE_PERCENTAGE = 75

// GET /api/mata-kuliah/:id/roster — mahasiswa yg enroll + rekap kehadiran mereka di matkul ini
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, "lecturer")
  if (auth instanceof NextResponse) return auth

  const { id: mataKuliahId } = await params
  const [enrollments, grouped] = await Promise.all([
    prisma.enrollment.findMany({ where: { mata_kuliah_id: mataKuliahId }, include: { mahasiswa: true } }),
    prisma.presensi.groupBy({
      by: ["mahasiswa_id", "status"],
      where: { mata_kuliah_id: mataKuliahId },
      _count: true,
    }),
  ])

  const byMahasiswaId = new Map<string, { hadir: number; izin: number; sakit: number; alpha: number }>()
  for (const row of grouped) {
    const entry = byMahasiswaId.get(row.mahasiswa_id) ?? { hadir: 0, izin: 0, sakit: 0, alpha: 0 }
    if (row.status === "hadir" || row.status === "izin" || row.status === "sakit" || row.status === "alpha") {
      entry[row.status] += row._count
    }
    byMahasiswaId.set(row.mahasiswa_id, entry)
  }

  const data = enrollments.map(({ mahasiswa }) => {
    const { hadir, izin, sakit, alpha } = byMahasiswaId.get(mahasiswa.id) ?? { hadir: 0, izin: 0, sakit: 0, alpha: 0 }
    const total = hadir + izin + sakit + alpha
    const persentaseHadir = total === 0 ? 0 : Math.round((hadir / total) * 100)
    return {
      student: serializeMahasiswa(mahasiswa),
      hadir, izin, sakit, alpha, persentaseHadir,
      isWarning: persentaseHadir < MIN_ATTENDANCE_PERCENTAGE,
    }
  })
  data.sort((a, b) => a.student.nama.localeCompare(b.student.nama))
  return NextResponse.json({ ok: true, data })
}
