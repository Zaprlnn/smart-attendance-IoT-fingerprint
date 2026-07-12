/**
 * lib/supabase/server.ts
 *
 * Central place to import `withSupabase` and shared Supabase helpers.
 *
 * Usage in a Next.js Route Handler (App Router):
 *
 *   import { withSupabase } from "@supabase/server"
 *   import { NextResponse } from "next/server"
 *
 *   export const GET = withSupabase({ auth: "user" }, async (_req, ctx) => {
 *     const { data, error } = await ctx.supabase.from("todos").select()
 *     if (error) return NextResponse.json({ error: error.message }, { status: 500 })
 *     return NextResponse.json(data)
 *   })
 *
 * Auth modes
 * ----------
 * "user"        – requires a valid JWT in the Authorization header; provides
 *                 an RLS-scoped client (ctx.supabase) and an admin client
 *                 that bypasses RLS (ctx.supabaseAdmin).
 * "publishable" – uses the publishable key; suitable for public read-only routes.
 * "secret"      – uses the secret key; only for trusted server-to-server calls.
 * "none"        – no auth enforcement.
 *
 * Environment variables (defined in .env.local)
 * -----------------------------------------------
 * SUPABASE_URL             – https://<project-ref>.supabase.co
 * SUPABASE_PUBLISHABLE_KEY – sb_publishable_…
 * SUPABASE_SECRET_KEY      – sb_secret_…  ← NEVER expose to the browser
 * SUPABASE_JWKS_URL        – …/auth/v1/.well-known/jwks.json
 */

// Re-export so the rest of the codebase only needs to import from here.
export { withSupabase } from "@supabase/server"
