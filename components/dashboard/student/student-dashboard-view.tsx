"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  AlertTriangle,
  BookOpen,
  Fingerprint,
  ListChecks,
  MapPin,
  Percent,
  UserX,
} from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"

import { DashboardHero } from "@/components/dashboard/dashboard-hero"
import { StatCard } from "@/components/dashboard/stat-card"
import { SectionCard } from "@/components/dashboard/section-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useCurrentUser } from "@/lib/stores/auth-store"
import { apiFetch } from "@/lib/api-client"
import {
  ATTENDANCE_STATUS_BADGE_VARIANT as STATUS_BADGE_VARIANT,
  ATTENDANCE_STATUS_LABEL as STATUS_LABEL,
} from "@/lib/dashboard/attendance-status"
import type { AttendanceStatus, StudentDashboardData } from "@/lib/types"

const COMPOSITION_CHART_CONFIG: ChartConfig = {
  hadir: { label: "Hadir", color: "var(--success)" },
  izin: { label: "Izin", color: "var(--primary)" },
  sakit: { label: "Sakit", color: "var(--warning)" },
  alpha: { label: "Alpha", color: "var(--destructive)" },
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  )
}

export function StudentDashboardView() {
  const currentUser = useCurrentUser()
  const student = currentUser && "nim" in currentUser ? currentUser : null

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<StudentDashboardData | null>(null)
  const now = new Date()

  const studentId = student?.id

  useEffect(() => {
    if (!studentId) return
    let cancelled = false
    apiFetch<{ data: StudentDashboardData }>(`/mahasiswa/${studentId}/dashboard`)
      .then((res) => {
        if (!cancelled) setData(res.data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [studentId])

  if (!student) return null

  const firstName = student.nama.split(" ")[0]
  const summaries = data?.summaries ?? []
  const todayCourses = data?.todayCourses ?? []
  const recentActivity = data?.recentActivity ?? []

  const totalSessions = summaries.reduce((acc, s) => acc + s.totalSessions, 0)
  const totalHadir = summaries.reduce((acc, s) => acc + s.hadir, 0)
  const totalIzin = summaries.reduce((acc, s) => acc + s.izin, 0)
  const totalSakit = summaries.reduce((acc, s) => acc + s.sakit, 0)
  const totalAlpha = summaries.reduce((acc, s) => acc + s.alpha, 0)
  const overallPct =
    totalSessions === 0 ? 0 : Math.round((totalHadir / totalSessions) * 100)
  const hasLowCourse = summaries.some((s) => s.isWarning)

  const compositionData = [
    { key: "hadir", value: totalHadir },
    { key: "izin", value: totalIzin },
    { key: "sakit", value: totalSakit },
    { key: "alpha", value: totalAlpha },
  ].filter((d) => d.value > 0)

  return (
    <>
      <DashboardHero
        title={`Halo, ${firstName}`}
        description={format(now, "EEEE, d MMMM yyyy", { locale: id })}
      />

      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Kehadiran"
            value={`${overallPct}%`}
            icon={Percent}
            tone={hasLowCourse ? "warning" : "success"}
          />
          <StatCard
            title="Pertemuan Diikuti"
            value={String(totalSessions)}
            icon={ListChecks}
          />
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
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <SectionCard
            title="Jadwal Hari Ini"
            description="Mata kuliah yang dijadwalkan hari ini."
          >
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : todayCourses.length === 0 ? (
              <EmptyState
                title="Tidak ada kelas hari ini"
                description="Nikmati waktu luangmu, atau cek jadwal mingguan untuk persiapan."
                className="border-none py-10"
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {todayCourses.map(({ course, sesi, record }) => (
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
                      <Badge variant={record ? STATUS_BADGE_VARIANT[record.status] : "outline"}>
                        {record ? STATUS_LABEL[record.status] : "Belum Presensi"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Kehadiran per Mata Kuliah"
            description="Persentase kehadiran di setiap mata kuliah yang kamu ambil."
          >
            {loading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {summaries.map((summary) => (
                  <li key={summary.courseId} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {summary.courseNama}
                      </span>
                      <div className="flex items-center gap-2">
                        {summary.isWarning && (
                          <Badge variant="warning">
                            <AlertTriangle />
                            Perlu Perhatian
                          </Badge>
                        )}
                        <span className="text-sm font-medium tabular-nums text-muted-foreground">
                          {summary.persentaseHadir}%
                        </span>
                      </div>
                    </div>
                    <Progress value={summary.persentaseHadir} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard
            title="Komposisi Presensi"
            description="Rekap status kehadiran sepanjang semester."
          >
            {loading ? (
              <Skeleton className="h-50 rounded-lg" />
            ) : compositionData.length === 0 ? (
              <EmptyState
                title="Belum ada data presensi"
                className="border-none py-10"
              />
            ) : (
              <ChartContainer
                config={COMPOSITION_CHART_CONFIG}
                className="mx-auto aspect-square max-h-56"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel nameKey="key" />}
                  />
                  <Pie
                    data={compositionData}
                    dataKey="value"
                    nameKey="key"
                    innerRadius={50}
                    outerRadius={80}
                    strokeWidth={4}
                    isAnimationActive={false}
                  >
                    {compositionData.map((entry) => (
                      <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            {!loading && compositionData.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
                {compositionData.map((entry) => (
                  <span
                    key={entry.key}
                    className="flex items-center gap-1.5 text-muted-foreground"
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: `var(--color-${entry.key})` }}
                    />
                    {STATUS_LABEL[entry.key as AttendanceStatus]} ({entry.value})
                  </span>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Aktivitas Presensi Terakhir"
            description="Scan presensi terbarumu."
          >
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <EmptyState
                title="Belum ada aktivitas"
                className="border-none py-10"
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {recentActivity.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Fingerprint className="size-3.5" />
                    </span>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="font-medium">{activity.courseNama}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), "d MMM, HH:mm", {
                          locale: id,
                        })}
                      </span>
                    </div>
                    <Badge variant={STATUS_BADGE_VARIANT[activity.status]}>
                      {STATUS_LABEL[activity.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  )
}
