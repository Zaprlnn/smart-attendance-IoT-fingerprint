import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"

const colorSwatches: {
  label: string
  variable: string
  bg: string
  fg: string
  border?: boolean
}[] = [
  { label: "Background", variable: "--background", bg: "bg-background", fg: "text-foreground", border: true },
  { label: "Card", variable: "--card", bg: "bg-card", fg: "text-card-foreground", border: true },
  { label: "Primary", variable: "--primary", bg: "bg-primary", fg: "text-primary-foreground" },
  { label: "Primary Soft", variable: "--primary-soft", bg: "bg-primary-soft", fg: "text-primary-soft-foreground", border: true },
  { label: "Secondary", variable: "--secondary", bg: "bg-secondary", fg: "text-secondary-foreground", border: true },
  { label: "Muted", variable: "--muted", bg: "bg-muted", fg: "text-muted-foreground", border: true },
  { label: "Accent", variable: "--accent", bg: "bg-accent", fg: "text-accent-foreground", border: true },
  { label: "Success", variable: "--success", bg: "bg-success", fg: "text-success-foreground" },
  { label: "Warning", variable: "--warning", bg: "bg-warning", fg: "text-warning-foreground" },
  { label: "Destructive", variable: "--destructive", bg: "bg-destructive", fg: "text-destructive-foreground" },
  { label: "Sidebar", variable: "--sidebar", bg: "bg-sidebar", fg: "text-sidebar-foreground" },
]

export default function StyleguidePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Design System</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Smart Attendance UAD — Styleguide
          </h1>
          <p className="text-sm text-muted-foreground">
            Verifikasi visual token warna, tipografi, dan komponen di mode terang & gelap.
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Color tokens */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold">Color Tokens</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {colorSwatches.map((swatch) => (
            <div
              key={swatch.variable}
              className={`flex h-24 flex-col justify-between rounded-xl p-3 shadow-soft ${swatch.bg} ${swatch.fg} ${
                swatch.border ? "ring-1 ring-border" : ""
              }`}
            >
              <span className="text-xs font-medium">{swatch.label}</span>
              <code className="text-[10px] opacity-80">{swatch.variable}</code>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Typography */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold">Typography</h2>
        <div className="flex flex-col gap-3">
          <p className="font-display text-5xl font-semibold tracking-tight">98.5%</p>
          <p className="text-sm text-muted-foreground">
            Display font (Sora) — dipakai untuk angka besar &amp; heading dashboard.
          </p>
          <Separator className="my-2" />
          <p className="font-sans text-base">
            Body text menggunakan Plus Jakarta Sans — nyaman dibaca untuk paragraf,
            label, dan komponen UI sehari-hari.
          </p>
          <p className="font-mono text-sm text-muted-foreground">
            ESP32-D9F1A2 · MAC 24:6F:28:AE:11:09 (font mono untuk ID perangkat)
          </p>
        </div>
      </section>

      <Separator />

      {/* Buttons */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <Separator />

      {/* Badges */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold">Status Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Hadir</Badge>
          <Badge variant="warning">Terlambat</Badge>
          <Badge variant="destructive">Alpha</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      <Separator />

      {/* Cards */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold">Cards</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Kehadiran Hari Ini</CardTitle>
              <CardDescription>Pemrograman Web — Kelas A</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-semibold">42/45</p>
              <p className="text-sm text-muted-foreground">Mahasiswa hadir</p>
            </CardContent>
          </Card>

          <Card className="gradient-teal border-none shadow-soft-lg">
            <CardHeader>
              <CardTitle className="text-current">Rata-rata Kehadiran</CardTitle>
              <CardDescription className="text-current/80">
                Semester Genap 2025/2026
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-semibold">93.2%</p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-soft">
            <CardHeader>
              <CardTitle>Perangkat ESP32</CardTitle>
              <CardDescription>Lab IoT — Gedung F</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="success">Online</Badge>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
