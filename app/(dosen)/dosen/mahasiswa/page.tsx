"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Fingerprint, Search, ShieldAlert, Users, X } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { EmptyState } from "@/components/dashboard/empty-state"
import { RegisterStudentDialog } from "@/components/dashboard/lecturer/register-student-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useMahasiswaDatabase } from "@/lib/realtime/use-mahasiswa"
import { getAttendanceSummary } from "@/lib/mock"

function initials(nama: string): string {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export default function DosenMahasiswaPage() {
  const router = useRouter()
  const { mahasiswa: students, loading } = useMahasiswaDatabase()

  const [search, setSearch] = useState("")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [fingerprintFilter, setFingerprintFilter] = useState("all")

  const semesterOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.semester))).sort((a, b) => a - b),
    [students]
  )

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return students
      .filter((s) => semesterFilter === "all" || String(s.semester) === semesterFilter)
      .filter(
        (s) =>
          fingerprintFilter === "all" ||
          (fingerprintFilter === "terdaftar" ? s.fingerprint_enrolled : !s.fingerprint_enrolled)
      )
      .filter(
        (s) =>
          !query || s.nama.toLowerCase().includes(query) || s.nim.includes(query)
      )
      .map((student) => {
        const summaries = getAttendanceSummary(student.id)
        const totalSessions = summaries.reduce((acc, s) => acc + s.totalSessions, 0)
        const totalHadir = summaries.reduce((acc, s) => acc + s.hadir, 0)
        const persentaseHadir =
          totalSessions === 0 ? null : Math.round((totalHadir / totalSessions) * 100)
        return { student, persentaseHadir }
      })
      .sort((a, b) => a.student.nama.localeCompare(b.student.nama))
  }, [students, search, semesterFilter, fingerprintFilter])

  const hasActiveFilter =
    search.trim() !== "" || semesterFilter !== "all" || fingerprintFilter !== "all"

  function resetFilters() {
    setSearch("")
    setSemesterFilter("all")
    setFingerprintFilter("all")
  }

  return (
    <>
      <PageHeader
        title="Mahasiswa"
        description="Kelola dan daftarkan mahasiswa baru."
        actions={<RegisterStudentDialog />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Cari nama / NIM..."
            aria-label="Cari berdasarkan nama atau NIM"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 pl-8"
          />
        </div>

        <Select value={semesterFilter} onValueChange={(v) => setSemesterFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semester">
              {(value: string | null) =>
                !value || value === "all" ? "Semua Semester" : `Semester ${value}`
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Semester</SelectItem>
            {semesterOptions.map((semester) => (
              <SelectItem key={semester} value={String(semester)}>
                Semester {semester}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={fingerprintFilter}
          onValueChange={(v) => setFingerprintFilter(v ?? "all")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status Fingerprint">
              {(value: string | null) =>
                !value || value === "all"
                  ? "Semua Status Fingerprint"
                  : value === "terdaftar"
                    ? "Terdaftar"
                    : "Belum Terdaftar"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status Fingerprint</SelectItem>
            <SelectItem value="terdaftar">Terdaftar</SelectItem>
            <SelectItem value="belum">Belum Terdaftar</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X />
            Reset
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Tidak ada mahasiswa"
          description="Tidak ada mahasiswa yang cocok dengan filter saat ini."
          action={
            hasActiveFilter ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Filter
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-border shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mahasiswa</TableHead>
                <TableHead>NIM</TableHead>
                <TableHead>Prodi</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Fingerprint</TableHead>
                <TableHead>% Kehadiran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ student, persentaseHadir }) => (
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
                        <AvatarImage src={student.avatarUrl} alt={student.nama} />
                        <AvatarFallback>{initials(student.nama)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.nama}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{student.nim}</TableCell>
                  <TableCell className="text-muted-foreground">{student.prodi}</TableCell>
                  <TableCell className="text-muted-foreground">{student.semester}</TableCell>
                  <TableCell>
                    {student.fingerprint_enrolled ? (
                      <Badge variant="success">
                        <Fingerprint />
                        Terdaftar
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <ShieldAlert />
                        Belum
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {persentaseHadir === null ? (
                      <span className="text-muted-foreground">Belum ada data</span>
                    ) : (
                      <Badge variant={persentaseHadir < 75 ? "warning" : "secondary"}>
                        {persentaseHadir}%
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
