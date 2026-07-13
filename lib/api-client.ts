"use client"

import { useAuthStore } from "@/lib/stores/auth-store"

/**
 * Fetch wrapper ke app/api/* (Next.js Route Handlers) — otomatis attach JWT dari auth-store.
 * Mengembalikan body JSON penuh (`{ ok, data, ... }`) apa adanya — caller yang
 * mengambil `.data` sendiri, supaya field lain di luar `data` (mis. `commandId`)
 * tidak hilang oleh unwrap otomatis.
 */
export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.ok) {
    throw new Error(body?.error ?? `Request gagal (${res.status})`)
  }
  return body as T
}
