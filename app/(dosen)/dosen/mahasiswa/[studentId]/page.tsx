"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  ArrowLeft,
  Fingerprint,
  Mail,
  PenLine,
  ShieldAlert,
  Users,
} from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/section-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { EnrollmentWizardModal } from "@/components/dashboard/lecturer/enrollment-wizard-modal"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAllStudents } from "@/lib/stores/students-store"
import { attendanceRecords, courses, devices, getAttendanceSummary, sessions } from "@/lib/mock"
import {
  ATTENDANCE_STATUS_BADGE_VARIANT,
  ATTENDANCE_STATUS_LABEL,
} from "@/lib/dashboard/attendance-status"

const courseById = new Map(courses.map((c) => [c.id, c]))
const sessionById = new Map(sessions.map((s) => [s.id, s]))
const deviceById = new Map(devices.map((d) => [d.id, d]))

function initials(nama: string): string {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export default function MahasiswaProfilePage() {
  const params = useParams<{ studentId: string }>()
  const router = useRouter()
  const students = useAllStudents()

  const student = students.find((s) => s.id === params.studentId) ?? null

  const summaries = useMemo(
    () => (student ? getAttendanceSummary(student.id) : []),
    [student]
  )

  const history = useMemo(() => {
    if (!student) return []
    return attendanceRecords
      .filter((r) => r.studentId === student.id)
      .map((r) => {
        const session = sessionById.get(r.sessionId)
        const course = courseById.get(r.courseId)
        return {
          key: r.id,
          tanggal: session?.tanggal ?? "",
          pertemuanKe: session?.pertemuanKe ?? 0,
          courseNama: course?.nama ?? "-",
          status: r.status,
          waktu: format(new Date(r.timestamp), "HH:mm"),
          method: r.method,
          deviceNama: deviceById.get(r.deviceId)?.nama ?? "-",
        }
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .slice(0, 30)
  }, [student])

  if (!student) {
    return (
      <>
        <PageHeader
          title="Mahasiswa"
          description="Profil mahasiswa tidak ditemukan."
          actions={
            <Button variant="outline" size="sm" onClick={() => router.push("/dosen/mahasiswa")}>
              <ArrowLeft />
              Kembali
            </Button>
          }
        />
        <EmptyState
          icon={Users}
          title="Mahasiswa tidak ditemukan"
          description="Data mahasiswa mungkin belum tersedia atau dihapus dari sesi mock saat ini."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={student.nama}
        description={`${student.nim} • ${student.prodi}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/dosen/mahasiswa")}>
            <ArrowLeft />
            Kembali
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Profil" className="lg:col-span-1">
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar size="lg" className="size-20">
              <AvatarImage src={student.avatarUrl} alt={student.nama} />
              <AvatarFallback className="text-lg">{initials(student.nama)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-display text-lg font-semibold">{student.nama}</p>
              <p className="text-sm text-muted-foreground">{student.nim}</p>
            </div>
            {student.fingerprintEnrolled ? (
              <Badge variant="success">
                <Fingerprint />
                Sidik jari terdaftar
              </Badge>
            ) : (
              <div className="flex flex-col items-center gap-1.5 w-full">
                <Badge variant="outline" className="w-fit">
                  <ShieldAlert />
                  Sidik jari belum terdaftar
                </Badge>
                <EnrollmentWizardModal studentId={student.id} studentNama={student.nama} />
              </div>
            )}

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

        <SectionCard
          title="Ringkasan Kehadiran per Mata Kuliah"
          className="lg:col-span-2"
        >
          {summaries.length === 0 ? (
            <EmptyState title="Belum terdaftar di mata kuliah" className="border-none py-10" />
          ) : (
            <ul className="flex flex-col gap-3">
              {summaries.map((summary) => (
                <li key={summary.courseId} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{summary.courseNama}</p>
                    <Badge variant={summary.isWarning ? "warning" : "secondary"}>
                      {summary.persentaseHadir}%
                    </Badge>
                  </div>
                  <Progress value={summary.persentaseHadir} className="mt-2" />
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Hadir: {summary.hadir}</span>
                    <span>Izin: {summary.izin}</span>
                    <span>Sakit: {summary.sakit}</span>
                    <span>Alpha: {summary.alpha}</span>
                    <span>Total: {summary.totalSessions} pertemuan</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Riwayat Presensi"
        description="30 catatan presensi terbaru dari seluruh mata kuliah."
      >
        {history.length === 0 ? (
          <EmptyState title="Belum ada riwayat presensi" className="border-none py-10" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Ke-</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Device</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>
                    {row.tanggal
                      ? format(new Date(row.tanggal), "d MMM yyyy", { locale: id })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.waktu}</TableCell>
                  <TableCell className="text-muted-foreground">{row.courseNama}</TableCell>
                  <TableCell className="text-muted-foreground">{row.pertemuanKe || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={ATTENDANCE_STATUS_BADGE_VARIANT[row.status]}>
                      {ATTENDANCE_STATUS_LABEL[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      {row.method === "fingerprint" ? (
                        <Fingerprint className="size-3.5" />
                      ) : (
                        <PenLine className="size-3.5" />
                      )}
                      {row.method === "fingerprint" ? "Fingerprint" : "Manual"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.deviceNama}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </>
  )
}
