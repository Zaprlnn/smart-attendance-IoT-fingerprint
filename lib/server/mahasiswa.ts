import { prisma } from "@/lib/server/prisma"

const MIN_ATTENDANCE_PERCENTAGE = 75

// Satu query utk semua mata kuliah sekaligus (groupBy), bukan 1 query per mata kuliah —
// N+1 round-trip ke pooler Supabase adalah sumber utama loading lambat sebelumnya.
export async function computeSummaries(
  mahasiswaId: string,
  enrollments: { mata_kuliah: { id: string; kode: string; nama: string } }[]
) {
  const courseIds = enrollments.map((e) => e.mata_kuliah.id)
  const grouped = courseIds.length
    ? await prisma.presensi.groupBy({
        by: ["mata_kuliah_id", "status"],
        where: { mahasiswa_id: mahasiswaId, mata_kuliah_id: { in: courseIds } },
        _count: true,
      })
    : []

  const byCourse = new Map<string, { hadir: number; izin: number; sakit: number; alpha: number }>()
  for (const row of grouped) {
    const entry = byCourse.get(row.mata_kuliah_id) ?? { hadir: 0, izin: 0, sakit: 0, alpha: 0 }
    if (row.status === "hadir" || row.status === "izin" || row.status === "sakit" || row.status === "alpha") {
      entry[row.status] += row._count
    }
    byCourse.set(row.mata_kuliah_id, entry)
  }

  return enrollments.map(({ mata_kuliah }) => {
    const { hadir, izin, sakit, alpha } = byCourse.get(mata_kuliah.id) ?? { hadir: 0, izin: 0, sakit: 0, alpha: 0 }
    const totalSessions = hadir + izin + sakit + alpha
    const persentaseHadir = totalSessions === 0 ? 0 : Math.round((hadir / totalSessions) * 100)
    return {
      courseId: mata_kuliah.id, courseKode: mata_kuliah.kode, courseNama: mata_kuliah.nama,
      totalSessions, hadir, izin, sakit, alpha, persentaseHadir,
      isWarning: persentaseHadir < MIN_ATTENDANCE_PERCENTAGE,
    }
  })
}

export function canAccessStudent(auth: { sub: string; role: string }, studentId: string) {
  return auth.role === "lecturer" || auth.sub === studentId
}
