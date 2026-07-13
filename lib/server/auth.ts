import jwt from "jsonwebtoken"
import { NextResponse, type NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET!

export type Role = "student" | "lecturer"

export interface TokenPayload {
  sub: string // mahasiswa.id atau dosen.id
  role: Role
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

/** Wajib ada Bearer token valid. Opsional batasi ke role tertentu. Panggil di awal tiap route handler:
 *  `const auth = requireAuth(request); if (auth instanceof NextResponse) return auth` */
export function requireAuth(request: NextRequest, role?: Role): TokenPayload | NextResponse {
  const header = request.headers.get("authorization")
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) {
    return NextResponse.json({ ok: false, error: "Token tidak ditemukan" }, { status: 401 })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload
    if (role && payload.role !== role) {
      return NextResponse.json({ ok: false, error: "Tidak punya akses" }, { status: 403 })
    }
    return payload
  } catch {
    return NextResponse.json({ ok: false, error: "Token tidak valid/kedaluwarsa" }, { status: 401 })
  }
}

/** Verifikasi header x-device-key (dipakai ESP32, bukan JWT). */
export function hasValidDeviceKey(request: NextRequest): boolean {
  const key = request.headers.get("x-device-key")
  return !!key && key === process.env.DEVICE_KEY
}
