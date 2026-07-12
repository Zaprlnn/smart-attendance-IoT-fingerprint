"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, MapPin, Router as RouterIcon, Users } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/section-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  deviceForRoom,
  getAttendanceSummary,
  getCourseById,
  getSessionsByCourse,
  getStudentsByCourse,
} from "@/lib/mock"

function initials(nama: string): string {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export default function MataKuliahDetailPage() {
  const params = useParams<{ courseId: string }>()
  const router = useRouter()

  const course = getCourseById(params.courseId)

  const peserta = useMemo(() => {
    if (!course) return []
    return getStudentsByCourse(course.id)
      .map((student) => {
        const summary = getAttendanceSummary(student.id).find(
          (s) => s.courseId === course.id
        )
        return { student, summary }
      })
      .sort((a, b) => a.student.nama.localeCompare(b.student.nama))
  }, [course])

  if (!course) {
    return (
      <>
        <PageHeader
          title="Mata Kuliah"
          description="Mata kuliah tidak ditemukan."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dosen/mata-kuliah-hari-ini")}
            >
              <ArrowLeft />
              Kembali
            </Button>
          }
        />
        <EmptyState icon={BookOpen} title="Mata kuliah tidak ditemukan" />
      </>
    )
  }

  const sessionsList = getSessionsByCourse(course.id)
  const device = deviceForRoom(course.jadwal.ruang)
  const sesiSelesai = sessionsList.filter((s) => s.status !== "akan-datang").length
  const rataRata =
    peserta.length === 0
      ? 0
      : Math.round(
          peserta.reduce((acc, p) => acc + (p.summary?.persentaseHadir ?? 0), 0) /
            peserta.length
        )

  return (
    <>
      <PageHeader
        title={course.nama}
        description={`${course.kode} • ${course.sks} SKS • Semester ${course.semester}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dosen/mata-kuliah-hari-ini")}
          >
            <ArrowLeft />
            Kembali
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft hover-lift">
          <p className="text-sm text-muted-foreground">Jadwal</p>
          <p className="font-display text-lg font-semibold">
            {course.jadwal.hari}
          </p>
          <p className="text-xs text-muted-foreground">
            {course.jadwal.jamMulai}–{course.jadwal.jamSelesai}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft hover-lift">
          <p className="text-sm text-muted-foreground">Ruang & Device</p>
          <p className="flex items-center gap-1 font-display text-lg font-semibold">
            <MapPin className="size-4" />
            {course.jadwal.ruang}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <RouterIcon className="size-3" />
            {device.nama}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft hover-lift">
          <p className="text-sm text-muted-foreground">Peserta</p>
          <p className="flex items-center gap-1 font-display text-2xl font-semibold">
            <Users className="size-4" />
            {peserta.length}
          </p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-soft hover-lift">
          <p className="text-sm text-muted-foreground">Rata-rata Kehadiran</p>
          <p className="font-display text-2xl font-semibold text-primary">
            {rataRata}%
          </p>
          <p className="text-xs text-muted-foreground">
            {sesiSelesai} dari {sessionsList.length} pertemuan
          </p>
        </div>
      </div>

      <SectionCard
        title="Rekap Kehadiran Kelas"
        description="Persentase kehadiran tiap peserta di mata kuliah ini."
      >
        {peserta.length === 0 ? (
          <EmptyState title="Belum ada peserta" className="border-none py-10" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mahasiswa</TableHead>
                <TableHead>NIM</TableHead>
                <TableHead>Hadir</TableHead>
                <TableHead>Izin</TableHead>
                <TableHead>Sakit</TableHead>
                <TableHead>Alpha</TableHead>
                <TableHead>% Kehadiran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {peserta.map(({ student, summary }) => (
                <TableRow
                  key={student.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Lihat profil ${student.nama}`}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
                  onClick={() => router.push(`/dosen/mahasiswa/${student.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      router.push(`/dosen/mahasiswa/${student.id}`)
                    }
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback>{initials(student.nama)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.nama}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{student.nim}</TableCell>
                  <TableCell className="text-muted-foreground">{summary?.hadir ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">{summary?.izin ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">{summary?.sakit ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">{summary?.alpha ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={summary?.isWarning ? "warning" : "secondary"}>
                      {summary?.persentaseHadir ?? 0}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </>
  )
}
