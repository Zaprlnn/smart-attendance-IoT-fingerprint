"use client"

import { useEffect, useState } from "react"
import { BookOpen, Mail, Router, Users } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/section-card"
import { StatCard } from "@/components/dashboard/stat-card"
import { ThemeSection } from "@/components/dashboard/profile/theme-section"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useCurrentUser } from "@/lib/stores/auth-store"
import { apiFetch } from "@/lib/api-client"
import { getInitials } from "@/lib/utils"
import type { DosenDashboardData } from "@/lib/types"

export default function DosenProfilPage() {
  const currentUser = useCurrentUser()
  const lecturer = currentUser && "nip" in currentUser ? currentUser : null
  const [data, setData] = useState<DosenDashboardData | null>(null)

  useEffect(() => {
    if (!lecturer) return
    apiFetch<{ data: DosenDashboardData }>(`/dosen/${lecturer.id}/dashboard`).then((res) => setData(res.data))
  }, [lecturer])

  if (!lecturer) return null

  return (
    <>
      <PageHeader title="Profil" description="Data diri dan akun kamu." />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Akun" className="lg:col-span-1">
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar size="lg" className="size-20">
              <AvatarFallback className="text-lg">
                {getInitials(lecturer.nama)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-display text-lg font-semibold">{lecturer.nama}</p>
              <p className="text-sm text-muted-foreground">NIP {lecturer.nip}</p>
            </div>
            <Badge variant="secondary">Dosen</Badge>

            <div className="mt-2 flex w-full flex-col gap-2 text-left text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="size-3.5" />
                  Email
                </span>
                <span className="truncate font-medium">{lecturer.email}</span>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <ThemeSection />

          <SectionCard
            title="Ringkasan Mengajar"
            description="Aktivitasmu sebagai dosen di Smart Attendance."
            contentClassName="grid gap-4 sm:grid-cols-3"
          >
            <StatCard title="Mata Kuliah Diampu" value={String(data?.myCourses.length ?? 0)} icon={BookOpen} />
            <StatCard title="Total Mahasiswa" value={String(data?.uniqueStudentCount ?? 0)} icon={Users} />
            <StatCard
              title="Perangkat Online"
              value={`${data?.onlineDevices ?? 0}/${data?.totalDevices ?? 0}`}
              icon={Router}
              tone={(data?.onlineDevices ?? 0) === (data?.totalDevices ?? 0) ? "success" : "warning"}
            />
          </SectionCard>
        </div>
      </div>
    </>
  )
}
