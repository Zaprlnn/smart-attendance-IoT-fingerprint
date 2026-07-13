import { Router } from "express"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../lib/auth.js"
import { serializeMahasiswa, serializeMataKuliah } from "../lib/serializers.js"
import { dayNameOf, derivePresensiStatus, deriveSesiStatus, toJakartaIsoDate } from "../lib/sesi-status.js"

export const mahasiswaRouter = Router()

const MIN_ATTENDANCE_PERCENTAGE = 75

function canAccessStudent(auth: { sub: string; role: string }, studentId: string) {
  return auth.role === "lecturer" || auth.sub === studentId
}

// Satu query utk semua mata kuliah sekaligus (groupBy), bukan 1 query per mata kuliah —
// N+1 round-trip ke pooler Supabase adalah sumber utama loading lambat sebelumnya.
async function computeSummaries(mahasiswaId: string, enrollments: { mata_kuliah: { id: string; kode: string; nama: string } }[]) {
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

// GET /mahasiswa — daftar semua mahasiswa [dosen]
mahasiswaRouter.get("/", requireAuth("lecturer"), async (_req, res) => {
  const rows = await prisma.mahasiswa.findMany({ orderBy: { nama: "asc" } })
  res.json({ ok: true, data: rows.map(serializeMahasiswa) })
})

// POST /mahasiswa — daftarkan mahasiswa baru + antre command enroll ke ESP32 [dosen]
mahasiswaRouter.post("/", requireAuth("lecturer"), async (req, res) => {
  const { nama, nim, prodi, semester, email } = req.body ?? {}
  if (!nama || !nim || !prodi || !semester || !email) {
    return res.status(400).json({ ok: false, error: "nama, nim, prodi, semester, email wajib diisi" })
  }

  const password_hash = await bcrypt.hash(String(nama).toLowerCase().replace(/\s+/g, ""), 10)
  let mhs
  try {
    mhs = await prisma.mahasiswa.create({
      data: { nama, nim, prodi, semester: Number(semester), email, password_hash, fingerprint_enrolled: false },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ ok: false, error: "NIM atau email sudah terdaftar" })
    }
    throw err
  }

  const deviceId = process.env.DEVICE_KEY!
  const idJari = Math.floor(Math.random() * 127) + 1
  const cmd = await prisma.device_commands.create({
    data: {
      device_id: deviceId,
      command: "enroll",
      payload: { id_jari: idJari, mahasiswa_id: mhs.id },
      status: "pending",
    },
  })

  res.json({ ok: true, data: serializeMahasiswa(mhs), commandId: cmd.id })
})

// GET /mahasiswa/attendance-overview — % kehadiran keseluruhan per mahasiswa (semua matkul
// digabung), dipakai kolom "% Kehadiran" di tabel daftar mahasiswa. [dosen]
// NB: harus terdaftar sebelum "/:id" supaya tidak ketangkep sebagai :id.
mahasiswaRouter.get("/attendance-overview", requireAuth("lecturer"), async (_req, res) => {
  const rows = await prisma.presensi.groupBy({
    by: ["mahasiswa_id", "status"],
    _count: true,
  })
  const byId = new Map<string, { total: number; hadir: number }>()
  for (const r of rows) {
    const entry = byId.get(r.mahasiswa_id) ?? { total: 0, hadir: 0 }
    entry.total += r._count
    if (r.status === "hadir") entry.hadir += r._count
    byId.set(r.mahasiswa_id, entry)
  }
  const data = Object.fromEntries(
    [...byId.entries()].map(([mahasiswaId, { total, hadir }]) => [
      mahasiswaId,
      { totalSessions: total, hadir, persentaseHadir: total === 0 ? null : Math.round((hadir / total) * 100) },
    ])
  )
  res.json({ ok: true, data })
})

// POST /mahasiswa/:id/enroll — antre command enroll fingerprint utk mahasiswa yg SUDAH
// terdaftar tapi belum enroll sidik jari (beda dari POST / yang sekaligus membuat mahasiswa
// baru). [dosen]
mahasiswaRouter.post("/:id/enroll", requireAuth("lecturer"), async (req, res) => {
  const mhs = await prisma.mahasiswa.findUnique({ where: { id: req.params.id } })
  if (!mhs) return res.status(404).json({ ok: false, error: "Mahasiswa tidak ditemukan" })

  const deviceId = process.env.DEVICE_KEY!
  const idJari = Math.floor(Math.random() * 127) + 1
  const cmd = await prisma.device_commands.create({
    data: {
      device_id: deviceId,
      command: "enroll",
      payload: { id_jari: idJari, mahasiswa_id: mhs.id },
      status: "pending",
    },
  })
  res.json({ ok: true, commandId: cmd.id })
})

mahasiswaRouter.get("/:id", requireAuth(), async (req, res) => {
  if (!canAccessStudent(req.auth!, req.params.id)) {
    return res.status(403).json({ ok: false, error: "Tidak punya akses" })
  }
  const mhs = await prisma.mahasiswa.findUnique({ where: { id: req.params.id } })
  if (!mhs) return res.status(404).json({ ok: false, error: "Mahasiswa tidak ditemukan" })
  res.json({ ok: true, data: serializeMahasiswa(mhs) })
})

// GET /mahasiswa/:id/presensi-summary — rekap per mata kuliah (hadir/izin/sakit/alpha/%) — port getAttendanceSummary
mahasiswaRouter.get("/:id/presensi-summary", requireAuth(), async (req, res) => {
  if (!canAccessStudent(req.auth!, req.params.id)) {
    return res.status(403).json({ ok: false, error: "Tidak punya akses" })
  }
  const mahasiswaId = req.params.id
  const enrollments = await prisma.enrollment.findMany({
    where: { mahasiswa_id: mahasiswaId },
    include: { mata_kuliah: true },
  })
  const data = await computeSummaries(mahasiswaId, enrollments)
  res.json({ ok: true, data })
})

// GET /mahasiswa/:id/presensi — riwayat presensi mentah, terbaru dulu — port attendanceRecords (per student)
mahasiswaRouter.get("/:id/presensi", requireAuth(), async (req, res) => {
  if (!canAccessStudent(req.auth!, req.params.id)) {
    return res.status(403).json({ ok: false, error: "Tidak punya akses" })
  }
  const rows = await prisma.presensi.findMany({
    where: { mahasiswa_id: req.params.id },
    include: { mata_kuliah: true, sesi: true },
    orderBy: { timestamp: "desc" },
  })
  res.json({
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
})

// GET /mahasiswa/:id/dashboard — ringkasan utk halaman dashboard mahasiswa: summary per
// mata kuliah, jadwal+status hari ini, dan 5 aktivitas presensi terakhir.
mahasiswaRouter.get("/:id/dashboard", requireAuth(), async (req, res) => {
  if (!canAccessStudent(req.auth!, req.params.id)) {
    return res.status(403).json({ ok: false, error: "Tidak punya akses" })
  }
  const mahasiswaId = req.params.id
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
      : Promise.resolve([[], []]),
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

  res.json({
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
})
