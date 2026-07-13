"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { AlertTriangle, ArrowLeft, BookOpen, Clock, MapPin, User } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { EmptyState } from "@/components/dashboard/empty-state"
import { SectionCard } from "@/components/dashboard/section-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCurrentUser } from "@/lib/stores/auth-store"
import { apiFetch } from "@/lib/api-client"
import {
  ATTENDANCE_STATUS_BADGE_VARIANT,
  ATTENDANCE_STATUS_LABEL,
  MIN_ATTENDANCE_PERCENTAGE,
} from "@/lib/dashboard/attendance-status"
import type { AttendanceRecord, AttendanceSummary, Course, Session } from "@/lib/types"

export default function MataKuliahDetailPage() {
  const params = useParams<{ courseId: string }>()
  const courseId = params.courseId
  const currentUser = useCurrentUser()
  const student = currentUser && "nim" in currentUser ? currentUser : null

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    if (!student) return
    Promise.all([
      apiFetch<{ data: Course }>(`/mata-kuliah/${courseId}`).catch(() => null),
      apiFetch<{ data: Session[] }>(`/mata-kuliah/${courseId}/sesi`).catch(() => ({ data: [] })),
      apiFetch<{ data: AttendanceSummary[] }>(`/mahasiswa/${student.id}/presensi-summary`),
      apiFetch<{ data: AttendanceRecord[] }>(`/mahasiswa/${student.id}/presensi`),
    ]).then(([courseRes, sesiRes, summariesRes, recordsRes]) => {
      setCourse(courseRes?.data ?? null)
      setSessions(sesiRes.data)
      setSummary(summariesRes.data.find((s) => s.courseId === courseId) ?? null)
      setRecords(recordsRes.data.filter((r) => r.courseId === courseId))
      setLoading(false)
    })
  }, [student, courseId])

  if (!student) return null

  if (loading) {
    return (
      <>
        <PageHeader title="Mata Kuliah" />
        <Skeleton className="h-64 rounded-xl" />
      </>
    )
  }

  const isEnrolled = summary !== null

  if (!course || !isEnrolled) {
    return (
      <>
        <PageHeader title="Mata Kuliah" />
        <EmptyState
          icon={BookOpen}
          title="Mata kuliah tidak ditemukan"
          description="Mata kuliah ini tidak tersedia atau bukan bagian dari mata kuliah yang kamu ambil."
          action={
            <Button
              render={<Link href="/mahasiswa/mata-kuliah" />}
              nativeButton={false}
              variant="outline"
              size="sm"
            >
              <ArrowLeft />
              Kembali ke Mata Kuliah
            </Button>
          }
        />
      </>
    )
  }

  const isWarning = summary?.isWarning ?? false
  const recordBySesiId = new Map(records.map((r) => [r.sesiId, r]))

  return (
    <>
      <div>
        <Button
          render={<Link href="/mahasiswa/mata-kuliah" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="mb-2 text-muted-foreground"
        >
          <ArrowLeft />
          Mata Kuliah
        </Button>
        <PageHeader
          title={course.nama}
          description={`${course.kode} • ${course.sks} SKS`}
        />
      </div>

      <SectionCard title="Informasi Mata Kuliah">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-2">
            <User className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Dosen</p>
              <p className="text-sm font-medium">{course.dosenNama ?? "-"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Jadwal</p>
              <p className="text-sm font-medium">
                {course.jadwal.hari}, {course.jadwal.jamMulai}–
                {course.jadwal.jamSelesai}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Ruang</p>
              <p className="text-sm font-medium">{course.jadwal.ruang}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <BookOpen className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Semester</p>
              <p className="text-sm font-medium">{course.semester}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {isWarning && (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertTitle>Kehadiran di bawah ambang minimal</AlertTitle>
          <AlertDescription>
            Kehadiranmu di mata kuliah ini {summary?.persentaseHadir}%, di
            bawah ambang minimal {MIN_ATTENDANCE_PERCENTAGE}% untuk dapat
            mengikuti ujian. Segera hubungi dosen pengampu jika ada kendala.
          </AlertDescription>
        </Alert>
      )}

      <SectionCard
        title="Ringkasan Kehadiran"
        description={
          summary
            ? `Hadir ${summary.hadir} dari ${summary.totalSessions} pertemuan (${summary.persentaseHadir}%)`
            : "Belum ada data presensi."
        }
      >
        <Progress value={summary?.persentaseHadir ?? 0} />
      </SectionCard>

      <SectionCard
        title="Daftar Pertemuan"
        description="Status presensi untuk setiap pertemuan."
        contentClassName="px-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ke-</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Topik</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Jam Scan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const record = recordBySesiId.get(session.id)
              return (
                <TableRow key={session.id}>
                  <TableCell>{session.pertemuanKe}</TableCell>
                  <TableCell>
                    {format(new Date(session.tanggal), "d MMM yyyy", {
                      locale: id,
                    })}
                  </TableCell>
                  <TableCell className="max-w-64 truncate">
                    {session.topik}
                  </TableCell>
                  <TableCell>
                    {record ? (
                      <Badge variant={ATTENDANCE_STATUS_BADGE_VARIANT[record.status]}>
                        {ATTENDANCE_STATUS_LABEL[record.status]}
                      </Badge>
                    ) : session.status === "akan-datang" ? (
                      <Badge variant="outline">Akan Datang</Badge>
                    ) : (
                      <Badge variant="outline">Belum Presensi</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record ? format(new Date(record.timestamp), "HH:mm") : "-"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </SectionCard>
    </>
  )
}
