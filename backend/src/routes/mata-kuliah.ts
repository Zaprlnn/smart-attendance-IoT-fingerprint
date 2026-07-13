import { Router } from "express"
import { prisma } from "../lib/prisma.js"
import { requireAuth } from "../lib/auth.js"
import { derivePresensiStatus, deriveSesiStatus, toJakartaIsoDate } from "../lib/sesi-status.js"
import { serializeMataKuliah, serializeMahasiswa } from "../lib/serializers.js"

export const mataKuliahRouter = Router()

const MIN_ATTENDANCE_PERCENTAGE = 75

function serializeSesiHariIni(sesi: {
  id: string; pertemuan_ke: number; topik: string
  presensi_mulai: Date | null; presensi_selesai: Date | null
}) {
  return {
    sesiId: sesi.id,
    pertemuanKe: sesi.pertemuan_ke,
    topik: sesi.topik,
    presensiMulai: sesi.presensi_mulai,
    presensiSelesai: sesi.presensi_selesai,
    status: derivePresensiStatus(sesi.presensi_mulai, sesi.presensi_selesai),
  }
}

// GET /mata-kuliah?dosenId=xxx  — semua mata kuliah, atau milik satu dosen
mataKuliahRouter.get("/", requireAuth(), async (req, res) => {
  const dosenId = typeof req.query.dosenId === "string" ? req.query.dosenId : undefined
  const rows = await prisma.mata_kuliah.findMany({
    where: dosenId ? { dosen_id: dosenId } : undefined,
    include: { dosen: { select: { nama: true } }, _count: { select: { enrollments: true } } },
    orderBy: { kode: "asc" },
  })
  res.json({ ok: true, data: rows.map(serializeMataKuliah) })
})

mataKuliahRouter.get("/:id", requireAuth(), async (req, res) => {
  const mk = await prisma.mata_kuliah.findUnique({
    where: { id: req.params.id },
    include: { dosen: { select: { nama: true } }, _count: { select: { enrollments: true } } },
  })
  if (!mk) return res.status(404).json({ ok: false, error: "Mata kuliah tidak ditemukan" })
  res.json({ ok: true, data: serializeMataKuliah(mk) })
})

// GET /mata-kuliah/:id/sesi — semua pertemuan, status dihitung saat request
mataKuliahRouter.get("/:id/sesi", requireAuth(), async (req, res) => {
  const now = new Date()
  const [rows, mk] = await Promise.all([
    prisma.sesi.findMany({ where: { mata_kuliah_id: req.params.id }, orderBy: { pertemuan_ke: "asc" } }),
    prisma.mata_kuliah.findUnique({ where: { id: req.params.id } }),
  ])
  if (!mk) return res.status(404).json({ ok: false, error: "Mata kuliah tidak ditemukan" })

  const data = rows.map((s) => {
    const tanggalIso = toJakartaIsoDate(s.tanggal)
    return {
      id: s.id,
      courseId: mk.id,
      pertemuanKe: s.pertemuan_ke,
      tanggal: tanggalIso,
      topik: s.topik,
      status: deriveSesiStatus(tanggalIso, mk.jam_mulai, mk.jam_selesai, now),
    }
  })
  res.json({ ok: true, data })
})

// GET /mata-kuliah/:id/sesi/hari-ini — sesi hari ini utk course ini (null kalau belum ada). [auth apa saja]
mataKuliahRouter.get("/:id/sesi/hari-ini", requireAuth(), async (req, res) => {
  const tanggalIso = toJakartaIsoDate(new Date())
  const sesi = await prisma.sesi.findFirst({
    where: { mata_kuliah_id: req.params.id, tanggal: new Date(`${tanggalIso}T00:00:00.000Z`) },
  })
  res.json({ ok: true, data: sesi ? serializeSesiHariIni(sesi) : null })
})

// POST /mata-kuliah/:id/sesi/hari-ini/buka — dosen buka presensi mandiri utk pertemuan hari ini. [dosen, pemilik]
mataKuliahRouter.post("/:id/sesi/hari-ini/buka", requireAuth("lecturer"), async (req, res) => {
  const mataKuliahId = req.params.id
  const mk = await prisma.mata_kuliah.findUnique({ where: { id: mataKuliahId } })
  if (!mk) return res.status(404).json({ ok: false, error: "Mata kuliah tidak ditemukan" })
  if (mk.dosen_id !== req.auth!.sub) {
    return res.status(403).json({ ok: false, error: "Bukan mata kuliah yang kamu ampu" })
  }

  const durasiMenit = Number(req.body?.durasiMenit)
  if (!Number.isFinite(durasiMenit) || durasiMenit <= 0) {
    return res.status(400).json({ ok: false, error: "durasiMenit harus angka positif" })
  }
  const topikBaru = typeof req.body?.topik === "string" && req.body.topik.trim() ? req.body.topik.trim() : undefined

  const now = new Date()
  const tanggalIso = toJakartaIsoDate(now)
  const presensiSelesai = new Date(now.getTime() + durasiMenit * 60_000)

  let sesi = await prisma.sesi.findFirst({
    where: { mata_kuliah_id: mataKuliahId, tanggal: new Date(`${tanggalIso}T00:00:00.000Z`) },
  })

  if (sesi) {
    sesi = await prisma.sesi.update({
      where: { id: sesi.id },
      data: { presensi_mulai: now, presensi_selesai: presensiSelesai, ...(topikBaru ? { topik: topikBaru } : {}) },
    })
  } else {
    const last = await prisma.sesi.findFirst({
      where: { mata_kuliah_id: mataKuliahId },
      orderBy: { pertemuan_ke: "desc" },
    })
    const pertemuanKe = (last?.pertemuan_ke ?? 0) + 1
    sesi = await prisma.sesi.create({
      data: {
        mata_kuliah_id: mataKuliahId,
        pertemuan_ke: pertemuanKe,
        tanggal: new Date(`${tanggalIso}T00:00:00.000Z`),
        topik: topikBaru ?? `Pertemuan ke-${pertemuanKe}`,
        presensi_mulai: now,
        presensi_selesai: presensiSelesai,
      },
    })
  }

  res.json({ ok: true, data: serializeSesiHariIni(sesi) })
})

// POST /mata-kuliah/:id/sesi/hari-ini/tutup — dosen tutup presensi lebih awal. [dosen, pemilik]
mataKuliahRouter.post("/:id/sesi/hari-ini/tutup", requireAuth("lecturer"), async (req, res) => {
  const mataKuliahId = req.params.id
  const mk = await prisma.mata_kuliah.findUnique({ where: { id: mataKuliahId } })
  if (!mk) return res.status(404).json({ ok: false, error: "Mata kuliah tidak ditemukan" })
  if (mk.dosen_id !== req.auth!.sub) {
    return res.status(403).json({ ok: false, error: "Bukan mata kuliah yang kamu ampu" })
  }

  const tanggalIso = toJakartaIsoDate(new Date())
  const sesi = await prisma.sesi.findFirst({
    where: { mata_kuliah_id: mataKuliahId, tanggal: new Date(`${tanggalIso}T00:00:00.000Z`) },
  })
  if (!sesi || !sesi.presensi_mulai) {
    return res.status(400).json({ ok: false, error: "Presensi belum pernah dibuka hari ini" })
  }

  const updated = await prisma.sesi.update({ where: { id: sesi.id }, data: { presensi_selesai: new Date() } })
  res.json({ ok: true, data: serializeSesiHariIni(updated) })
})

// POST /mata-kuliah/:id/enroll-diri — mahasiswa daftar sendiri ke mata kuliah. [mahasiswa]
mataKuliahRouter.post("/:id/enroll-diri", requireAuth("student"), async (req, res) => {
  const mataKuliahId = req.params.id
  const mk = await prisma.mata_kuliah.findUnique({ where: { id: mataKuliahId } })
  if (!mk) return res.status(404).json({ ok: false, error: "Mata kuliah tidak ditemukan" })

  await prisma.enrollment.upsert({
    where: { mahasiswa_id_mata_kuliah_id: { mahasiswa_id: req.auth!.sub, mata_kuliah_id: mataKuliahId } },
    update: {},
    create: { mahasiswa_id: req.auth!.sub, mata_kuliah_id: mataKuliahId },
  })

  res.json({ ok: true })
})

// GET /mata-kuliah/:id/roster — mahasiswa yg enroll + rekap kehadiran mereka di matkul ini. [dosen]
mataKuliahRouter.get("/:id/roster", requireAuth("lecturer"), async (req, res) => {
  const mataKuliahId = req.params.id
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
  res.json({ ok: true, data })
})

// GET /mata-kuliah/hari-ini — mata kuliah dg sesi HARI INI utk dosen yg login (atau semua kalau student)
mataKuliahRouter.get("/hari-ini/list", requireAuth(), async (req, res) => {
  const now = new Date()
  const tanggalIso = toJakartaIsoDate(now)
  const sesiHariIni = await prisma.sesi.findMany({
    where: { tanggal: new Date(`${tanggalIso}T00:00:00.000Z`) },
    include: {
      mata_kuliah: { include: { dosen: { select: { nama: true } }, _count: { select: { enrollments: true } } } },
    },
  })

  const filtered =
    req.auth!.role === "lecturer"
      ? sesiHariIni.filter((s) => s.mata_kuliah.dosen_id === req.auth!.sub)
      : sesiHariIni

  res.json({
    ok: true,
    data: filtered.map((s) => ({
      sesiId: s.id,
      pertemuanKe: s.pertemuan_ke,
      topik: s.topik,
      status: deriveSesiStatus(tanggalIso, s.mata_kuliah.jam_mulai, s.mata_kuliah.jam_selesai, now),
      mataKuliah: serializeMataKuliah(s.mata_kuliah),
    })),
  })
})
