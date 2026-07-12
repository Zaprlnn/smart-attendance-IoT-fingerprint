"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Terjadi kesalahan
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Maaf, ada yang tidak berjalan semestinya. Coba muat ulang halaman ini.
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCcw />
        Coba Lagi
      </Button>
    </div>
  )
}
