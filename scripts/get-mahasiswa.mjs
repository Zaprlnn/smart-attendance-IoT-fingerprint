const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getMahasiswa() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/mahasiswa?select=*`, {
    headers: {
      "apikey": SUPABASE_SECRET_KEY,
      "Authorization": `Bearer ${SUPABASE_SECRET_KEY}`
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

getMahasiswa().catch(console.error);
