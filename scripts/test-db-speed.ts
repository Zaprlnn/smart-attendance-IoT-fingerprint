import "dotenv/config"
import { prisma } from "../lib/server/prisma"

async function main() {
  for (let i = 1; i <= 5; i++) {
    const t0 = Date.now()
    await prisma.mahasiswa.findFirst({ where: { id_jari: 1 } })
    console.log(`Query #${i}: ${Date.now() - t0}ms`)
  }
  await prisma.$disconnect()
}

main()
