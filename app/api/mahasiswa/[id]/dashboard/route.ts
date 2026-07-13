import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"
import { canAccessStudent, computeSummaries } from "@/lib/server/mahasiswa"
import { deriveSesiStatus, derivePresensiStatus, dayNameOf, toJakartaIsoDate } from "@/lib/server/sesi-status"
import { serializeMataKuliah } from "@/lib/server/serializers"

// GET /api/mahasiswa/:id/dashboard — ringkasan utk halaman dashboard mahasiswa: summary per
// mata kuliah, jadwal+status hari ini, dan 5 aktivitas presensi terakhir.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { id: mahasiswaId } = await params
  if (!canAccessStudent(auth, mahasiswaId)) {
    return NextResponse.json({ ok: false, error: "Tidak punya akses" }, { status: 403 })
  }

  const now = new Date()
  const tanggalIso = toJakartaIsoDate(now)
  const hariIni = dayNameOf(now)

  const enrollments = await prisma.enrollment.findMany({
    where: { mahasiswa_id: mahasiswaId },
    include: { mata_kuliah: { include: { dosen: { select: { nama: true } } } } },
  })

  const todayEnrollments = enrollments.filter(({ mata_kuliah }) => mata_kuliah.hari === hariIni)
  const todayCourseIds = todayEnrollments.map((e) => e.mata_kuliah.id)

  // Independen satu sama lain — jalankan sekaligus, bukan bergantian menunggu.
  const [summaries, [todaySesiRows, todayRecords], recentActivity] = await Promise.all([
    computeSummaries(mahasiswaId, enrollments),
    todayCourseIds.length
      ? Promise.all([
          prisma.sesi.findMany({
            where: { mata_kuliah_id: { in: todayCourseIds }, tanggal: new Date(`${tanggalIso}T00:00:00.000Z`) },
          }),
          prisma.presensi.findMany({
            where: { mahasiswa_id: mahasiswaId, mata_kuliah_id: { in: todayCourseIds } },
          }),
        ])
      : Promise.resolve([[], []] as const),
    prisma.presensi.findMany({
      where: { mahasiswa_id: mahasiswaId },
      include: { mata_kuliah: true },
      orderBy: { timestamp: "desc" },
      take: 5,
    }),
  ])

  const sesiByCourseId = new Map(todaySesiRows.map((s) => [s.mata_kuliah_id, s]))
  const recordBySesiId = new Map(todayRecords.map((r) => [r.sesi_id, r]))

  const todayCourses = todayEnrollments.map(({ mata_kuliah }) => {
    const sesi = sesiByCourseId.get(mata_kuliah.id)
    return {
      course: serializeMataKuliah(mata_kuliah),
      sesi: sesi
        ? {
            id: sesi.id,
            pertemuanKe: sesi.pertemuan_ke,
            status: deriveSesiStatus(tanggalIso, mata_kuliah.jam_mulai, mata_kuliah.jam_selesai, now),
            presensiStatus: derivePresensiStatus(sesi.presensi_mulai, sesi.presensi_selesai, now),
          }
        : null,
      record: sesi ? recordBySesiId.get(sesi.id) ?? null : null,
    }
  })

  return NextResponse.json({
    ok: true,
    data: {
      summaries,
      todayCourses,
      recentActivity: recentActivity.map((r) => ({
        id: r.id, courseId: r.mata_kuliah_id, courseNama: r.mata_kuliah.nama,
        timestamp: r.timestamp, status: r.status,
      })),
    },
  })
}
