import { Router } from "express"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../lib/auth.js"

export const presensiRouter = Router()

// GET /presensi?mataKuliahId=&sesiId= — semua mahasiswa enrolled + record (kalau ada) untuk 1 sesi.
// Port getCourseAttendanceForAllStudents. [dosen]
presensiRouter.get("/", requireAuth("lecturer"), async (req, res) => {
  const { mataKuliahId, sesiId } = req.query
  if (typeof mataKuliahId !== "string" || typeof sesiId !== "string") {
    return res.status(400).json({ ok: false, error: "mataKuliahId dan sesiId wajib diisi" })
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { mata_kuliah_id: mataKuliahId },
    include: { mahasiswa: true },
  })
  const records = await prisma.presensi.findMany({ where: { mata_kuliah_id: mataKuliahId, sesi_id: sesiId } })
  const recordByMahasiswaId = new Map(records.map((r) => [r.mahasiswa_id, r]))

  res.json({
    ok: true,
    data: enrollments.map(({ mahasiswa }) => ({
      mahasiswa: { id: mahasiswa.id, nim: mahasiswa.nim, nama: mahasiswa.nama },
      record: recordByMahasiswaId.get(mahasiswa.id) ?? null,
    })),
  })
})

// GET /presensi/rekap?mataKuliahId= — semua presensi utk mata kuliah milik dosen yg login
// (dipivot di frontend, seperti rekap page). Kalau mataKuliahId tidak diisi, semua matkul
// yg diampu dosen ini. [dosen]
presensiRouter.get("/rekap", requireAuth("lecturer"), async (req, res) => {
  const { mataKuliahId } = req.query
  const myCourseIds = (
    await prisma.mata_kuliah.findMany({ where: { dosen_id: req.auth!.sub }, select: { id: true } })
  ).map((c) => c.id)

  const scopedCourseIds =
    typeof mataKuliahId === "string" && myCourseIds.includes(mataKuliahId) ? [mataKuliahId] : myCourseIds

  const rows = await prisma.presensi.findMany({
    where: { mata_kuliah_id: { in: scopedCourseIds } },
    include: { mahasiswa: true, mata_kuliah: true, sesi: true },
    orderBy: { timestamp: "desc" },
  })
  res.json({
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
})

// POST /presensi — dosen tandai manual (izin/sakit/alpha/hadir) utk 1 mahasiswa+sesi. [dosen]
presensiRouter.post("/", requireAuth("lecturer"), async (req, res) => {
  const { mahasiswaId, mataKuliahId, sesiId, status } = req.body ?? {}
  if (!mahasiswaId || !mataKuliahId || !sesiId || !status) {
    return res.status(400).json({ ok: false, error: "mahasiswaId, mataKuliahId, sesiId, status wajib diisi" })
  }
  if (!["hadir", "izin", "sakit", "alpha"].includes(status)) {
    return res.status(400).json({ ok: false, error: "status tidak valid" })
  }

  const row = await prisma.presensi.upsert({
    where: { mahasiswa_id_sesi_id: { mahasiswa_id: mahasiswaId, sesi_id: sesiId } },
    update: { status, method: "manual" },
    create: {
      mahasiswa_id: mahasiswaId, mata_kuliah_id: mataKuliahId, sesi_id: sesiId,
      status, method: "manual",
    },
  })

  res.json({ ok: true, data: row })
})
