"use client"

import Link from "next/link"
import { AlertTriangle, BookOpen, ChevronRight } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { useCurrentUser } from "@/lib/stores/auth-store"
import { getAttendanceSummary } from "@/lib/mock"
import { ATTENDANCE_STATUS_LABEL } from "@/lib/dashboard/attendance-status"
import type { AttendanceStatus } from "@/lib/types"

const BREAKDOWN_STATUSES: AttendanceStatus[] = ["hadir", "izin", "sakit", "alpha"]

export default function MataKuliahPage() {
  const currentUser = useCurrentUser()
  const student = currentUser && "nim" in currentUser ? currentUser : null

  if (!student) return null

  const summaries = getAttendanceSummary(student.id)

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
    </>
  )
}
