import { createServerClient } from "@supabase/ssr"

/**
 * Admin client — pakai SUPABASE_SECRET_KEY sehingga bypass RLS.
 * Hanya dipakai di server-side (Route Handlers, Server Actions).
 * JANGAN import di Client Components.
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  )
}
