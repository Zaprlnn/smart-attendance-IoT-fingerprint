"use client"

import { useEffect, useState } from "react"
import { BookOpen, ListChecks, Mail, Percent, UserX } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/section-card"
import { StatCard } from "@/components/dashboard/stat-card"
import { ThemeSection } from "@/components/dashboard/profile/theme-section"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useCurrentUser } from "@/lib/stores/auth-store"
import { apiFetch } from "@/lib/api-client"
import { getInitials } from "@/lib/utils"
import type { AttendanceSummary } from "@/lib/types"

export default function StudentProfilPage() {
  const currentUser = useCurrentUser()
  const student = currentUser && "nim" in currentUser ? currentUser : null
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([])

  useEffect(() => {
    if (!student) return
    apiFetch<{ data: AttendanceSummary[] }>(`/mahasiswa/${student.id}/presensi-summary`).then((res) =>
      setSummaries(res.data)
    )
  }, [student])

  if (!student) return null

  const totalSessions = summaries.reduce((acc, s) => acc + s.totalSessions, 0)
  const totalHadir = summaries.reduce((acc, s) => acc + s.hadir, 0)
  const totalAlpha = summaries.reduce((acc, s) => acc + s.alpha, 0)
  const overallPct =
    totalSessions === 0 ? 0 : Math.round((totalHadir / totalSessions) * 100)
  const hasLowCourse = summaries.some((s) => s.isWarning)

  return (
    <>
      <PageHeader title="Profil" description="Data diri dan akun kamu." />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Akun" className="lg:col-span-1">
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar size="lg" className="size-20">
              <AvatarFallback className="text-lg">
                {getInitials(student.nama)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-display text-lg font-semibold">{student.nama}</p>
              <p className="text-sm text-muted-foreground">{student.nim}</p>
            </div>
            <Badge variant="secondary">Mahasiswa</Badge>

            <div className="mt-2 flex w-full flex-col gap-2 text-left text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Prodi</span>
                <span className="font-medium">{student.prodi}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Semester</span>
                <span className="font-medium">{student.semester}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="size-3.5" />
                  Email
                </span>
                <span className="truncate font-medium">{student.email}</span>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <ThemeSection />

          <SectionCard
            title="Ringkasan Kehadiran"
            description="Performa presensimu sepanjang semester."
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <StatCard
              title="Total Kehadiran"
              value={`${overallPct}%`}
              icon={Percent}
              tone={hasLowCourse ? "warning" : "success"}
            />
            <StatCard title="Pertemuan Diikuti" value={String(totalSessions)} icon={ListChecks} />
            <StatCard
              title="Jumlah Alpha"
              value={String(totalAlpha)}
              icon={UserX}
              tone={totalAlpha > 0 ? "destructive" : "default"}
            />
            <StatCard
              title="Mata Kuliah Aktif"
              value={String(summaries.length)}
              icon={BookOpen}
            />
          </SectionCard>
        </div>
      </div>
    </>
  )
}
