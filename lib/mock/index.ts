import type {
  AttendanceRecord,
  AttendanceSummary,
  AuthResult,
  Course,
  CourseAttendanceDetail,
  Device,
  Lecturer,
  Session,
  Student,
} from "@/lib/types"

import { students } from "@/lib/mock/students"
import { lecturers } from "@/lib/mock/lecturers"
import { courses } from "@/lib/mock/courses"
import { sessions } from "@/lib/mock/sessions"
import { attendanceRecords } from "@/lib/mock/attendance"
import { devices, deviceForRoom } from "@/lib/mock/devices"
import { dayNameOf, toJakartaIsoDate } from "@/lib/mock/generators"

export { students, lecturers, courses, sessions, attendanceRecords, devices, deviceForRoom }

// ---------------------------------------------------------------------------
// Lookup dasar
// ---------------------------------------------------------------------------

export function getStudentById(studentId: string): Student | null {
  return students.find((s) => s.id === studentId) ?? null
}

export function getStudentByNim(nim: string): Student | null {
  return students.find((s) => s.nim === nim) ?? null
}

export function getLecturerById(lecturerId: string): Lecturer | null {
  return lecturers.find((l) => l.id === lecturerId) ?? null
}

export function getLecturerByNip(nip: string): Lecturer | null {
  return lecturers.find((l) => l.nip === nip) ?? null
}

export function getCourseById(courseId: string): Course | null {
  return courses.find((c) => c.id === courseId) ?? null
}

export function getCoursesByLecturer(lecturerId: string): Course[] {
  return courses.filter((c) => c.dosenId === lecturerId)
}

export function getStudentsByCourse(courseId: string): Student[] {
  return students.filter((s) => s.enrolledCourseIds.includes(courseId))
}

export function getSessionsByCourse(courseId: string): Session[] {
  return sessions
    .filter((s) => s.courseId === courseId)
    .sort((a, b) => a.pertemuanKe - b.pertemuanKe)
}

// ---------------------------------------------------------------------------
// Autentikasi mock
// ---------------------------------------------------------------------------

export function authenticate(
  username: string,
  password: string
): AuthResult | null {
  const student = students.find((s) => s.nim === username)
  if (student && student.password === password) {
    return { role: "student", user: student }
  }

  const lecturer = lecturers.find((l) => l.nip === username)
  if (lecturer && lecturer.password === password) {
    return { role: "lecturer", user: lecturer }
  }

  return null
}

// ---------------------------------------------------------------------------
// Presensi
// ---------------------------------------------------------------------------

export function getAttendanceSummary(studentId: string): AttendanceSummary[] {
  const student = getStudentById(studentId)
  if (!student) return []

  return student.enrolledCourseIds.map((courseId) => {
    const course = getCourseById(courseId)
    const records = attendanceRecords.filter(
      (r) => r.studentId === studentId && r.courseId === courseId
    )

    const hadir = records.filter((r) => r.status === "hadir").length
    const izin = records.filter((r) => r.status === "izin").length
    const sakit = records.filter((r) => r.status === "sakit").length
    const alpha = records.filter((r) => r.status === "alpha").length
    const totalSessions = records.length
    const persentaseHadir =
      totalSessions === 0 ? 0 : Math.round((hadir / totalSessions) * 100)

    return {
      courseId,
      courseNama: course?.nama ?? courseId,
      totalSessions,
      hadir,
      izin,
      sakit,
      alpha,
      persentaseHadir,
      isWarning: persentaseHadir < 75,
    }
  })
}

export function getCourseAttendance(
  studentId: string,
  courseId: string
): CourseAttendanceDetail[] {
  return getSessionsByCourse(courseId).map((session) => ({
    session,
    record:
      attendanceRecords.find(
        (r) =>
          r.studentId === studentId &&
          r.courseId === courseId &&
          r.sessionId === session.id
      ) ?? null,
  }))
}

export function getCourseAttendanceForAllStudents(
  courseId: string,
  sessionId: string
): { student: Student; record: AttendanceRecord | null }[] {
  return getStudentsByCourse(courseId).map((student) => ({
    student,
    record:
      attendanceRecords.find(
        (r) =>
          r.studentId === student.id &&
          r.courseId === courseId &&
          r.sessionId === sessionId
      ) ?? null,
  }))
}

// ---------------------------------------------------------------------------
// Jadwal & aktivitas realtime
// ---------------------------------------------------------------------------

export function getTodayCourses(
  date: Date = new Date()
): { course: Course; session: Session }[] {
  const todayIso = toJakartaIsoDate(date)

  return sessions
    .filter((s) => s.tanggal === todayIso)
    .map((session) => {
      const course = getCourseById(session.courseId)
      return course ? { course, session } : null
    })
    .filter((entry): entry is { course: Course; session: Session } => entry !== null)
}

/** Hari (nama Indonesia) dari sebuah tanggal — dipakai untuk menampilkan jadwal mingguan. */
export { dayNameOf }

export function getRecentScans(limit = 10): AttendanceRecord[] {
  return [...attendanceRecords]
    .filter((r) => r.method === "fingerprint")
    .sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, limit)
}

export function getDeviceStatus(): Device[] {
  return devices
}
