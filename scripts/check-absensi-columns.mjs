/**
 * scripts/check-absensi-columns.mjs
 * Cek kolom tabel 'absensi' via query HEAD + kolom dummy.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  apikey: SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

// Ambil 1 baris untuk lihat kolom apa yang ada
const res = await fetch(`${SUPABASE_URL}/rest/v1/absensi?limit=1`, { headers });
const text = await res.text();
console.log("Status:", res.status);
console.log("Response:", text);

// Coba kolom-kolom satu per satu
const colsToCheck = ["id_jari", "nama", "status", "waktu", "id", "created_at", "fingerprint_id", "timestamp"];
console.log("\n🔍 Mencoba select kolom satu per satu...\n");

for (const col of colsToCheck) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/absensi?select=${col}&limit=1`, { headers });
  const t = await r.text();
  if (r.ok) {
    console.log(`✅ Kolom '${col}' ADA. Sample: ${t}`);
  } else if (t.includes("does not exist") || t.includes("column") || t.includes("42703")) {
    console.log(`❌ Kolom '${col}' TIDAK ADA.`);
  } else {
    console.log(`⚠️  '${col}': status=${r.status} – ${t}`);
  }
}
