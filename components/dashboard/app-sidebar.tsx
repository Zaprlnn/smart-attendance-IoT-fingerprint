"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fingerprint } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { LECTURER_NAV_ITEMS, STUDENT_NAV_ITEMS } from "@/lib/dashboard/nav-config"
import type { UserRole } from "@/lib/types"

interface AppSidebarProps {
  role: UserRole
}

// Komponen ikon Lucide tidak boleh dikirim sebagai prop lintas server/client
// boundary (tidak serializable) — karena itu AppSidebar mengambil sendiri
// daftar navigasi via import, hanya menerima `role` (string) dari server.
export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname()
  const navItems = role === "student" ? STUDENT_NAV_ITEMS : LECTURER_NAV_ITEMS

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Fingerprint className="size-4" />
              </span>
              <span className="font-display text-sm font-semibold">
                Smart Attendance
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className="data-active:!text-primary [&[data-active]_svg]:!text-primary"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
