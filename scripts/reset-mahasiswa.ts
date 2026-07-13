import "dotenv/config"
import { prisma } from "../lib/server/prisma"

// Hapus semua data mahasiswa + apapun yang mereferensikannya (urutan penting
// krn FK di DB pakai ON DELETE RESTRICT, bukan CASCADE). Tidak menyentuh
// dosen/mata_kuliah/sesi/device -- itu bukan "data mahasiswa".
async function main() {
  const presensi = await prisma.presensi.deleteMany({})
  const enrollment = await prisma.enrollment.deleteMany({})
  const absensi = await prisma.absensi.deleteMany({})
  const commands = await prisma.device_commands.deleteMany({})
  const mahasiswa = await prisma.mahasiswa.deleteMany({})

  console.log(
    `Reset selesai — mahasiswa: ${mahasiswa.count}, presensi: ${presensi.count}, ` +
      `enrollment: ${enrollment.count}, absensi (log fingerprint): ${absensi.count}, ` +
      `device_commands: ${commands.count}`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
