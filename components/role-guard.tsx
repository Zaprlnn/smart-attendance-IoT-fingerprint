"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import {
  useAuthHydrated,
  useAuthRole,
  useIsAuthenticated,
} from "@/lib/stores/auth-store"
import type { UserRole } from "@/lib/types"

const DASHBOARD_BY_ROLE: Record<UserRole, string> = {
  student: "/mahasiswa/dashboard",
  lecturer: "/dosen/dashboard",
}

interface RoleGuardProps {
  role: UserRole
  children: React.ReactNode
}

/**
 * Guard sisi client untuk area yang butuh role tertentu. Status auth di-persist
 * zustand ke localStorage, jadi baru pasti setelah `hasHydrated` true — sebelum
 * itu tampilkan loading agar tidak flicker ke /login.
 */
export function RoleGuard({ role, children }: RoleGuardProps) {
  const router = useRouter()
  const hasHydrated = useAuthHydrated()
  const isAuthenticated = useIsAuthenticated()
  const currentRole = useAuthRole()

  const isAuthorized = isAuthenticated && currentRole === role

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }
    if (currentRole !== role) {
      router.replace(DASHBOARD_BY_ROLE[currentRole ?? role])
    }
  }, [hasHydrated, isAuthenticated, currentRole, role, router])

  if (!hasHydrated || !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Memuat" />
      </div>
    )
  }

  return <>{children}</>
}
