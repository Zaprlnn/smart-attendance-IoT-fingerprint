import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/server/prisma"
import { signToken } from "@/lib/server/auth"

export async function POST(request: NextRequest) {
  const { role, identifier, password } = (await request.json().catch(() => null)) ?? {}
  if (!role || !identifier || !password) {
    return NextResponse.json({ ok: false, error: "role, identifier, dan password wajib diisi" }, { status: 400 })
  }

  if (role === "student") {
    const mhs = await prisma.mahasiswa.findUnique({ where: { nim: String(identifier) } })
    if (!mhs?.password_hash || !(await bcrypt.compare(password, mhs.password_hash))) {
      return NextResponse.json({ ok: false, error: "NIM atau password salah" }, { status: 401 })
    }
    const token = signToken({ sub: mhs.id, role: "student" })
    return NextResponse.json({
      ok: true,
      token,
      role: "student",
      user: {
        id: mhs.id, nim: mhs.nim, nama: mhs.nama, prodi: mhs.prodi,
        semester: mhs.semester, email: mhs.email, fingerprintEnrolled: mhs.fingerprint_enrolled,
      },
    })
  }

  if (role === "lecturer") {
    const dosen = await prisma.dosen.findUnique({ where: { nip: String(identifier) } })
    if (!dosen?.password_hash || !(await bcrypt.compare(password, dosen.password_hash))) {
      return NextResponse.json({ ok: false, error: "NIP atau password salah" }, { status: 401 })
    }
    const token = signToken({ sub: dosen.id, role: "lecturer" })
    return NextResponse.json({
      ok: true,
      token,
      role: "lecturer",
      user: { id: dosen.id, nip: dosen.nip, nama: dosen.nama, email: dosen.email },
    })
  }

  return NextResponse.json({ ok: false, error: "role tidak valid" }, { status: 400 })
}
