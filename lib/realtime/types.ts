import type { DeviceStatus } from "@/lib/types"

export interface ScanEvent {
  id: string
  studentId: string
  studentNama: string
  deviceId: string
  deviceNama: string
  ruang: string
  courseId: string | null
  courseNama: string
  /** ISO datetime. */
  timestamp: string
}

export interface DeviceRuntimeStat {
  status: DeviceStatus
  /** 0-100 */
  signal: number
  /** ISO datetime. */
  lastSeen: string
  totalScanHariIni: number
}
