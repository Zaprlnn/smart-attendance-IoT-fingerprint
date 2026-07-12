import Link from "next/link"
import { CompassIcon, Fingerprint } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="relative flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Fingerprint className="size-7" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Halaman tidak ditemukan
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sidik jari halaman ini belum terdaftar di sistem kami — coba kembali ke
          dashboard.
        </p>
      </div>
      <Button render={<Link href="/" />} nativeButton={false}>
        <CompassIcon />
        Kembali ke Beranda
      </Button>
    </div>
  )
}
