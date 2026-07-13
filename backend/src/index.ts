import "dotenv/config"
import express from "express"
import cors from "cors"

import { authRouter } from "./routes/auth.js"
import { deviceRouter } from "./routes/device.js"
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
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
