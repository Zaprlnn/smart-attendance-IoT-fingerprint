import type { AttendanceRecord, AttendanceStatus } from "@/lib/types"
import { students } from "@/lib/mock/students"
import { courses } from "@/lib/mock/courses"
import { sessions } from "@/lib/mock/sessions"
import { deviceForRoom } from "@/lib/mock/devices"
import { seededRandom } from "@/lib/mock/generators"

/** Pasangan (studentId, courseId) yang sengaja dibuat kehadirannya rendah (<75%). */
const LOW_ATTENDANCE_OVERRIDE: { studentId: string; courseId: string } = {
  studentId: "MHS011", // Galih Pratama
  courseId: "C03", // Basis Data
}

function pickStatus(rng: () => number): AttendanceStatus {
  const r = rng()
  if (r < 0.82) return "hadir"
  if (r < 0.88) return "izin"
  if (r < 0.94) return "sakit"
  return "alpha"
}

function buildRecord(
  studentId: string,
  courseId: string,
  sessionId: string,
  tanggal: string,
  jamMulai: string,
  ruang: string,
  status: AttendanceStatus
): AttendanceRecord {
  const device = deviceForRoom(ruang)
  const isFingerprintScan = status === "hadir" && device.status === "online"
  const rng = seededRandom(`${studentId}-${sessionId}-offset`)
  const offsetMinutes = isFingerprintScan ? Math.round(rng() * 15) : 0
  const timestamp = new Date(`${tanggal}T${jamMulai}:00+07:00`)
  timestamp.setMinutes(timestamp.getMinutes() + offsetMinutes)

  return {
    id: `ATT-${studentId}-${sessionId}`,
    studentId,
    courseId,
    sessionId,
    timestamp: timestamp.toISOString(),
    status,
    method: isFingerprintScan ? "fingerprint" : "manual",
    deviceId: device.id,
  }
}

function generateAttendanceForStudent(
  studentId: string,
  courseId: string
): AttendanceRecord[] {
  const course = courses.find((c) => c.id === courseId)
  if (!course) return []

  const pastSessions = sessions.filter(
    (s) => s.courseId === courseId && s.status !== "akan-datang"
  )

  const isLowAttendancePair =
    LOW_ATTENDANCE_OVERRIDE.studentId === studentId &&
    LOW_ATTENDANCE_OVERRIDE.courseId === courseId

  return pastSessions.map((session, index) => {
    const rng = seededRandom(`${studentId}-${session.id}`)
    let status = pickStatus(rng)

    if (isLowAttendancePair) {
      // Paksa rasio hadir < 75%: alpha-kan setengah dari pertemuan.
      status = index % 2 === 0 ? "alpha" : status
    }

    return buildRecord(
      studentId,
      courseId,
      session.id,
      session.tanggal,
      course.jadwal.jamMulai,
      course.jadwal.ruang,
      status
    )
  })
}

export const attendanceRecords: AttendanceRecord[] = students.flatMap(
  (student) =>
    student.enrolledCourseIds.flatMap((courseId) =>
      generateAttendanceForStudent(student.id, courseId)
    )
)
