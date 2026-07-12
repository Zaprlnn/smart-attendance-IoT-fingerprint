"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { CalendarIcon, Download, Fingerprint, History, PenLine, X } from "lucide-react"
import { toast } from "sonner"

import { exportRowsToExcel, type ExcelColumn } from "@/lib/export/export-excel"
import { PageHeader } from "@/components/dashboard/page-header"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { useCurrentUser } from "@/lib/stores/auth-store"
import { attendanceRecords, devices, getCourseById } from "@/lib/mock"
import {
  ATTENDANCE_STATUS_BADGE_VARIANT,
  ATTENDANCE_STATUS_LABEL,
} from "@/lib/dashboard/attendance-status"
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types"

const STATUS_FILTER_OPTIONS: AttendanceStatus[] = ["hadir", "izin", "sakit", "alpha"]

const EXCEL_COLUMNS: ExcelColumn<AttendanceRecord>[] = [
  {
    header: "Tanggal",
    width: 14,
    value: (r) => format(new Date(r.timestamp), "d MMM yyyy", { locale: id }),
  },
  { header: "Waktu", width: 10, value: (r) => format(new Date(r.timestamp), "HH:mm"), align: "center" },
  { header: "Mata Kuliah", width: 28, value: (r) => getCourseById(r.courseId)?.nama ?? r.courseId },
  { header: "Status", width: 12, value: (r) => ATTENDANCE_STATUS_LABEL[r.status], align: "center" },
  {
    header: "Metode",
    width: 14,
    value: (r) => (r.method === "fingerprint" ? "Fingerprint" : "Manual"),
    align: "center",
  },
  {
    header: "Perangkat",
    width: 18,
    value: (r) => devices.find((d) => d.id === r.deviceId)?.nama ?? "-",
  },
]

function isWithinRange(timestamp: string, range: DateRange | undefined): boolean {
  if (!range?.from) return true
  const date = new Date(timestamp)
  const from = new Date(range.from)
  from.setHours(0, 0, 0, 0)
  if (date < from) return false

  const to = range.to ? new Date(range.to) : new Date(range.from)
  to.setHours(23, 59, 59, 999)
  return date <= to
}

export default function RiwayatPage() {
  const currentUser = useCurrentUser()
  const student = currentUser && "nim" in currentUser ? currentUser : null

  const [courseFilter, setCourseFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [isExporting, setIsExporting] = useState(false)

  const records = useMemo(() => {
    if (!student) return []
    return attendanceRecords
      .filter((r) => r.studentId === student.id)
      .filter((r) => courseFilter === "all" || r.courseId === courseFilter)
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .filter((r) => isWithinRange(r.timestamp, dateRange))
      .sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
  }, [student, courseFilter, statusFilter, dateRange])

  if (!student) return null

  const enrolledCourses = student.enrolledCourseIds
    .map((courseId) => getCourseById(courseId))
    .filter((c): c is NonNullable<typeof c> => c !== null)

  const summaryCounts = STATUS_FILTER_OPTIONS.reduce<Record<string, number>>(
    (acc, status) => {
      acc[status] = records.filter((r) => r.status === status).length
      return acc
    },
    {}
  )

  const hasActiveFilter =
    courseFilter !== "all" || statusFilter !== "all" || Boolean(dateRange?.from)

  function resetFilters() {
    setCourseFilter("all")
    setStatusFilter("all")
    setDateRange(undefined)
  }

  const dateRangeLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "d MMM yyyy", { locale: id })} – ${format(dateRange.to, "d MMM yyyy", { locale: id })}`
      : format(dateRange.from, "d MMM yyyy", { locale: id })
    : "Rentang tanggal"

  async function handleExport() {
    if (!student || records.length === 0) {
      toast.error("Tidak ada data untuk diekspor.")
      return
    }

    setIsExporting(true)
    try {
      await exportRowsToExcel({
        filename: `riwayat-presensi-${student.nim}-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
        sheetName: "Riwayat Presensi",
        title: `Riwayat Presensi — ${student.nama}`,
        subtitle: `${student.nim} • Diekspor ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: id })}`,
        columns: EXCEL_COLUMNS,
        rows: records,
      })
      toast.success("Riwayat berhasil diekspor", {
        description: `${records.length} baris disimpan ke file Excel.`,
      })
    } catch {
      toast.error("Gagal mengekspor riwayat", {
        description: "Terjadi kesalahan saat membuat file Excel. Coba lagi.",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Riwayat Presensi"
        description="Rekam jejak kehadiranmu di setiap pertemuan."
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={handleExport}
          >
            <Download />
            {isExporting ? "Mengekspor..." : "Export"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUS_FILTER_OPTIONS.map((status) => (
          <div
            key={status}
            className="rounded-xl border border-border bg-card p-4 shadow-soft hover-lift"
          >
            <p className="text-sm text-muted-foreground">
              {ATTENDANCE_STATUS_LABEL[status]}
            </p>
            <p className="font-display text-2xl font-semibold">
              {summaryCounts[status]}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={courseFilter}
          onValueChange={(value) => setCourseFilter(value ?? "all")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Mata kuliah">
              {(value: string | null) =>
                !value || value === "all"
                  ? "Semua Mata Kuliah"
                  : enrolledCourses.find((c) => c.id === value)?.nama ??
                    "Mata kuliah"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Mata Kuliah</SelectItem>
            {enrolledCourses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value ?? "all")}
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
            {STATUS_FILTER_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {ATTENDANCE_STATUS_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm" className="text-muted-foreground">
                <CalendarIcon />
                {dateRangeLabel}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={id}
            />
          </PopoverContent>
        </Popover>

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X />
            Reset
          </Button>
        )}
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={History}
          title="Tidak ada riwayat presensi"
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
        <div className="rounded-xl border border-border shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Perangkat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const course = getCourseById(record.courseId)
                const device = devices.find((d) => d.id === record.deviceId)
                const timestamp = new Date(record.timestamp)
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(timestamp, "d MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(timestamp, "HH:mm")}
                    </TableCell>
                    <TableCell>{course?.nama ?? record.courseId}</TableCell>
                    <TableCell>
                      <Badge variant={ATTENDANCE_STATUS_BADGE_VARIANT[record.status]}>
                        {ATTENDANCE_STATUS_LABEL[record.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        {record.method === "fingerprint" ? (
                          <Fingerprint className="size-3.5" />
                        ) : (
                          <PenLine className="size-3.5" />
                        )}
                        {record.method === "fingerprint" ? "Fingerprint" : "Manual"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {device?.nama ?? "-"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
