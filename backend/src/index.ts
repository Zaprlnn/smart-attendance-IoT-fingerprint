import "dotenv/config"
import dns from "node:dns"
import express from "express"
import cors from "cors"

// Supabase pooler kadang resolve ke IPv6 dulu lalu timeout sebelum fallback ke
// IPv4, nambah ~1-2s di TIAP koneksi baru ke DB (lebih kerasa di Windows).
dns.setDefaultResultOrder("ipv4first")

// Express 4 gak nangkep rejection dari async route handler otomatis -- kalau
// gak ditangani di sini, 1 error di route manapun (mis. unique constraint
// Prisma) bikin SELURUH proses Node mati, matiin server buat semua orang
// (termasuk ESP32 yang lagi jalan). Ini jaring pengaman terakhir; route yang
// errornya diketahui tetap sebaiknya tangkep sendiri & balas response yang jelas.
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection] Route error tertangkap, server tetap jalan:", reason)
})

import { authRouter } from "./routes/auth.js"
import { deviceRouter, loadFingerCache } from "./routes/device.js"
import { mataKuliahRouter } from "./routes/mata-kuliah.js"
import { mahasiswaRouter } from "./routes/mahasiswa.js"
import { dosenRouter } from "./routes/dosen.js"
import { presensiRouter } from "./routes/presensi.js"

const app = express()

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000" }))
app.use(express.json())

app.get("/health", (_req, res) => res.json({ ok: true }))

app.use("/auth", authRouter)
app.use("/device", deviceRouter)
app.use("/mata-kuliah", mataKuliahRouter)
app.use("/mahasiswa", mahasiswaRouter)
app.use("/dosen", dosenRouter)
app.use("/presensi", presensiRouter)

const port = Number(process.env.PORT ?? 4000)
loadFingerCache().finally(() => {
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`)
  })
})
