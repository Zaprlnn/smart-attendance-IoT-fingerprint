"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, Search } from "lucide-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuthStore, useCurrentUser } from "@/lib/stores/auth-store"
import { LECTURER_NAV_ITEMS, STUDENT_NAV_ITEMS } from "@/lib/dashboard/nav-config"
import { getInitials } from "@/lib/utils"
import type { UserRole } from "@/lib/types"

interface DashboardTopbarProps {
  role: UserRole
  areaLabel: string
}

export function DashboardTopbar({ role, areaLabel }: DashboardTopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const currentUser = useCurrentUser()
  const logout = useAuthStore((s) => s.logout)
  const [searchOpen, setSearchOpen] = useState(false)
  const navItems = role === "student" ? STUDENT_NAV_ITEMS : LECTURER_NAV_ITEMS

  const currentPage =
    navItems.find((item) => item.href === pathname)?.title ?? "Dashboard"

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  function goTo(href: string) {
    setSearchOpen(false)
    router.push(href)
  }

  function handleLogout() {
    logout()
    router.push("/login")
  }

  const identifierLabel = currentUser && "nim" in currentUser ? "NIM" : "NIP"
  const identifierValue = currentUser
    ? "nim" in currentUser
      ? currentUser.nim
      : currentUser.nip
    : ""

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />

      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <span className="truncate text-muted-foreground">{areaLabel}</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="truncate font-medium">{currentPage}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setSearchOpen(true)}
        className="hidden text-muted-foreground sm:inline-flex"
      >
        <Search />
        Cari
        <kbd className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => setSearchOpen(true)}
        className="text-muted-foreground sm:hidden"
        aria-label="Cari"
      >
        <Search />
      </Button>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Menu akun"
          className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Avatar>
            <AvatarFallback>
              {currentUser ? getInitials(currentUser.nama) : "?"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5 py-1.5">
              <span className="text-sm font-medium text-foreground">
                {currentUser?.nama ?? "Pengguna"}
              </span>
              <span className="text-xs text-muted-foreground">
                {identifierLabel} {identifierValue}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            <LogOut />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Cari halaman"
        description="Lompat ke halaman lain di dashboard"
      >
        <Command>
          <CommandInput placeholder="Cari halaman..." />
          <CommandList>
            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
            <CommandGroup heading={areaLabel}>
              {navItems.map((item) => (
                <CommandItem
                  key={item.href}
                  value={item.title}
                  onSelect={() => goTo(item.href)}
                >
                  <item.icon />
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </header>
  )
}
