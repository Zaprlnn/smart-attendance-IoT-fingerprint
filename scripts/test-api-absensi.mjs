/**
 * scripts/test-api-absensi.mjs
 * Kirim POST dummy ke /api/absensi untuk verifikasi endpoint berjalan.
 * Jalankan: node scripts/test-api-absensi.mjs
 */

const BASE_URL = "http://localhost:3000"
const DEVICE_KEY = process.env.DEVICE_KEY;

async function test(label, payload, expectStatus) {
  const res = await fetch(`${BASE_URL}/api/absensi`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-device-key": DEVICE_KEY,
    },
    body: JSON.stringify(payload),
  })
  const body = await res.json()
  const ok = res.status === expectStatus
  console.log(`${ok ? "✅" : "❌"} [${res.status}] ${label}`)
  if (!ok || body.ok === false) console.log("   Response:", JSON.stringify(body))
  return ok
}

console.log("\n🧪 Test API /api/absensi\n")

// 1. Health check GET
const ping = await fetch(`${BASE_URL}/api/absensi`)
console.log(`✅ [GET] Health check: ${(await ping.json()).message}\n`)

// 2. POST valid → harus 200
await test("POST valid (id_jari=3, nama=Yuda)", { id_jari: 3, nama: "Yuda", status: "hadir" }, 200)

// 3. POST tanpa device key → harus 401
const r401 = await fetch(`${BASE_URL}/api/absensi`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id_jari: 1, nama: "Test" }),
})
console.log(`${r401.status === 401 ? "✅" : "❌"} [${r401.status}] POST tanpa x-device-key → 401`)

// 4. POST id_jari bukan integer → harus 400
await test("POST id_jari string", { id_jari: "abc", nama: "Test" }, 400)

// 5. POST nama kosong → harus 400
await test("POST nama kosong", { id_jari: 2, nama: "" }, 400)

console.log("\nDone.\n")
