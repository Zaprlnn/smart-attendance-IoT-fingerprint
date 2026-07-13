"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, BookOpen, ChevronRight, Plus } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/section-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/lib/stores/auth-store"
import { apiFetch } from "@/lib/api-client"
import { ATTENDANCE_STATUS_LABEL } from "@/lib/dashboard/attendance-status"
import type { AttendanceStatus, AttendanceSummary, Course } from "@/lib/types"

const BREAKDOWN_STATUSES: AttendanceStatus[] = ["hadir", "izin", "sakit", "alpha"]

export default function MataKuliahPage() {
  const currentUser = useCurrentUser()
  const student = currentUser && "nim" in currentUser ? currentUser : null
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrollingId, setEnrollingId] = useState<string | null>(null)

  function refetch() {
    if (!student) return
    return Promise.all([
      apiFetch<{ data: AttendanceSummary[] }>(`/mahasiswa/${student.id}/presensi-summary`),
      apiFetch<{ data: Course[] }>("/mata-kuliah"),
    ]).then(([summariesRes, coursesRes]) => {
      setSummaries(summariesRes.data)
      setAllCourses(coursesRes.data)
    })
  }

  useEffect(() => {
    refetch()?.finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student])

  async function handleDaftar(courseId: string) {
    setEnrollingId(courseId)
    try {
      await apiFetch(`/mata-kuliah/${courseId}/enroll-diri`, { method: "POST" })
      toast.success("Berhasil daftar mata kuliah")
      await refetch()
    } catch (err) {
      toast.error("Gagal daftar", { description: err instanceof Error ? err.message : String(err) })
    } finally {
      setEnrollingId(null)
    }
  }

  if (!student) return null

  const enrolledIds = new Set(summaries.map((s) => s.courseId))
  const availableCourses = allCourses.filter((c) => !enrolledIds.has(c.id))

  if (loading) {
    return (
      <>
        <PageHeader title="Mata Kuliah" description="Daftar mata kuliah yang kamu ambil semester ini." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Mata Kuliah"
        description="Daftar mata kuliah yang kamu ambil semester ini."
      />

      {summaries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Belum ada mata kuliah"
          description="Kamu belum terdaftar di mata kuliah apa pun semester ini."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => (
            <Link
              key={summary.courseId}
              href={`/mahasiswa/mata-kuliah/${summary.courseId}`}
              className="block focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-xl"
            >
              <Card className="h-full shadow-soft transition-colors hover:border-primary/40">
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-semibold leading-snug">
                      {summary.courseNama}
                    </h3>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      Kehadiran
                    </span>
                    <span className="font-display text-lg font-semibold">
                      {summary.persentaseHadir}%
                    </span>
                  </div>
                  <Progress value={summary.persentaseHadir} />

                  {summary.isWarning && (
                    <Badge variant="warning" className="w-fit">
                      <AlertTriangle />
                      Perlu Perhatian
                    </Badge>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {BREAKDOWN_STATUSES.map((status) => (
                      <span key={status}>
                        {ATTENDANCE_STATUS_LABEL[status]}:{" "}
                        <span className="font-medium text-foreground">
                          {summary[status]}
                        </span>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <SectionCard
        title="Mata Kuliah Tersedia"
        description="Daftar sendiri ke mata kuliah lain yang ingin kamu ikuti."
      >
        {availableCourses.length === 0 ? (
          <EmptyState title="Semua mata kuliah sudah kamu ikuti" className="border-none py-10" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableCourses.map((course) => (
              <div
                key={course.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{course.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.kode} • {course.jadwal.hari}, {course.jadwal.jamMulai}–{course.jadwal.jamSelesai}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={enrollingId === course.id}
                  onClick={() => handleDaftar(course.id)}
                >
                  <Plus />
                  {enrollingId === course.id ? "Mendaftar..." : "Daftar"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  )
}
