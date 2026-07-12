import type { Lecturer } from "@/lib/types"
import { derivePassword } from "@/lib/mock/generators"

function lecturer(data: Omit<Lecturer, "password">): Lecturer {
  return { ...data, password: derivePassword(data.nama) }
}

export const lecturers: Lecturer[] = [
  lecturer({
    id: "DSN001",
    nip: "60880123",
    nama: "Hendro Wicaksono",
    email: "hendro.wicaksono@uad.ac.id",
  }),
  lecturer({
    id: "DSN002",
    nip: "60910256",
    nama: "Siti Maryam Hidayati",
    email: "siti.hidayati@uad.ac.id",
  }),
  lecturer({
    id: "DSN003",
    nip: "60950341",
    nama: "Bambang Sutopo",
    email: "bambang.sutopo@uad.ac.id",
  }),
]
