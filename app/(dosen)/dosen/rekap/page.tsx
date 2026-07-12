"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Fingerprint,
  PenLine,
  Search,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { exportRowsToExcel, type ExcelColumn } from "@/lib/export/export-excel"
import { PageHeader } from "@/components/dashboard/page-header"
import { EmptyState } from "@/components/dashboard/empty-state"
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
import {
  attendanceRecords,
  courses,
  devices,
  getCourseAttendanceForAllStudents,
  getSessionsByCourse,
  sessions,
  students,
} from "@/lib/mock"
import {
  ATTENDANCE_STATUS_BADGE_VARIANT,
  ATTENDANCE_STATUS_LABEL,
} from "@/lib/dashboard/attendance-status"
import type { AttendanceMethod, AttendanceStatus } from "@/lib/types"

const STATUS_OPTIONS: AttendanceStatus[] = ["hadir", "izin", "sakit", "alpha"]
const PAGE_SIZE = 15

interface RekapRow {
  key: string
  tanggal: string
  pertemuanKe: number
  nim: string
  nama: string
  courseNama: string
  status: AttendanceStatus | null
  waktu: string | null
  method: AttendanceMethod | null
  deviceNama: string | null
}

const studentById = new Map(students.map((s) => [s.id, s]))
const courseById = new Map(courses.map((c) => [c.id, c]))
const sessionById = new Map(sessions.map((s) => [s.id, s]))
const deviceById = new Map(devices.map((d) => [d.id, d]))

const EXCEL_COLUMNS: ExcelColumn<RekapRow>[] = [
  {
    header: "Tanggal",
    width: 14,
    value: (row) => (row.tanggal ? format(new Date(row.tanggal), "d MMM yyyy", { locale: id }) : "-"),
  },
  { header: "Waktu", width: 10, value: (row) => row.waktu ?? "-", align: "center" },
  { header: "NIM", width: 16, value: (row) => row.nim },
  { header: "Mahasiswa", width: 26, value: (row) => row.nama },
  { header: "Mata Kuliah", width: 28, value: (row) => row.courseNama },
  { header: "Ke-", width: 6, value: (row) => row.pertemuanKe || "-", align: "center" },
  {
    header: "Status",
    width: 12,
    value: (row) => (row.status ? ATTENDANCE_STATUS_LABEL[row.status] : "Belum ada data"),
    align: "center",
  },
  {
    header: "Metode",
    width: 14,
    value: (row) => (row.method === "fingerprint" ? "Fingerprint" : row.method === "manual" ? "Manual" : "-"),
    align: "center",
  },
  { header: "Device", width: 18, value: (row) => row.deviceNama ?? "-" },
]

export default function RekapPresensiPage() {
  const [courseFilter, setCourseFilter] = useState("all")
  const [sessionFilter, setSessionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [gracePeriod, setGracePeriod] = useState(15) // toleransi dalam menit
  const [cutoffPeriod, setCutoffPeriod] = useState(30) // batas keterlambatan dalam menit
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)

  const sessionOptions = useMemo(
    () =>
      courseFilter === "all"
        ? []
        : getSessionsByCourse(courseFilter).filter(
            (s) => s.status !== "akan-datang"
          ),
    [courseFilter]
  )

  // Helper untuk menghitung menit keterlambatan
  const calculateLateMinutes = (timestampStr: string, tanggalStr: string, jamMulaiStr: string): number => {
    try {
      const checkIn = new Date(timestampStr)
      const [hours, minutes] = jamMulaiStr.split(":").map(Number)
      const classStart = new Date(tanggalStr)
      classStart.setHours(hours, minutes, 0, 0)
      
      const diffMs = checkIn.getTime() - classStart.getTime()
      return Math.round(diffMs / 60_000)
    } catch {
      return 0
    }
  }

  const rows = useMemo<RekapRow[]>(() => {
    if (courseFilter !== "all" && sessionFilter !== "all") {
      const course = courseById.get(courseFilter)
      const session = sessionById.get(sessionFilter)
      if (!course || !session) return []

      return getCourseAttendanceForAllStudents(courseFilter, sessionFilter).map(
        ({ student, record }) => {
          let status = record?.status ?? null
          if (record && record.status === "hadir") {
            const late = calculateLateMinutes(record.timestamp, session.tanggal, course.jadwal.jamMulai)
            if (late > cutoffPeriod) {
              status = "alpha"
            }
          }
          return {
            key: `${student.id}-${sessionFilter}`,
            tanggal: session.tanggal,
            pertemuanKe: session.pertemuanKe,
            nim: student.nim,
            nama: student.nama,
            courseNama: course.nama,
            status,
            waktu: record ? format(new Date(record.timestamp), "HH:mm") : null,
            method: record?.method ?? null,
            deviceNama: record
              ? deviceById.get(record.deviceId)?.nama ?? null
              : null,
          }
        }
      )
    }

    return attendanceRecords
      .filter((r) => courseFilter === "all" || r.courseId === courseFilter)
      .map((r) => {
        const session = sessionById.get(r.sessionId)
        const student = studentById.get(r.studentId)
        const course = courseById.get(r.courseId)
        let status = r.status
        
        if (r.status === "hadir" && session && course) {
          const late = calculateLateMinutes(r.timestamp, session.tanggal, course.jadwal.jamMulai)
          if (late > cutoffPeriod) {
            status = "alpha"
          }
        }

        return {
          key: r.id,
          tanggal: session?.tanggal ?? "",
          pertemuanKe: session?.pertemuanKe ?? 0,
          nim: student?.nim ?? "-",
          nama: student?.nama ?? "-",
          courseNama: course?.nama ?? "-",
          status,
          waktu: format(new Date(r.timestamp), "HH:mm"),
          method: r.method,
          deviceNama: deviceById.get(r.deviceId)?.nama ?? null,
        }
      })
  }, [courseFilter, sessionFilter, cutoffPeriod])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows
      .filter((row) => statusFilter === "all" || row.status === statusFilter)
      .filter(
        (row) =>
          !query ||
          row.nama.toLowerCase().includes(query) ||
          row.nim.includes(query)
      )
      .sort((a, b) => {
        if (a.tanggal !== b.tanggal) return b.tanggal.localeCompare(a.tanggal)
        return (b.waktu ?? "").localeCompare(a.waktu ?? "")
      })
  }, [rows, statusFilter, search])

  const summary = STATUS_OPTIONS.reduce<Record<AttendanceStatus, number>>(
    (acc, status) => {
      acc[status] = filteredRows.filter((r) => r.status === status).length
      return acc
    },
    { hadir: 0, izin: 0, sakit: 0, alpha: 0 }
  )
  const totalRows = filteredRows.length
  const attendancePct =
    totalRows === 0 ? 0 : Math.round((summary.hadir / totalRows) * 100)

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const hasActiveFilter =
    courseFilter !== "all" ||
    sessionFilter !== "all" ||
    statusFilter !== "all" ||
    search.trim() !== ""

  function resetFilters() {
    setCourseFilter("all")
    setSessionFilter("all")
    setStatusFilter("all")
    setSearch("")
    setPage(1)
  }

  function updateCourseFilter(value: string) {
    setCourseFilter(value)
    setSessionFilter("all")
    setPage(1)
  }

  async function handleExport() {
    if (filteredRows.length === 0) {
      toast.error("Tidak ada data untuk diekspor.")
      return
    }

    setIsExporting(true)
    try {
      const courseLabel =
          courseFilter === "all" ? "Semua Mata Kuliah" : courseById.get(courseFilter)?.nama ?? "Mata Kuliah"
      await exportRowsToExcel({
        filename: `rekap-presensi-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
        sheetName: "Rekap Presensi",
        title: "Rekap Presensi — Smart Attendance UAD",
        subtitle: `${courseLabel} • Diekspor ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: id })}`,
        columns: EXCEL_COLUMNS,
        rows: filteredRows,
      })
      toast.success("Rekap berhasil diekspor", {
        description: `${filteredRows.length} baris disimpan ke file Excel.`,
      })
    } catch {
      toast.error("Gagal mengekspor rekap", {
        description: "Terjadi kesalahan saat membuat file Excel. Coba lagi.",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Rekap Presensi"
        description="Rekap kehadiran seluruh mahasiswa per mata kuliah & pertemuan."
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={handleExport}
          >
            <Download />
            {isExporting ? "Mengekspor..." : "Export Rekap"}
          </Button>
        }
      />

      {/* Kebijakan Presensi Slider (Smart Feature) */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-soft mb-6 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <span className="font-semibold text-sm">Kebijakan Presensi Pintar (Real-time Simulator)</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Geser batas toleransi keterlambatan di bawah ini. Status mahasiswa dan persentase kehadiran akan dihitung ulang secara dinamis berdasarkan jam mulai mata kuliah.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-foreground">Toleransi Keterlambatan (Hadir):</span>
              <span className="text-primary font-mono">{gracePeriod} Menit</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={gracePeriod}
              onChange={(e) => setGracePeriod(Number(e.target.value))}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <p className="text-[10px] text-muted-foreground">
              Mahasiswa yang memindai sidik jari &le; {gracePeriod} menit dari jam mulai kuliah dianggap hadir tepat waktu.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-foreground">Batas Maksimal Terlambat (Auto Alpha):</span>
              <span className="text-destructive font-mono">{cutoffPeriod} Menit</span>
            </div>
            <input
              type="range"
              min={15}
              max={60}
              step={5}
              value={cutoffPeriod}
              onChange={(e) => setCutoffPeriod(Number(e.target.value))}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <p className="text-[10px] text-muted-foreground">
              Mahasiswa yang terlambat &gt; {cutoffPeriod} menit akan otomatis ditandai sebagai Alpha oleh sistem.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STATUS_OPTIONS.map((status) => (
          <div
            key={status}
            className="rounded-xl border border-border bg-card p-4 shadow-soft hover-lift"
          >
            <p className="text-sm text-muted-foreground">
              {ATTENDANCE_STATUS_LABEL[status]}
            </p>
            <p className="font-display text-2xl font-semibold">
              {summary[status]}
            </p>
          </div>
        ))}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-soft hover-lift">
          <p className="text-sm text-muted-foreground">% Kehadiran</p>
          <p className="font-display text-2xl font-semibold text-primary">
            {attendancePct}%
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={courseFilter} onValueChange={(v) => updateCourseFilter(v ?? "all")}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Mata kuliah">
              {(value: string | null) =>
                !value || value === "all"
                  ? "Semua Mata Kuliah"
                  : courseById.get(value)?.nama ?? "Mata kuliah"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Mata Kuliah</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sessionFilter}
          onValueChange={(v) => {
            setSessionFilter(v ?? "all")
            setPage(1)
          }}
          disabled={courseFilter === "all"}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Pertemuan">
              {(value: string | null) =>
                !value || value === "all"
                  ? "Semua Pertemuan"
                  : (() => {
                      const session = sessionById.get(value)
                      return session
                        ? `Pertemuan ${session.pertemuanKe} • ${format(new Date(session.tanggal), "d MMM", { locale: id })}`
                        : "Pertemuan"
                    })()
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Pertemuan</SelectItem>
            {sessionOptions.map((session) => (
              <SelectItem key={session.id} value={session.id}>
                Pertemuan {session.pertemuanKe} •{" "}
                {format(new Date(session.tanggal), "d MMM yyyy", { locale: id })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v ?? "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status">
              {(value: string | null) =>
                !value || value === "all"
                  ? "Semua Status"
                  : ATTENDANCE_STATUS_LABEL[value as AttendanceStatus]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {ATTENDANCE_STATUS_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Cari nama / NIM..."
            aria-label="Cari berdasarkan nama atau NIM"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-52 pl-8"
          />
        </div>

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X />
            Reset
          </Button>
        )}
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState
          title="Tidak ada data rekap"
          description="Tidak ada data yang cocok dengan filter saat ini. Coba ubah atau reset filter."
          action={
            hasActiveFilter ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Filter
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border shadow-soft">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>NIM</TableHead>
                  <TableHead>Mahasiswa</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead>Ke-</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell>
                      {row.tanggal
                        ? format(new Date(row.tanggal), "d MMM yyyy", {
                            locale: id,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.waktu ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.nim}
                    </TableCell>
                    <TableCell className="font-medium">{row.nama}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.courseNama}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.pertemuanKe || "-"}
                    </TableCell>
                    <TableCell>
                      {row.status ? (
                        <Badge variant={ATTENDANCE_STATUS_BADGE_VARIANT[row.status]}>
                          {ATTENDANCE_STATUS_LABEL[row.status]}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Belum ada data</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.method ? (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          {row.method === "fingerprint" ? (
                            <Fingerprint className="size-3.5" />
                          ) : (
                            <PenLine className="size-3.5" />
                          )}
                          {row.method === "fingerprint" ? "Fingerprint" : "Manual"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.deviceNama ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Menampilkan {pageRows.length} dari {filteredRows.length} baris
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft />
              </Button>
              <span>
                Halaman {currentPage} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Halaman berikutnya"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
