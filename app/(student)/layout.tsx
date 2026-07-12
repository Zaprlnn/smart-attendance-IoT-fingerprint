import { RoleGuard } from "@/components/role-guard"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard role="student">
      <DashboardShell role="student" areaLabel="Mahasiswa">
        {children}
      </DashboardShell>
    </RoleGuard>
  )
}
