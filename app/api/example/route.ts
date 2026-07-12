/**
 * app/api/example/route.ts
 *
 * Example Route Handler showing all four auth modes of @supabase/server.
 * Delete or keep as a reference — it is not wired to any UI.
 */

import { withSupabase } from "@supabase/server"
import { NextResponse } from "next/server"

// ── "user" mode ────────────────────────────────────────────────────────────
// Requires a valid JWT in the Authorization header.
// ctx.supabase  → RLS-scoped client (acts as the signed-in user)
// ctx.supabaseAdmin → admin client that bypasses RLS
export const GET = withSupabase({ auth: "user" }, async (_req, ctx) => {
  const { data, error } = await ctx.supabase.from("todos").select()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
})

// ── "publishable" mode ─────────────────────────────────────────────────────
// Uses SUPABASE_PUBLISHABLE_KEY. Safe for public/anonymous reads.
// export const GET = withSupabase({ auth: "publishable" }, async (_req, ctx) => {
//   const { data } = await ctx.supabase.from("products").select()
//   return NextResponse.json(data)
// })

// ── "secret" mode ─────────────────────────────────────────────────────────
// Uses SUPABASE_SECRET_KEY. For trusted server-to-server calls only.
// export const POST = withSupabase({ auth: "secret" }, async (req, ctx) => {
//   const body = await req.json()
//   const { error } = await ctx.supabaseAdmin.from("logs").insert(body)
//   if (error) return NextResponse.json({ error: error.message }, { status: 500 })
//   return NextResponse.json({ ok: true })
// })

// ── "none" mode ────────────────────────────────────────────────────────────
// No auth enforcement. Use for truly public webhooks or health checks.
// export const GET = withSupabase({ auth: "none" }, async (_req, ctx) => {
//   return NextResponse.json({ status: "ok" })
// })
