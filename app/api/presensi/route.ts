import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"

// GET /api/presensi?mataKuliahId=&sesiId= — semua mahasiswa enrolled + record (kalau ada) untuk 1 sesi. [dosen]
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "lecturer")
  if (auth instanceof NextResponse) return auth

  const mataKuliahId = request.nextUrl.searchParams.get("mataKuliahId")
  const sesiId = request.nextUrl.searchParams.get("sesiId")
  if (!mataKuliahId || !sesiId) {
    return NextResponse.json({ ok: false, error: "mataKuliahId dan sesiId wajib diisi" }, { status: 400 })
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { mata_kuliah_id: mataKuliahId },
    include: { mahasiswa: true },
  })
  const records = await prisma.presensi.findMany({ where: { mata_kuliah_id: mataKuliahId, sesi_id: sesiId } })
  const recordByMahasiswaId = new Map(records.map((r) => [r.mahasiswa_id, r]))

  return NextResponse.json({
    ok: true,
    data: enrollments.map(({ mahasiswa }) => ({
      mahasiswa: { id: mahasiswa.id, nim: mahasiswa.nim, nama: mahasiswa.nama },
      record: recordByMahasiswaId.get(mahasiswa.id) ?? null,
    })),
  })
}

// POST /api/presensi — dosen tandai manual (izin/sakit/alpha/hadir) utk 1 mahasiswa+sesi. [dosen]
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "lecturer")
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => null)
  const { mahasiswaId, mataKuliahId, sesiId, status } = body ?? {}
  if (!mahasiswaId || !mataKuliahId || !sesiId || !status) {
    return NextResponse.json({ ok: false, error: "mahasiswaId, mataKuliahId, sesiId, status wajib diisi" }, { status: 400 })
  }
  if (!["hadir", "izin", "sakit", "alpha"].includes(status)) {
    return NextResponse.json({ ok: false, error: "status tidak valid" }, { status: 400 })
  }

  const row = await prisma.presensi.upsert({
    where: { mahasiswa_id_sesi_id: { mahasiswa_id: mahasiswaId, sesi_id: sesiId } },
    update: { status, method: "manual" },
    create: {
      mahasiswa_id: mahasiswaId, mata_kuliah_id: mataKuliahId, sesi_id: sesiId,
      status, method: "manual",
    },
  })

  return NextResponse.json({ ok: true, data: row })
}
