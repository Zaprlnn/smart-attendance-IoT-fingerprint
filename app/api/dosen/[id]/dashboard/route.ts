import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth, type TokenPayload } from "@/lib/server/auth"
import { serializeMataKuliah } from "@/lib/server/serializers"
import { deriveSesiStatus, toJakartaIsoDate, dayNameOf } from "@/lib/server/sesi-status"

const MIN_ATTENDANCE_PERCENTAGE = 75
const OFFLINE_AFTER_MS = 15_000

function canAccessDosen(auth: TokenPayload, dosenId: string) {
  return auth.role === "lecturer" && auth.sub === dosenId
}

// GET /api/dosen/:id/dashboard — ringkasan utk dashboard dosen: stat cards, jadwal hari ini,
// tingkat kehadiran per matkul, tren harian, dan mahasiswa perlu perhatian (<75%).
//
// Semua rekap dihitung dari SATU query groupBy per metrik (bukan 1 query per mata kuliah/
// mahasiswa) — pola N+1 sebelumnya butuh puluhan round-trip sequential ke pooler Supabase
// dan itulah penyebab dashboard ini sempat butuh puluhan detik untuk load.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, "lecturer")
  if (auth instanceof NextResponse) return auth

  const { id: dosenId } = await params
  if (!canAccessDosen(auth, dosenId)) {
    return NextResponse.json({ ok: false, error: "Tidak punya akses" }, { status: 403 })
  }
  const now = new Date()
  const tanggalIso = toJakartaIsoDate(now)
  const hariIni = dayNameOf(now)

  const myCourses = await prisma.mata_kuliah.findMany({
    where: { dosen_id: dosenId },
    include: { dosen: { select: { nama: true } } },
  })
  const myCourseIds = myCourses.map((c) => c.id)

  const [enrollments, todaySesi, devices, presensiGrouped] = await Promise.all([
    prisma.enrollment.findMany({ where: { mata_kuliah_id: { in: myCourseIds } }, include: { mahasiswa: true } }),
    prisma.sesi.findMany({
      where: { mata_kuliah_id: { in: myCourseIds }, tanggal: new Date(`${tanggalIso}T00:00:00.000Z`) },
      include: { mata_kuliah: true },
    }),
    prisma.device.findMany(),
    // Satu query groupBy mencakup kebutuhan rateData, atRiskRows, DAN hadirCount hari ini sekaligus.
    prisma.presensi.groupBy({
      by: ["mahasiswa_id", "mata_kuliah_id", "sesi_id", "status"],
      where: { mata_kuliah_id: { in: myCourseIds } },
      _count: true,
    }),
  ])

  const uniqueStudentCount = new Set(enrollments.map((e) => e.mahasiswa_id)).size

  // ── hadirCount per sesi hari ini ─────────────────────────────────────────
  const hadirBySesiId = new Map<string, number>()
  for (const row of presensiGrouped) {
    if (row.status !== "hadir") continue
    hadirBySesiId.set(row.sesi_id, (hadirBySesiId.get(row.sesi_id) ?? 0) + row._count)
  }
  const todayEntries = todaySesi.map((sesi) => ({
    course: serializeMataKuliah(sesi.mata_kuliah),
    sesi: {
      id: sesi.id,
      pertemuanKe: sesi.pertemuan_ke,
      status: deriveSesiStatus(tanggalIso, sesi.mata_kuliah.jam_mulai, sesi.mata_kuliah.jam_selesai, now),
    },
    hadirCount: hadirBySesiId.get(sesi.id) ?? 0,
    totalEnrolled: enrollments.filter((e) => e.mata_kuliah_id === sesi.mata_kuliah_id).length,
  }))
  const hadirHariIni = todayEntries.reduce((acc, e) => acc + e.hadirCount, 0)

  const onlineDevices = devices.filter((d) => {
    const lastSeenMs = d.last_seen?.getTime() ?? 0
    return now.getTime() - lastSeenMs <= OFFLINE_AFTER_MS
  }).length

  // ── rateData: total & hadir per mata kuliah ─────────────────────────────
  const totalByCourse = new Map<string, number>()
  const hadirByCourse = new Map<string, number>()
  for (const row of presensiGrouped) {
    totalByCourse.set(row.mata_kuliah_id, (totalByCourse.get(row.mata_kuliah_id) ?? 0) + row._count)
    if (row.status === "hadir") {
      hadirByCourse.set(row.mata_kuliah_id, (hadirByCourse.get(row.mata_kuliah_id) ?? 0) + row._count)
    }
  }
  const rateData = myCourses.map((course) => {
    const total = totalByCourse.get(course.id) ?? 0
    const hadir = hadirByCourse.get(course.id) ?? 0
    const rate = total === 0 ? 0 : Math.round((hadir / total) * 100)
    return { kode: course.kode, nama: course.nama, rate }
  })

  // ── trendData: jumlah hadir per tanggal sesi, 10 tanggal terakhir yg ada data ───
  const sesiIds = [...new Set(presensiGrouped.filter((r) => r.status === "hadir").map((r) => r.sesi_id))]
  const sesiRows = sesiIds.length
    ? await prisma.sesi.findMany({ where: { id: { in: sesiIds } }, select: { id: true, tanggal: true } })
    : []
  const tanggalBySesiId = new Map(sesiRows.map((s) => [s.id, toJakartaIsoDate(s.tanggal)]))
  const dailyHadir = new Map<string, number>()
  for (const row of presensiGrouped) {
    if (row.status !== "hadir") continue
    const tanggal = tanggalBySesiId.get(row.sesi_id)
    if (!tanggal) continue
    dailyHadir.set(tanggal, (dailyHadir.get(tanggal) ?? 0) + row._count)
  }
  const trendData = [...dailyHadir.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-10)
    .map(([date, hadir]) => ({ date, hadir }))

  // ── atRiskRows: mahasiswa perlu perhatian (<75%) di salah satu mata kuliah ini ──
  const perStudentCourse = new Map<string, { total: number; hadir: number }>()
  for (const row of presensiGrouped) {
    const key = `${row.mahasiswa_id}:${row.mata_kuliah_id}`
    const entry = perStudentCourse.get(key) ?? { total: 0, hadir: 0 }
    entry.total += row._count
    if (row.status === "hadir") entry.hadir += row._count
    perStudentCourse.set(key, entry)
  }
  const courseById = new Map(myCourses.map((c) => [c.id, c]))
  const atRiskRows: {
    studentId: string; nama: string; nim: string
    courseId: string; courseNama: string; persentaseHadir: number
  }[] = []
  for (const { mahasiswa, mata_kuliah_id } of enrollments) {
    const { total, hadir } = perStudentCourse.get(`${mahasiswa.id}:${mata_kuliah_id}`) ?? { total: 0, hadir: 0 }
    const persentaseHadir = total === 0 ? 0 : Math.round((hadir / total) * 100)
    if (persentaseHadir < MIN_ATTENDANCE_PERCENTAGE) {
      atRiskRows.push({
        studentId: mahasiswa.id, nama: mahasiswa.nama, nim: mahasiswa.nim,
        courseId: mata_kuliah_id, courseNama: courseById.get(mata_kuliah_id)?.nama ?? "-", persentaseHadir,
      })
    }
  }
  atRiskRows.sort((a, b) => a.persentaseHadir - b.persentaseHadir)

  return NextResponse.json({
    ok: true,
    data: {
      myCourses: myCourses.map(serializeMataKuliah),
      uniqueStudentCount,
      todayEntries,
      hadirHariIni,
      onlineDevices,
      totalDevices: devices.length,
      rateData,
      trendData,
      atRiskRows,
      hariIni,
    },
  })
}
