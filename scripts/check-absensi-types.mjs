/**
 * scripts/check-absensi-types.mjs
 * Cek tipe data kolom dengan insert dummy lalu rollback via error.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  apikey: SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
  Accept: "application/json",
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// Coba select semua kolom, kirim value salah tipe untuk lihat error
const tests = [
  { col: "id_jari",   val: "bukan_angka",  expect: "integer" },
  { col: "nama",      val: 123,             expect: "text" },
  { col: "status",    val: 123,             expect: "text" },
  { col: "waktu",     val: "bukan_waktu",   expect: "timestamptz" },
];

console.log("\n🔍 Cek tipe data via insert uji (dummy)...\n");

for (const t of tests) {
  const body = { [t.col]: t.val };
  const r = await fetch(`${SUPABASE_URL}/rest/v1/absensi`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const txt = await r.text();
  console.log(`Kolom '${t.col}' (expect: ${t.expect}) → status ${r.status}: ${txt.slice(0, 120)}`);
}

// Ambil 1 baris nyata kalau ada
console.log("\n📋 Isi tabel (1 baris pertama):");
const r2 = await fetch(`${SUPABASE_URL}/rest/v1/absensi?limit=1`, { headers });
console.log(await r2.text());
