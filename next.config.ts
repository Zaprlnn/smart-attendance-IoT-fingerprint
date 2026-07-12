import type { NextConfig } from "next";

// Suppress Node.js version warnings dari @supabase/* packages.
// Proyek ini menggunakan Node.js 20 yang masih berfungsi penuh,
// meski versi terbaru Supabase SDK secara resmi mensyaratkan Node 22.
process.removeAllListeners("warning")
process.on("warning", (warning) => {
  if (warning.message.includes("supabase")) return // abaikan warning Supabase
  process.stderr.write(`${warning.name}: ${warning.message}\n`)
})

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
