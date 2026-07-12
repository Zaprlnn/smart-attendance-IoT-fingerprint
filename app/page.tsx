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

export default function Home() {
  const router = useRouter()
  const hasHydrated = useAuthHydrated()
  const isAuthenticated = useIsAuthenticated()
  const role = useAuthRole()

  useEffect(() => {
    if (!hasHydrated) return
    router.replace(isAuthenticated && role ? DASHBOARD_BY_ROLE[role] : "/login")
  }, [hasHydrated, isAuthenticated, role, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Memuat" />
    </div>
  )
}
