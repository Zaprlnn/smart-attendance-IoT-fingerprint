import type { AttendanceStatus } from "@/lib/types"

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpha: "Alpha",
}

export const ATTENDANCE_STATUS_BADGE_VARIANT: Record<
  AttendanceStatus,
  "success" | "secondary" | "warning" | "destructive"
> = {
  hadir: "success",
  izin: "secondary",
  sakit: "warning",
  alpha: "destructive",
}

export const MIN_ATTENDANCE_PERCENTAGE = 75
