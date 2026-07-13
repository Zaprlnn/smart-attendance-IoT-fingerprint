import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"

const JWT_SECRET = process.env.JWT_SECRET!

export type Role = "student" | "lecturer"

export interface TokenPayload {
  sub: string // mahasiswa.id atau dosen.id
  role: Role
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: TokenPayload
    }
  }
}

/** Middleware: wajib ada Bearer token valid. Opsional batasi ke role tertentu. */
export function requireAuth(role?: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null
    if (!token) {
      return res.status(401).json({ ok: false, error: "Token tidak ditemukan" })
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as TokenPayload
      if (role && payload.role !== role) {
        return res.status(403).json({ ok: false, error: "Tidak punya akses" })
      }
      req.auth = payload
      next()
    } catch {
      return res.status(401).json({ ok: false, error: "Token tidak valid/kedaluwarsa" })
    }
  }
}

/** Middleware: verifikasi header x-device-key (dipakai ESP32, bukan JWT). */
export function requireDeviceKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-device-key"]
  if (!key || key !== process.env.DEVICE_KEY) {
    return res.status(401).json({ ok: false, error: "Unauthorized" })
  }
  next()
}
