"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarCheck, ChevronRight, MapPin, Users } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentUser } from "@/lib/stores/auth-store"
import { apiFetch } from "@/lib/api-client"
import type { Course, SessionStatus, TodaySesiEntry } from "@/lib/types"

const STATUS_LABEL: Record<SessionStatus, string> = {
  berlangsung: "Berlangsung",
  "akan-datang": "Akan Datang",
  selesai: "Selesai",
}

function CourseRow({
  course,
  status,
  onClick,
}: {
  course: Course
  status?: SessionStatus
  onClick: () => void
}) {
  return (
    <li
      role="button"
      tabIndex={0}
      aria-label={`Lihat detail mata kuliah ${course.nama}`}
      className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{course.nama}</p>
          <span className="text-xs text-muted-foreground">{course.kode}</span>
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {course.jadwal.hari}, {course.jadwal.jamMulai}–{course.jadwal.jamSelesai}
          <span className="text-muted-foreground/50">•</span>
          <MapPin className="size-3" />
          {course.jadwal.ruang}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="size-3.5" />
          {course.enrolledCount ?? 0}
        </span>
        {status && (
          <Badge variant={status === "berlangsung" ? "success" : "outline"}>
            {STATUS_LABEL[status]}
          </Badge>
        )}
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
    </li>
  )
}

export default function DosenMataKuliahHariIniPage() {
  const router = useRouter()
  const currentUser = useCurrentUser()
  const lecturer = currentUser && "nip" in currentUser ? currentUser : null

  const [loading, setLoading] = useState(true)
  const [todayEntries, setTodayEntries] = useState<TodaySesiEntry[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])

  useEffect(() => {
    if (!lecturer) return
    Promise.all([
      apiFetch<{ data: TodaySesiEntry[] }>("/mata-kuliah/hari-ini/list"),
      apiFetch<{ data: Course[] }>(`/mata-kuliah?dosenId=${lecturer.id}`),
    ]).then(([todayRes, allRes]) => {
      setTodayEntries(todayRes.data)
      setAllCourses(allRes.data)
      setLoading(false)
    })
  }, [lecturer])

  if (!lecturer) return null

  function goToCourse(courseId: string) {
    router.push(`/dosen/mata-kuliah-hari-ini/${courseId}`)
  }

  return (
    <>
      <PageHeader
        title="Mata Kuliah Hari Ini"
        description="Kelola mata kuliah yang dijadwalkan hari ini."
      />

      <Tabs defaultValue="hari-ini">
        <TabsList>
          <TabsTrigger value="hari-ini">Hari Ini</TabsTrigger>
          <TabsTrigger value="semua">Semua Mata Kuliah</TabsTrigger>
        </TabsList>

        <TabsContent value="hari-ini" className="mt-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : todayEntries.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="Tidak ada kelas hari ini"
              description="Jika tidak ada kelas hari ini, lihat tab Semua Mata Kuliah untuk jadwal mingguan."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {todayEntries.map(({ mataKuliah, status }) => (
                <CourseRow
                  key={mataKuliah.id}
                  course={mataKuliah}
                  status={status}
                  onClick={() => goToCourse(mataKuliah.id)}
                />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="semua" className="mt-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : allCourses.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="Belum ada mata kuliah"
              description="Kamu belum mengampu mata kuliah apa pun."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {allCourses.map((course) => (
                <CourseRow key={course.id} course={course} onClick={() => goToCourse(course.id)} />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
