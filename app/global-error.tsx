"use client"

import { useEffect } from "react"
import { AlertOctagon } from "lucide-react"

import "./globals.css"

export default function GlobalError({
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
    <html lang="id">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground antialiased">
        <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertOctagon className="size-7" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Aplikasi mengalami gangguan
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Terjadi kesalahan fatal yang tidak terduga. Coba muat ulang aplikasi.
          </p>
        </div>
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Muat Ulang
        </button>
      </body>
    </html>
  )
}
