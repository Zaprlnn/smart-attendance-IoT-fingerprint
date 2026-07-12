import { RoleGuard } from "@/components/role-guard"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default function DosenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard role="lecturer">
      <DashboardShell role="lecturer" areaLabel="Dosen">
        {children}
      </DashboardShell>
    </RoleGuard>
  )
}
