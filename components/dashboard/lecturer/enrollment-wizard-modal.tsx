"use client"

import { useState } from "react"
import { Fingerprint, CheckCircle2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useStudentsStore } from "@/lib/stores/students-store"
import { devices } from "@/lib/mock"

interface EnrollmentWizardModalProps {
  studentId: string
  studentNama: string
}

type Step = "setup" | "scan1" | "lift" | "scan2" | "saving" | "success"

export function EnrollmentWizardModal({ studentId, studentNama }: EnrollmentWizardModalProps) {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>("setup")
  const [selectedDevice, setSelectedDevice] = useState("DEV01")
  const [fingerprintSlot, setFingerprintSlot] = useState(48) // Mock next slot
  const [progress, setProgress] = useState(0)

  const enrollFingerprint = useStudentsStore((s) => s.enrollFingerprint)

  const device = devices.find((d) => d.id === selectedDevice) ?? devices[0]

  function resetWizard() {
    setCurrentStep("setup")
    setProgress(0)
  }

  function startEnrollment() {
    setCurrentStep("scan1")
    setProgress(20)
  }

  function simulateScan1() {
    setCurrentStep("lift")
    setProgress(40)
    // Auto progress to scan2 after 1.5 seconds if user doesn't click
    const timer = setTimeout(() => {
      setCurrentStep("scan2")
      setProgress(60)
    }, 1500)
    return () => clearTimeout(timer)
  }

  function simulateScan2() {
    setCurrentStep("saving")
    setProgress(85)
    setTimeout(() => {
      setCurrentStep("success")
      setProgress(100)
      enrollFingerprint(studentId)
      toast.success("Sidik jari berhasil didaftarkan!", {
        description: `${studentNama} kini dapat melakukan presensi di device ${device.nama} Slot #${fingerprintSlot}.`
      })
    }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetWizard() }}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="mt-2 w-full border-primary/30 text-primary hover:bg-primary/5" />
      }>
        <Fingerprint className="size-4 mr-1" />
        Enroll Sidik Jari
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enrollment Sidik Jari</DialogTitle>
          <DialogDescription>
            Hubungkan ke modul sensor AS608 melalui ESP32 untuk mendaftarkan sidik jari {studentNama}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          
          {/* STEP 1: SETUP */}
          {currentStep === "setup" && (
            <div className="w-full space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Pilih Perangkat ESP32</label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama} ({d.ruang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">ID Slot Sensor (AS608)</label>
                <input
                  type="number"
                  value={fingerprintSlot}
                  onChange={(e) => setFingerprintSlot(Number(e.target.value))}
                  min={1}
                  max={127}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-[10px] text-muted-foreground">
                  AS608 mendukung penyimpanan internal 1 s/d 127 sidik jari.
                </span>
              </div>
            </div>
          )}

          {/* SCANNING & SIMULATION STEPS */}
          {currentStep !== "setup" && currentStep !== "success" && (
            <div className="flex flex-col items-center text-center space-y-4 w-full">
              <div className="relative flex size-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                {currentStep === "saving" ? (
                  <RefreshCw className="size-10 text-primary animate-spin" />
                ) : (
                  <Fingerprint className={`size-10 ${
                    currentStep === "scan1" || currentStep === "scan2" 
                      ? "text-blue-500 animate-pulse" 
                      : "text-slate-400"
                  }`} />
                )}
                
                {(currentStep === "scan1" || currentStep === "scan2") && (
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-25" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {currentStep === "scan1" && "Langkah 1: Tempelkan Jari"}
                  {currentStep === "lift" && "Bagus, Angkat Jari Anda"}
                  {currentStep === "scan2" && "Langkah 2: Tempelkan Jari Sekali Lagi"}
                  {currentStep === "saving" && "Menyimpan ke Flash AS608..."}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {currentStep === "scan1" && `Tempelkan jari mahasiswa pada sensor di ${device.nama}.`}
                  {currentStep === "lift" && "Biarkan sensor mengkalibrasi pembacaan pertama."}
                  {currentStep === "scan2" && "Posisikan jari yang sama untuk mengonfirmasi template."}
                  {currentStep === "saving" && "ESP32 sedang mengirimkan data template ke database lokal."}
                </p>
              </div>

              {/* Simulation Helper buttons so they don't get stuck */}
              <div className="pt-2">
                {currentStep === "scan1" && (
                  <Button size="sm" variant="secondary" onClick={simulateScan1}>
                    Simulasikan Sentuhan Jari
                  </Button>
                )}
                {currentStep === "lift" && (
                  <Button size="sm" variant="secondary" onClick={() => { setCurrentStep("scan2"); setProgress(60); }}>
                    Simulasikan Angkat Jari
                  </Button>
                )}
                {currentStep === "scan2" && (
                  <Button size="sm" variant="secondary" onClick={simulateScan2}>
                    Simulasikan Konfirmasi Jari
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* STEP: SUCCESS */}
          {currentStep === "success" && (
            <div className="flex flex-col items-center text-center space-y-4 w-full">
              <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500">
                <CheckCircle2 className="size-12" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Pendaftaran Sukses!</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Sidik jari {studentNama} telah terdaftar pada Slot ID <span className="font-semibold text-foreground">#{fingerprintSlot}</span> di perangkat <span className="font-semibold text-foreground">{device.nama}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Progress Bar for enrollment process */}
          {currentStep !== "setup" && (
            <div className="w-full mt-6 space-y-1 px-4">
              <Progress value={progress} className="h-1.5" />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>PROGRESS</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

        </div>

        <DialogFooter>
          {currentStep === "setup" ? (
            <Button onClick={startEnrollment} className="w-full">
              <Fingerprint className="size-4 mr-1" /> Mulai Pendaftaran
            </Button>
          ) : currentStep === "success" ? (
            <Button onClick={() => setOpen(false)} className="w-full">
              Selesai & Tutup
            </Button>
          ) : (
            <Button variant="ghost" onClick={resetWizard} className="w-full">
              Batal & Reset
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
