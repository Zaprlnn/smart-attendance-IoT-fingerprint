/**
 * scripts/check-absensi.mjs
 * Cek (dan buat jika perlu) tabel "absensi" via Supabase REST API.
 * Tidak butuh WebSocket – kompatibel dengan Node.js 20.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  apikey: SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ── Helper: cek tabel via information_schema ───────────────────────────────
async function getColumns() {
  const url =
    `${SUPABASE_URL}/rest/v1/information_schema.columns` +
    `?table_schema=eq.public&table_name=eq.absensi` +
    `&select=column_name,data_type,ordinal_position` +
    `&order=ordinal_position`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    return { ok: false, error: await res.text() };
  }
  const data = await res.json();
  return { ok: true, data };
}

// ── Helper: cek tabel langsung (apakah bisa di-query) ─────────────────────
async function tableExists() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/absensi?limit=0`,
    { headers }
  );
  // 200 = ada, 404 = tidak ada, 42P01 = relation does not exist
  const text = await res.text();
  if (res.status === 404 || text.includes("does not exist") || text.includes("42P01")) {
    return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
console.log("\n🔍 Mengecek tabel 'absensi' di Supabase...\n");

const exists = await tableExists();
console.log(exists ? "✅ Tabel 'absensi' SUDAH ADA." : "❌ Tabel 'absensi' BELUM ADA.\n");

if (exists) {
  // Cek kolom
  const { ok, data: cols, error } = await getColumns();
  if (!ok) {
    console.log("⚠️  Tidak bisa cek kolom via information_schema:", error);
    console.log("   (Pastikan secret key memiliki akses ke information_schema)\n");
    process.exit(0);
  }

  console.log("Kolom yang ada sekarang:");
  console.table(
    cols.map((c) => ({ kolom: c.column_name, tipe: c.data_type }))
  );

  // Kolom yang diharapkan
  const expected = {
    id_jari: "integer",
    nama: "text",
    status: "text",
    waktu: "timestamp with time zone",
  };

  const actual = Object.fromEntries(cols.map((c) => [c.column_name, c.data_type]));
  let missing = [];
  let allOk = true;

  for (const [col, tipe] of Object.entries(expected)) {
    if (!actual[col]) {
      console.log(`❌ Kolom '${col}' (${tipe}) TIDAK ADA.`);
      missing.push({ col, tipe });
      allOk = false;
    } else if (actual[col] !== tipe) {
      console.log(`⚠️  Kolom '${col}' tipenya '${actual[col]}' (diharapkan '${tipe}').`);
      allOk = false;
    } else {
      console.log(`✅ Kolom '${col}' OK.`);
    }
  }

  if (allOk) {
    console.log("\n🎉 Struktur tabel sudah sesuai! Tidak perlu diubah.\n");
  } else if (missing.length > 0) {
    console.log("\n⚙️  Ada kolom yang kurang. Hasil ini sudah cukup untuk laporan manual.\n");
  }
} else {
  console.log("Tabel tidak ditemukan. Harap buat via SQL Editor di Supabase Dashboard:\n");
  console.log(`
-- Jalankan SQL ini di: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
CREATE TABLE IF NOT EXISTS public.absensi (
  id_jari  INTEGER              NOT NULL,
  nama     TEXT                 NOT NULL,
  status   TEXT                 NOT NULL DEFAULT 'hadir',
  waktu    TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;
`);
}

console.log("Done.\n");
