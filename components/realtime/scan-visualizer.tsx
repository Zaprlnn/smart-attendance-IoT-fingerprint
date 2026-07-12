import { Fingerprint } from "lucide-react"

interface ScanVisualizerProps {
  isActive: boolean
  /** Increment setiap kali scan baru terjadi untuk memicu efek ripple satu-kali. */
  burstKey: number
}

/**
 * Hero "scan visualizer" — murni CSS (animate-ping bawaan Tailwind + keyframe
 * scan-burst kustom), tanpa timer JS sama sekali sehingga tidak ada risiko
 * memory leak dari komponen ini.
 */
export function ScanVisualizer({ isActive, burstKey }: ScanVisualizerProps) {
  return (
    <div
      className="relative flex size-40 shrink-0 items-center justify-center sm:size-48"
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-full bg-primary/10" />

      {isActive && (
        <>
          <span
            className="absolute inset-4 rounded-full bg-primary/15 animate-ping"
            style={{ animationDuration: "2.4s" }}
          />
          <span
            className="absolute inset-8 rounded-full bg-primary/20 animate-ping"
            style={{ animationDuration: "2.4s", animationDelay: "0.6s" }}
          />
        </>
      )}

      {burstKey > 0 && (
        <span
          key={burstKey}
          className="absolute inset-10 rounded-full bg-primary/40 animate-scan-burst"
        />
      )}

      <span className="relative flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft-lg sm:size-24">
        <Fingerprint className="size-10 sm:size-12" />
      </span>
    </div>
  )
}
