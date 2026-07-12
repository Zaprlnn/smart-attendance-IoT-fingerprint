import { CalendarDays } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { EmptyState } from "@/components/dashboard/empty-state"

export default function StudentJadwalPage() {
  return (
    <>
      <PageHeader
        title="Jadwal"
        description="Jadwal kuliah mingguanmu."
      />
      <EmptyState
        icon={CalendarDays}
        title="Jadwal segera hadir"
        description="Jadwal mata kuliah per hari akan ditampilkan di sini."
      />
    </>
  )
}
