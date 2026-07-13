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
import { apiFetch } from "@/lib/api-client"
import { useAbsensiRealtime } from "@/lib/realtime/use-absensi-realtime"
import type { DosenDashboardData } from "@/lib/types"

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
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  )
}

export function LecturerDashboardView() {
  const currentUser = useCurrentUser()
  const lecturer = currentUser && "nip" in currentUser ? currentUser : null
  const { rows: absensiRows, isConnected } = useAbsensiRealtime(5)

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DosenDashboardData | null>(null)
  const now = new Date()

  useEffect(() => {
    if (!lecturer) return
    apiFetch<{ data: DosenDashboardData }>(`/dosen/${lecturer.id}/dashboard`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [lecturer])

  if (!lecturer) return null

  const todayEntries = data?.todayEntries ?? []
  const rateData = data?.rateData ?? []
  const trendData =
    data?.trendData.map((t) => ({ ...t, label: format(new Date(t.date), "d MMM", { locale: id }) })) ?? []
  const atRiskRows = data?.atRiskRows ?? []

  return (
    <>
      <DashboardHero
        title={`Halo, ${lecturer.nama.split(" ")[0]}`}
        description={format(now, "EEEE, d MMMM yyyy", { locale: id })}
      />

      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Mahasiswa"
            value={String(data?.uniqueStudentCount ?? 0)}
            icon={Users}
          />
          <StatCard
            title="Hadir Hari Ini"
            value={String(data?.hadirHariIni ?? 0)}
            icon={CheckCircle2}
            tone={(data?.hadirHariIni ?? 0) > 0 ? "success" : "default"}
          />
          <StatCard
            title="Sesi Berlangsung"
            value={String(todayEntries.filter((e) => e.sesi.status === "berlangsung").length)}
            icon={Radio}
            tone={todayEntries.some((e) => e.sesi.status === "berlangsung") ? "success" : "default"}
          />
          <StatCard
            title="Perangkat Online"
            value={`${data?.onlineDevices ?? 0}/${data?.totalDevices ?? 0}`}
            icon={Router}
            tone={(data?.onlineDevices ?? 0) === (data?.totalDevices ?? 0) ? "success" : "warning"}
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
                {todayEntries.map(({ course, sesi, hadirCount, totalEnrolled }) => {
                  const pct = totalEnrolled === 0 ? 0 : Math.round((hadirCount / totalEnrolled) * 100)
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
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {sesi.status === "berlangsung" && (
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
                <Skeleton className="h-55 rounded-lg" />
              ) : rateData.length === 0 ? (
                <EmptyState title="Belum ada data" className="border-none py-10" />
              ) : (
                <ChartContainer config={RATE_CHART_CONFIG} className="aspect-auto h-55 w-full">
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
                <Skeleton className="h-55 rounded-lg" />
              ) : trendData.length === 0 ? (
                <EmptyState title="Belum ada data" className="border-none py-10" />
              ) : (
                <ChartContainer config={TREND_CHART_CONFIG} className="aspect-auto h-55 w-full">
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
          description={isConnected ? "Terhubung ke realtime" : "Menghubungkan..."}
        >
          <MonitoringFeedPreview rows={absensiRows} isConnected={isConnected} viewAllHref="/dosen/monitoring" />
        </SectionCard>
      </div>
    </>
  )
}
