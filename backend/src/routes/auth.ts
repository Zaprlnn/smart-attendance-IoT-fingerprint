import { Router } from "express"
import bcrypt from "bcryptjs"
import { prisma } from "../lib/prisma.js"
import { signToken, requireAuth } from "../lib/auth.js"

export const authRouter = Router()

authRouter.post("/login", async (req, res) => {
  const { role, identifier, password } = req.body ?? {}
  if (!role || !identifier || !password) {
    return res.status(400).json({ ok: false, error: "role, identifier, dan password wajib diisi" })
  }

  if (role === "student") {
    const mhs = await prisma.mahasiswa.findUnique({ where: { nim: String(identifier) } })
    if (!mhs?.password_hash || !(await bcrypt.compare(password, mhs.password_hash))) {
      return res.status(401).json({ ok: false, error: "NIM atau password salah" })
    }
    const token = signToken({ sub: mhs.id, role: "student" })
    return res.json({
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
      return res.status(401).json({ ok: false, error: "NIP atau password salah" })
    }
    const token = signToken({ sub: dosen.id, role: "lecturer" })
    return res.json({
      ok: true,
      token,
      role: "lecturer",
      user: { id: dosen.id, nip: dosen.nip, nama: dosen.nama, email: dosen.email },
    })
  }

  return res.status(400).json({ ok: false, error: "role tidak valid" })
})

authRouter.get("/me", requireAuth(), async (req, res) => {
  const { sub, role } = req.auth!
  if (role === "student") {
    const mhs = await prisma.mahasiswa.findUnique({ where: { id: sub } })
    if (!mhs) return res.status(404).json({ ok: false, error: "Tidak ditemukan" })
    return res.json({
      ok: true,
      role,
      user: {
        id: mhs.id, nim: mhs.nim, nama: mhs.nama, prodi: mhs.prodi,
        semester: mhs.semester, email: mhs.email, fingerprintEnrolled: mhs.fingerprint_enrolled,
      },
    })
  }
  const dosen = await prisma.dosen.findUnique({ where: { id: sub } })
  if (!dosen) return res.status(404).json({ ok: false, error: "Tidak ditemukan" })
  return res.json({ ok: true, role, user: { id: dosen.id, nip: dosen.nip, nama: dosen.nama, email: dosen.email } })
})
