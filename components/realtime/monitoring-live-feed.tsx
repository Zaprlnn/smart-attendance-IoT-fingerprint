"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { AlertTriangle, MapPin, Radio } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/dashboard/empty-state"
import { cn, getInitials } from "@/lib/utils"
import { getAttendanceSummary } from "@/lib/mock"
import type { ScanEvent } from "@/lib/realtime/types"
import type { Course, Device } from "@/lib/types"

interface MonitoringLiveFeedProps {
  events: ScanEvent[]
  courses: Course[]
  devices: Device[]
}

export function MonitoringLiveFeed({
  events,
  courses,
  devices,
}: MonitoringLiveFeedProps) {
  const [courseFilter, setCourseFilter] = useState("all")
  const [ruangFilter, setRuangFilter] = useState("all")
  const [deviceFilter, setDeviceFilter] = useState("all")

  const ruangOptions = useMemo(
    () => Array.from(new Set(devices.map((d) => d.ruang))),
    [devices]
  )

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (courseFilter !== "all" && event.courseId !== courseFilter) return false
      if (ruangFilter !== "all" && event.ruang !== ruangFilter) return false
      if (deviceFilter !== "all" && event.deviceId !== deviceFilter) return false
      return true
    })
  }, [events, courseFilter, ruangFilter, deviceFilter])

  const hasActiveFilter =
    courseFilter !== "all" || ruangFilter !== "all" || deviceFilter !== "all"

  return (
    <div className="flex flex-col gap-4">
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
                  : courses.find((c) => c.id === value)?.nama ?? "Mata kuliah"
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
          value={ruangFilter}
          onValueChange={(value) => setRuangFilter(value ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Ruang">
              {(value: string | null) =>
                !value || value === "all" ? "Semua Ruang" : value
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Ruang</SelectItem>
            {ruangOptions.map((ruang) => (
              <SelectItem key={ruang} value={ruang}>
                {ruang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={deviceFilter}
          onValueChange={(value) => setDeviceFilter(value ?? "all")}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Device">
              {(value: string | null) =>
                !value || value === "all"
                  ? "Semua Device"
                  : devices.find((d) => d.id === value)?.nama ?? "Device"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Device</SelectItem>
            {devices.map((device) => (
              <SelectItem key={device.id} value={device.id}>
                {device.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={Radio}
          title={hasActiveFilter ? "Tidak ada scan yang cocok" : "Belum ada aktivitas"}
          description={
            hasActiveFilter
              ? "Coba ubah atau reset filter."
              : "Simulator presensi belum berjalan."
          }
          className="border-none py-10"
        />
      ) : (
        <ul className="flex max-h-[600px] flex-col gap-2 overflow-y-auto pr-1">
          {filteredEvents.map((event) => {
            const isWarning = event.courseId
              ? getAttendanceSummary(event.studentId).find(
                  (s) => s.courseId === event.courseId
                )?.isWarning ?? false
              : false

            return (
              <li
                key={event.id}
                className={cn(
                  "animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border p-3 duration-300",
                  isWarning
                    ? "border-warning/40 bg-warning/5"
                    : "border-border bg-card"
                )}
              >
                <Avatar>
                  <AvatarFallback
                    className={isWarning ? "bg-warning/15 text-warning" : undefined}
                  >
                    {getInitials(event.studentNama)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{event.studentNama}</span>
                    {isWarning && (
                      <span className="inline-flex items-center gap-1 text-xs font-normal text-warning">
                        <AlertTriangle className="size-3" />
                        Perlu Perhatian
                      </span>
                    )}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    {event.courseNama}
                    <span className="text-muted-foreground/50">•</span>
                    <MapPin className="size-3" />
                    {event.ruang}
                    <span className="text-muted-foreground/50">•</span>
                    {event.deviceNama}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="success">Hadir</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.timestamp), "HH:mm:ss")}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
