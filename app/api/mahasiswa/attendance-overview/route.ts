import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"

// GET /api/mahasiswa/attendance-overview — % kehadiran keseluruhan per mahasiswa (semua matkul
// digabung), dipakai kolom "% Kehadiran" di tabel daftar mahasiswa. [dosen]
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "lecturer")
  if (auth instanceof NextResponse) return auth

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
  return NextResponse.json({ ok: true, data })
}
