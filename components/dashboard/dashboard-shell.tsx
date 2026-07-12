import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar"
import { PageTransition } from "@/components/dashboard/page-transition"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { UserRole } from "@/lib/types"

interface DashboardShellProps {
  role: UserRole
  areaLabel: string
  children: React.ReactNode
}

export function DashboardShell({
  role,
  areaLabel,
  children,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar role={role} />
      <SidebarInset>
        <DashboardTopbar role={role} areaLabel={areaLabel} />
        <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
          <PageTransition>{children}</PageTransition>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
