"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import { authenticate } from "@/lib/mock"
import type { AuthResult, Lecturer, Student, UserRole } from "@/lib/types"

type CurrentUser = Student | Lecturer

interface AuthState {
  currentUser: CurrentUser | null
  role: UserRole | null
  isAuthenticated: boolean
  hasHydrated: boolean
  login: (username: string, password: string) => AuthResult | null
  logout: () => void
  setHasHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      role: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (username, password) => {
        const result = authenticate(username, password)
        if (!result) return null
        set({
          currentUser: result.user,
          role: result.role,
          isAuthenticated: true,
        })
        return result
      },
      logout: () =>
        set({ currentUser: null, role: null, isAuthenticated: false }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "smart-attendance-auth",
      partialize: (state) => ({
        currentUser: state.currentUser,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// Selectors — pakai ini di komponen agar hanya re-render saat slice terkait berubah.
export const useCurrentUser = (): CurrentUser | null =>
  useAuthStore((s) => s.currentUser)
export const useAuthRole = (): UserRole | null => useAuthStore((s) => s.role)
export const useIsAuthenticated = (): boolean =>
  useAuthStore((s) => s.isAuthenticated)
export const useAuthHydrated = (): boolean =>
  useAuthStore((s) => s.hasHydrated)
