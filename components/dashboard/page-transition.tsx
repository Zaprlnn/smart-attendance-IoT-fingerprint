"use client"

import { usePathname } from "next/navigation"

/** Re-keys its children on route change so the new page fades/rises in
 * instead of snapping in — a soft transition without a motion dependency. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="flex flex-1 flex-col gap-6 animate-fade-up">
      {children}
    </div>
  )
}
