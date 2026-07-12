import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Fingerprint,
  History,
  LayoutDashboard,
  Radio,
  Router,
  UserRound,
  Users,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export const STUDENT_NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/mahasiswa/dashboard", icon: LayoutDashboard },
  { title: "Presensi Realtime", href: "/mahasiswa/presensi", icon: Fingerprint },
  { title: "Mata Kuliah", href: "/mahasiswa/mata-kuliah", icon: BookOpen },
  { title: "Riwayat", href: "/mahasiswa/riwayat", icon: History },
  { title: "Jadwal", href: "/mahasiswa/jadwal", icon: CalendarDays },
  { title: "Profil", href: "/mahasiswa/profil", icon: UserRound },
]

export const LECTURER_NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dosen/dashboard", icon: LayoutDashboard },
  { title: "Monitoring Realtime", href: "/dosen/monitoring", icon: Radio },
  { title: "Rekap Presensi", href: "/dosen/rekap", icon: ClipboardList },
  {
    title: "Mata Kuliah Hari Ini",
    href: "/dosen/mata-kuliah-hari-ini",
    icon: CalendarCheck,
  },
  { title: "Mahasiswa", href: "/dosen/mahasiswa", icon: Users },
  { title: "Perangkat", href: "/dosen/perangkat", icon: Router },
  { title: "Profil", href: "/dosen/profil", icon: UserRound },
]
