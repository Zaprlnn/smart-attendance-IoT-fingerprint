"use client"

import { BookOpen, Mail, Router, Users } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/section-card"
import { StatCard } from "@/components/dashboard/stat-card"
import { ThemeSection } from "@/components/dashboard/profile/theme-section"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useCurrentUser } from "@/lib/stores/auth-store"
import { devices, getCoursesByLecturer, getStudentsByCourse } from "@/lib/mock"
import { getInitials } from "@/lib/utils"

export default function DosenProfilPage() {
  const currentUser = useCurrentUser()
  const lecturer = currentUser && "nip" in currentUser ? currentUser : null

  if (!lecturer) return null

  const myCourses = getCoursesByLecturer(lecturer.id)
  const uniqueStudentIds = new Set<string>()
  myCourses.forEach((course) => {
    getStudentsByCourse(course.id).forEach((s) => uniqueStudentIds.add(s.id))
  })
  const onlineDevices = devices.filter((d) => d.status === "online").length

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
            <StatCard title="Mata Kuliah Diampu" value={String(myCourses.length)} icon={BookOpen} />
            <StatCard title="Total Mahasiswa" value={String(uniqueStudentIds.size)} icon={Users} />
            <StatCard
              title="Perangkat Online"
              value={`${onlineDevices}/${devices.length}`}
              icon={Router}
              tone={onlineDevices === devices.length ? "success" : "warning"}
            />
          </SectionCard>
        </div>
      </div>
    </>
  )
}
