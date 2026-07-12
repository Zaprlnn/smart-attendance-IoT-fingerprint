import { Fingerprint, GraduationCap, Radio } from "lucide-react"

import { SensorNetworkCanvas } from "@/components/login/sensor-network-canvas"

const FEATURES = [
  {
    icon: Fingerprint,
    title: "Presensi Fingerprint",
    description: "Tempel jari di sensor AS608, kehadiran langsung tercatat.",
  },
  {
    icon: Radio,
    title: "Realtime",
    description: "Pantau scan masuk secara live dari ESP32 ke dashboard.",
  },
  {
    icon: GraduationCap,
    title: "Akademik UAD",
    description: "Terhubung dengan jadwal, mata kuliah, dan rekap kehadiran.",
  },
]

export function BrandPanel() {
  return (
    <>
      {/* Header ringkas untuk mobile — panel brand penuh hanya tampil di layar lg+. */}
      <div className="flex items-center justify-between gap-3 bg-[#0f2a3f] px-6 py-5 text-[#e7f1ef] lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Fingerprint className="size-4" />
          </span>
          <span className="font-display text-base font-semibold">
            Smart Attendance
          </span>
        </div>
        <span className="text-xs text-[#a9c4bf]">UAD &middot; Sistem Informasi</span>
      </div>

      <div className="relative isolate hidden h-full flex-col justify-between overflow-hidden bg-[#0f2a3f] px-8 py-10 text-[#e7f1ef] lg:flex sm:px-12">
        <SensorNetworkCanvas />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a171f]/90 via-[#0f2a3f]/40 to-[#0a171f]/60" />

        <div className="relative z-10 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Fingerprint className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold">
            Smart Attendance
          </span>
        </div>

        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Presensi kampus,
              <br />
              secepat sidik jari.
            </h1>
            <p className="max-w-sm text-sm text-[#cfe6e1]">
              Sistem presensi IoT untuk Universitas Ahmad Dahlan — sidik jari,
              tercatat, terpantau realtime.
            </p>
          </div>

          <ul className="flex flex-col gap-4">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-primary ring-1 ring-white/15">
                  <feature.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">
                    {feature.title}
                  </p>
                  <p className="text-xs text-[#a9c4bf]">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
