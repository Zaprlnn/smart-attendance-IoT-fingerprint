import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"
import { requireAuth } from "@/lib/server/auth"

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  const { sub, role } = auth

  if (role === "student") {
    const mhs = await prisma.mahasiswa.findUnique({ where: { id: sub } })
    if (!mhs) return NextResponse.json({ ok: false, error: "Tidak ditemukan" }, { status: 404 })
    return NextResponse.json({
      ok: true,
      role,
      user: {
        id: mhs.id, nim: mhs.nim, nama: mhs.nama, prodi: mhs.prodi,
        semester: mhs.semester, email: mhs.email, fingerprintEnrolled: mhs.fingerprint_enrolled,
      },
    })
  }

  const dosen = await prisma.dosen.findUnique({ where: { id: sub } })
  if (!dosen) return NextResponse.json({ ok: false, error: "Tidak ditemukan" }, { status: 404 })
  return NextResponse.json({ ok: true, role, user: { id: dosen.id, nip: dosen.nip, nama: dosen.nama, email: dosen.email } })
}
