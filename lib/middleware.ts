import { NextResponse, type NextRequest } from 'next/server'

/**
 * Proxy helper — hanya meneruskan request tanpa modifikasi.
 *
 * Proyek ini menggunakan sistem auth custom (mock/Zustand store),
 * bukan Supabase Auth. Tidak ada redirect ke halaman login dari sini.
 *
 * Jika kelak ingin proteksi route berbasis Supabase Auth, aktifkan
 * kode yang ada di bawah ini.
 */
export async function updateSession(request: NextRequest) {
  // Langsung teruskan — tidak ada pengecekan auth
  return NextResponse.next({ request })

  // ── Contoh jika ingin aktifkan proteksi route: ───────────────────────
  // import { createServerClient } from '@supabase/ssr'
  //
  // const supabase = createServerClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  //   { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  // )
  // const { data } = await supabase.auth.getClaims()
  // if (!data?.claims && !request.nextUrl.pathname.startsWith('/login')) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }
  // return NextResponse.next({ request })
}
