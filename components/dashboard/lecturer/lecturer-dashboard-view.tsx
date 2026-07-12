"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  Radio,
  Router,
  Users,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import { DashboardHero } from "@/components/dashboard/dashboard-hero"
import { StatCard } from "@/components/dashboard/stat-card"
import { SectionCard } from "@/components/dashboard/section-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { MonitoringFeedPreview } from "@/components/realtime/monitoring-feed-preview"
import { WarningActionModal } from "@/components/dashboard/lecturer/warning-action-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useCurrentUser } from "@/lib/stores/auth-store"
import { useRealtimeSimulator } from "@/lib/realtime/use-realtime-simulator"
import {
  attendanceRecords,
  deviceForRoom,
  devices,
  getAttendanceSummary,
  getCoursesByLecturer,
  getStudentsByCourse,
  getTodayCourses,
  sessions,
} from "@/lib/mock"

const RATE_CHART_CONFIG: ChartConfig = {
  rate: { label: "Tingkat Kehadiran", color: "var(--primary)" },
}

const TREND_CHART_CONFIG: ChartConfig = {
  hadir: { label: "Hadir", color: "var(--primary)" },
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[112px] rounded-xl" />
      ))}
    </div>
  )
}

interface AtRiskRow {
  studentId: string
  nama: string
  nim: string
  courseId: string
  courseNama: string
  persentaseHadir: number
}

export function LecturerDashboardView() {
  const currentUser = useCurrentUser()
  const lecturer = currentUser && "nip" in currentUser ? currentUser : null
  const { events, isPlaying } = useRealtimeSimulator()

  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(new Date())
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  if (!lecturer) return null

  const myCourses = getCoursesByLecturer(lecturer.id)
  const myCourseIds = myCourses.map((c) => c.id)

  const uniqueStudentIds = new Set<string>()
  myCourses.forEach((course) => {
    getStudentsByCourse(course.id).forEach((student) => {
      uniqueStudentIds.add(student.id)
    })
  })

  const todayEntries = now
    ? getTodayCourses(now).filter((entry) => myCourseIds.includes(entry.course.id))
    : []

  const sesiBerlangsung = todayEntries.filter(
    (entry) => entry.session.status === "berlangsung"
  ).length

  const hadirHariIni = todayEntries.reduce((acc, entry) => {
    return (
      acc +
      attendanceRecords.filter(
        (r) => r.sessionId === entry.session.id && r.status === "hadir"
      ).length
    )
  }, 0)

  const onlineDevices = devices.filter((d) => d.status === "online").length

  // Tingkat kehadiran per mata kuliah (bar chart)
  const rateData = myCourses.map((course) => {
    const records = attendanceRecords.filter((r) => r.courseId === course.id)
    const hadir = records.filter((r) => r.status === "hadir").length
    const rate = records.length === 0 ? 0 : Math.round((hadir / records.length) * 100)
    return { kode: course.kode, nama: course.nama, rate }
  })

  // Tren harian (area chart) — jumlah hadir per tanggal pertemuan, 10 hari terakhir.
  const sessionById = new Map(sessions.map((s) => [s.id, s]))
  const dailyHadir: Record<string, number> = {}
  attendanceRecords.forEach((r) => {
    if (!myCourseIds.includes(r.courseId) || r.status !== "hadir") return
    const session = sessionById.get(r.sessionId)
    if (!session) return
    dailyHadir[session.tanggal] = (dailyHadir[session.tanggal] ?? 0) + 1
  })
  const trendData = Object.entries(dailyHadir)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-10)
    .map(([date, hadir]) => ({
      date,
      label: format(new Date(date), "d MMM", { locale: id }),
      hadir,
    }))

  // Mahasiswa perlu perhatian (<75%)
  const atRiskRows: AtRiskRow[] = []
  myCourses.forEach((course) => {
    getStudentsByCourse(course.id).forEach((student) => {
      const summary = getAttendanceSummary(student.id).find(
        (s) => s.courseId === course.id
      )
      if (summary?.isWarning) {
        atRiskRows.push({
          studentId: student.id,
          nama: student.nama,
          nim: student.nim,
          courseId: course.id,
          courseNama: course.nama,
          persentaseHadir: summary.persentaseHadir,
        })
      }
    })
  })
  atRiskRows.sort((a, b) => a.persentaseHadir - b.persentaseHadir)

  return (
    <>
      <DashboardHero
        title={`Halo, ${lecturer.nama.split(" ")[0]}`}
        description={
          now
            ? format(now, "EEEE, d MMMM yyyy", { locale: id })
            : "Memuat tanggal hari ini..."
        }
      />

      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Mahasiswa"
            value={String(uniqueStudentIds.size)}
            icon={Users}
          />
          <StatCard
            title="Hadir Hari Ini"
            value={String(hadirHariIni)}
            icon={CheckCircle2}
            tone={hadirHariIni > 0 ? "success" : "default"}
          />
          <StatCard
            title="Sesi Berlangsung"
            value={String(sesiBerlangsung)}
            icon={Radio}
            tone={sesiBerlangsung > 0 ? "success" : "default"}
          />
          <StatCard
            title="Perangkat Online"
            value={`${onlineDevices}/${devices.length}`}
            icon={Router}
            tone={onlineDevices === devices.length ? "success" : "warning"}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <SectionCard
            title="Mata Kuliah Hari Ini"
            description="Sesi yang kamu ampu hari ini."
          >
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
                description="Tidak ada mata kuliah yang kamu ampu terjadwal hari ini."
                className="border-none py-10"
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {todayEntries.map(({ course, session }) => {
                  const totalEnrolled = getStudentsByCourse(course.id).length
                  const hadirCount = attendanceRecords.filter(
                    (r) => r.sessionId === session.id && r.status === "hadir"
                  ).length
                  const device = deviceForRoom(course.jadwal.ruang)
                  const pct =
                    totalEnrolled === 0
                      ? 0
                      : Math.round((hadirCount / totalEnrolled) * 100)

                  return (
                    <li
                      key={course.id}
                      className="flex flex-col gap-2 rounded-lg border border-border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{course.nama}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            {course.jadwal.jamMulai}–{course.jadwal.jamSelesai}
                            <span className="text-muted-foreground/50">•</span>
                            <MapPin className="size-3" />
                            {course.jadwal.ruang}
                            <span className="text-muted-foreground/50">•</span>
                            {device.nama}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.status === "berlangsung" && (
                            <Badge className="bg-primary/10 text-primary">
                              Berlangsung
                            </Badge>
                          )}
                          <span className="text-sm font-medium tabular-nums">
                            {hadirCount}/{totalEnrolled} hadir
                          </span>
                        </div>
                      </div>
                      <Progress value={pct} />
                    </li>
                  )
                })}
              </ul>
            )}
          </SectionCard>

          <div className="grid gap-6 sm:grid-cols-2">
            <SectionCard
              title="Kehadiran per Mata Kuliah"
              description="Persentase rata-rata sepanjang semester."
            >
              {loading ? (
                <Skeleton className="h-[220px] rounded-lg" />
              ) : rateData.length === 0 ? (
                <EmptyState title="Belum ada data" className="border-none py-10" />
              ) : (
                <ChartContainer config={RATE_CHART_CONFIG} className="aspect-auto h-[220px] w-full">
                  <BarChart data={rateData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="kode" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      width={32}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.nama ?? ""
                          }
                        />
                      }
                    />
                    <Bar
                      dataKey="rate"
                      fill="var(--color-rate)"
                      radius={4}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </SectionCard>

            <SectionCard
              title="Tren Kehadiran Harian"
              description="Jumlah mahasiswa hadir per pertemuan."
            >
              {loading ? (
                <Skeleton className="h-[220px] rounded-lg" />
              ) : trendData.length === 0 ? (
                <EmptyState title="Belum ada data" className="border-none py-10" />
              ) : (
                <ChartContainer config={TREND_CHART_CONFIG} className="aspect-auto h-[220px] w-full">
                  <AreaChart data={trendData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={28} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      dataKey="hadir"
                      type="monotone"
                      fill="var(--color-hadir)"
                      fillOpacity={0.2}
                      stroke="var(--color-hadir)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Mahasiswa Perlu Perhatian"
            description="Kehadiran di bawah 75% pada salah satu mata kuliah."
          >
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : atRiskRows.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Semua mahasiswa sehat"
                description="Tidak ada mahasiswa dengan kehadiran di bawah 75% saat ini."
                className="border-none py-10"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mahasiswa</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Kehadiran</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRiskRows.map((row) => (
                    <TableRow key={`${row.studentId}-${row.courseId}`}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{row.nama}</span>
                          <span className="text-xs text-muted-foreground">
                            {row.nim}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.courseNama}
                      </TableCell>
                      <TableCell>
                        <Badge variant="warning">
                          <AlertTriangle />
                          {row.persentaseHadir}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            render={<Link href={`/dosen/mahasiswa/${row.studentId}`} />}
                            nativeButton={false}
                          >
                            Lihat
                          </Button>
                          <WarningActionModal
                            studentNama={row.nama}
                            studentNim={row.nim}
                            courseNama={row.courseNama}
                            persentaseHadir={row.persentaseHadir}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Monitoring Live"
          description={isPlaying ? "Sedang berjalan" : "Simulator tidak aktif"}
        >
          <MonitoringFeedPreview events={events} viewAllHref="/dosen/monitoring" />
        </SectionCard>
      </div>
    </>
  )
}
