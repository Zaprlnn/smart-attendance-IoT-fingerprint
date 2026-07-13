"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Lecturer, Student, UserRole } from "@/lib/types"

type CurrentUser = Student | Lecturer

interface LoginResult {
  role: UserRole
  user: CurrentUser
}

interface AuthState {
  currentUser: CurrentUser | null
  role: UserRole | null
  token: string | null
  isAuthenticated: boolean
  hasHydrated: boolean
  login: (role: UserRole, identifier: string, password: string) => Promise<LoginResult | null>
  logout: () => void
  setHasHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      role: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: async (role, identifier, password) => {
        const res = await fetch(`/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: role === "student" ? "student" : "lecturer",
            identifier,
            password,
          }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok) return null

        set({
          currentUser: data.user,
          role: data.role,
          token: data.token,
          isAuthenticated: true,
        })
        return { role: data.role as UserRole, user: data.user as CurrentUser }
      },
      logout: () => set({ currentUser: null, role: null, token: null, isAuthenticated: false }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "smart-attendance-auth",
      // Naikkan version ini kalau bentuk AuthState berubah lagi. migrate wajib
      // ada agar localStorage versi lama dibuang bersih (bukan cuma warning
      // di console) -- state lama gak punya token JWT dari migrasi backend
      // Supabase->Prisma, jadi paksa logout drpd dipakai apa adanya.
      version: 1,
      migrate: () => ({
        currentUser: null,
        role: null,
        token: null,
        isAuthenticated: false,
      }),
      partialize: (state) => ({
        currentUser: state.currentUser,
        role: state.role,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// Selectors — pakai ini di komponen agar hanya re-render saat slice terkait berubah.
export const useCurrentUser = (): CurrentUser | null => useAuthStore((s) => s.currentUser)
export const useAuthRole = (): UserRole | null => useAuthStore((s) => s.role)
export const useIsAuthenticated = (): boolean => useAuthStore((s) => s.isAuthenticated)
export const useAuthHydrated = (): boolean => useAuthStore((s) => s.hasHydrated)
