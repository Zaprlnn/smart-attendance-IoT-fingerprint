"use client"

import { create } from "zustand"

import { students as baseStudents } from "@/lib/mock/students"
import type { Student } from "@/lib/types"

interface NewStudentInput {
  nama: string
  nim: string
  prodi: string
  semester: number
  email: string
  fingerprintEnrolled: boolean
}

interface StudentsState {
  students: Student[]
  registerStudent: (input: NewStudentInput) => Student
  enrollFingerprint: (studentId: string) => void
}

let nextSeq = baseStudents.length + 1

function deriveEnrolledCourses(semester: number): string[] {
  return semester >= 6 ? ["C02", "C04", "C05"] : ["C01", "C03", "C04"]
}

export const useStudentsStore = create<StudentsState>()((set) => ({
  students: baseStudents,
  registerStudent: (input) => {
    const id = `MHS${String(nextSeq++).padStart(3, "0")}`
    const student: Student = {
      id,
      nim: input.nim,
      nama: input.nama,
      password: input.nama.toLowerCase().replace(/\s+/g, ""),
      prodi: input.prodi,
      semester: input.semester,
      email: input.email,
      fingerprintEnrolled: input.fingerprintEnrolled,
      enrolledCourseIds: deriveEnrolledCourses(input.semester),
    }
    set((s) => ({ students: [...s.students, student] }))
    return student
  },
  enrollFingerprint: (studentId) => {
    set((s) => ({
      students: s.students.map((student) =>
        student.id === studentId
          ? { ...student, fingerprintEnrolled: true }
          : student
      ),
    }))
  },
}))

/** Mahasiswa mock dasar + mahasiswa yang baru didaftarkan dosen di sesi ini. */
export function useAllStudents(): Student[] {
  return useStudentsStore((s) => s.students)
}
