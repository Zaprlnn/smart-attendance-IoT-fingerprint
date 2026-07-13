"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Fingerprint, MapPin } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/section-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/lib/stores/auth-store"
import { apiFetch } from "@/lib/api-client"
import { usePresensiRealtime } from "@/lib/realtime/use-presensi-realtime"
import {
  ATTENDANCE_STATUS_BADGE_VARIANT,
  ATTENDANCE_STATUS_LABEL,
} from "@/lib/dashboard/attendance-status"
import type { StudentDashboardData } from "@/lib/types"

export default function PresensiRealtimePage() {
  const currentUser = useCurrentUser()
  const student = currentUser && "nim" in currentUser ? currentUser : null

  const [loading, setLoading] = useState(true)
  const [todayCourses, setTodayCourses] = useState<StudentDashboardData["todayCourses"]>([])
  const { rows, isConnected } = usePresensiRealtime(student?.id)

  useEffect(() => {
    if (!student) return
    apiFetch<{ data: StudentDashboardData }>(`/mahasiswa/${student.id}/dashboard`)
      .then((res) => setTodayCourses(res.data.todayCourses))
      .finally(() => setLoading(false))
  }, [student])

  if (!student) return null

  // Status live dari realtime menang atas snapshot awal kalau sesi-nya sama.
  const rowBySesiId = new Map(rows.map((r) => [r.sesi_id, r]))

  return (
    <>
      <PageHeader
        title="Presensi Hari Ini"
        description="Status kehadiranmu hari ini, terhubung langsung ke scan fingerprint ESP32."
      />

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={`size-2 rounded-full ${isConnected ? "bg-success animate-pulse" : "bg-muted-foreground/40"}`} />
        {isConnected ? "Terhubung — realtime aktif" : "Menghubungkan..."}
      </div>

      <SectionCard
        title="Jadwal & Status Hari Ini"
        description="Tempelkan sidik jari di perangkat ESP32 saat kelas berlangsung, status di sini akan berubah otomatis."
      >
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : todayCourses.length === 0 ? (
          <EmptyState
            icon={Fingerprint}
            title="Tidak ada kelas hari ini"
            description="Belum ada mata kuliah yang dijadwalkan untukmu hari ini."
            className="border-none py-10"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {todayCourses.map(({ course, sesi, record }) => {
              const liveRecord = sesi ? rowBySesiId.get(sesi.id) : undefined
              const status = liveRecord?.status ?? record?.status
              return (
                <li
                  key={course.id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">{course.nama}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {course.jadwal.jamMulai}–{course.jadwal.jamSelesai}
                      <span className="text-muted-foreground/50">•</span>
                      <MapPin className="size-3" />
                      {course.jadwal.ruang}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {sesi?.presensiStatus === "dibuka" && (
                      <Badge className="animate-pulse bg-primary/10 text-primary">
                        🔴 Presensi Dibuka
                      </Badge>
                    )}
                    <Badge variant={status ? ATTENDANCE_STATUS_BADGE_VARIANT[status] : "outline"}>
                      {status ? ATTENDANCE_STATUS_LABEL[status] : "Belum Presensi"}
                    </Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Riwayat Scan Terbaru"
        description="Presensi terbaru yang tercatat dari sensor fingerprint."
      >
        {rows.length === 0 ? (
          <EmptyState title="Belum ada scan tercatat" className="border-none py-10" />
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.slice(0, 10).map((row) => (
              <li key={row.id} className="flex items-center gap-3 text-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Fingerprint className="size-3.5" />
                </span>
                <span className="flex-1 text-xs text-muted-foreground">
                  {format(new Date(row.timestamp), "d MMM, HH:mm", { locale: id })}
                </span>
                <Badge variant={ATTENDANCE_STATUS_BADGE_VARIANT[row.status]}>
                  {ATTENDANCE_STATUS_LABEL[row.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </>
  )
}
