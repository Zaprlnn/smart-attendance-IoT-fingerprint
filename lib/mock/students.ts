import type { Student } from "@/lib/types"
import { derivePassword } from "@/lib/mock/generators"

const SEMESTER_6_COURSES = ["C02", "C04", "C05"]
const SEMESTER_4_COURSES = ["C01", "C03", "C04"]

function student(
  data: Omit<Student, "password" | "email" | "prodi" | "enrolledCourseIds"> & {
    enrolledCourseIds?: string[]
  }
): Student {
  const enrolledCourseIds =
    data.enrolledCourseIds ??
    (data.semester >= 6 ? SEMESTER_6_COURSES : SEMESTER_4_COURSES)

  return {
    ...data,
    prodi: "Sistem Informasi",
    email: `${data.nim}@webmail.uad.ac.id`,
    password: derivePassword(data.nama),
    enrolledCourseIds,
  }
}

export const students: Student[] = [
  // Anggota tim — akun wajib
  student({
    id: "MHS001",
    nim: "2300016035",
    nama: "Alvindra Ramadhan",
    semester: 6,
    fingerprintEnrolled: true,
  }),
  student({
    id: "MHS002",
    nim: "2300016045",
    nama: "Muhammad Ibnu ZS",
    semester: 6,
    fingerprintEnrolled: true,
  }),
  student({
    id: "MHS003",
    nim: "2300016053",
    nama: "Ardiansyah",
    semester: 6,
    fingerprintEnrolled: true,
  }),

  // Mahasiswa semester 6 lainnya
  student({
    id: "MHS004",
    nim: "2300016012",
    nama: "Dewi Lestari Putri",
    semester: 6,
    fingerprintEnrolled: true,
  }),
  student({
    id: "MHS005",
    nim: "2300016019",
    nama: "Rizky Maulana Akbar",
    semester: 6,
    fingerprintEnrolled: true,
  }),
  student({
    id: "MHS006",
    nim: "2300016027",
    nama: "Putri Ayu Wulandari",
    semester: 6,
    fingerprintEnrolled: true,
  }),

  // Mahasiswa semester 4
  student({
    id: "MHS007",
    nim: "2400016008",
    nama: "Fajar Nur Hidayat",
    semester: 4,
    fingerprintEnrolled: true,
  }),
  student({
    id: "MHS008",
    nim: "2400016014",
    nama: "Anisa Rahmawati",
    semester: 4,
    fingerprintEnrolled: true,
  }),
  student({
    id: "MHS009",
    nim: "2400016021",
    nama: "Bayu Setiawan",
    semester: 4,
    fingerprintEnrolled: true,
  }),
  student({
    id: "MHS010",
    nim: "2400016030",
    nama: "Salsabila Putri Anggraini",
    semester: 4,
    fingerprintEnrolled: true,
  }),
  // Mahasiswa dengan kehadiran rendah (<75%) untuk memicu warning — lihat lib/mock/attendance.ts
  student({
    id: "MHS011",
    nim: "2400016038",
    nama: "Galih Pratama",
    semester: 4,
    fingerprintEnrolled: true,
  }),
  student({
    id: "MHS012",
    nim: "2400016044",
    nama: "Nadia Permata Sari",
    semester: 4,
    fingerprintEnrolled: false,
  }),
]
