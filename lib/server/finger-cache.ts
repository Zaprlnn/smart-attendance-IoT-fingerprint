import { prisma } from "@/lib/server/prisma"

// Cache in-memory id_jari -> {mahasiswaId, nama}, biar respons ke ESP32 gak
// perlu nunggu round-trip ke Supabase (jaringan lambat, ~1-1.2s/query). Data
// mahasiswa cuma berubah pas enroll (jarang), jadi cache ini di-refresh di
// tempat itu aja, bukan tiap request. Dimuat sekali saat boot lewat instrumentation.ts.
const fingerCache = new Map<number, { mahasiswaId: string; nama: string; nim: string }>()

export async function loadFingerCache() {
  const rows = await prisma.mahasiswa.findMany({
    where: { id_jari: { not: null } },
    select: { id: true, id_jari: true, nama: true, nim: true },
  })
  fingerCache.clear()
  for (const r of rows) {
    if (r.id_jari != null) fingerCache.set(r.id_jari, { mahasiswaId: r.id, nama: r.nama, nim: r.nim })
  }
  console.log(`[fingerCache] dimuat ${fingerCache.size} mahasiswa`)
}

export function getFingerCacheEntry(idJari: number) {
  return fingerCache.get(idJari)
}

export function setFingerCacheEntry(idJari: number, entry: { mahasiswaId: string; nama: string; nim: string }) {
  fingerCache.set(idJari, entry)
}

// AS608 nyimpen sidik jari per slot ID (1-127) -- kalau 2 mahasiswa kepilih id_jari
// yang sama, template lama ketiban yang baru dan nama di cache ikut ketuker.
// Cari angka yang belum dipakai siapapun (bukan asal random tanpa cek).
export function pickUnusedIdJari(): number {
  for (let attempt = 0; attempt < 127; attempt++) {
    const candidate = Math.floor(Math.random() * 127) + 1
    if (!fingerCache.has(candidate)) return candidate
  }
  throw new Error("Semua slot id_jari (1-127) sudah terpakai")
}
