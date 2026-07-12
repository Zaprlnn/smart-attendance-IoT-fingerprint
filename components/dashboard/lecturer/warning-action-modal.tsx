"use client"

import { useState } from "react"
import { AlertTriangle, Mail, MessageSquare, ShieldAlert, Sparkles } from "lucide-react"
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

interface WarningActionModalProps {
  studentNama: string
  studentNim: string
  courseNama: string
  persentaseHadir: number
}

export function WarningActionModal({
  studentNama,
  studentNim,
  courseNama,
  persentaseHadir,
}: WarningActionModalProps) {
  const [open, setOpen] = useState(false)

  // Generate Message Templates
  const getWhatsAppMessage = () => {
    return `Halo *${studentNama}* (${studentNim}), kami memonitor tingkat kehadiran Anda pada mata kuliah *${courseNama}* saat ini adalah *${persentaseHadir}%*. Batas minimal kelayakan mengikuti ujian akhir adalah *75%*. Mohon segera menemui dosen wali atau lengkapi kehadiran Anda pada sesi kuliah berikutnya. Terima kasih.`
  }

  const getEmailSubject = () => {
    return `[Peringatan Akademik] Kehadiran Kelas ${courseNama} - ${studentNama}`
  }

  const getEmailBody = () => {
    return `Yth. ${studentNama},\n\nMelalui email ini, kami menginformasikan bahwa tingkat presensi kehadiran Anda pada mata kuliah ${courseNama} saat ini berada di angka ${persentaseHadir}%, yang mana di bawah batas minimal kelulusan/syarat ujian Universitas Ahmad Dahlan yaitu 75%.\n\nHarap segera menindaklanjuti peringatan ini dengan hadir secara tertib pada sesi kuliah berikutnya.\n\nSalam Akademik,\nDashboard Smart Attendance UAD`
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(getWhatsAppMessage())
    window.open(`https://wa.me/?text=${text}`, "_blank")
    toast.success("Membuka WhatsApp Web...")
  }

  const handleMail = () => {
    const subject = encodeURIComponent(getEmailSubject())
    const body = encodeURIComponent(getEmailBody())
    window.location.href = `mailto:${studentNim}@webmail.uad.ac.id?subject=${subject}&body=${body}`
    toast.success("Membuka Aplikasi Email...")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="border-warning/50 text-warning-foreground hover:bg-warning/10" />
      }>
        Tindakan
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning-foreground">
            <AlertTriangle className="size-5" /> Deteksi Dini Kritis
          </DialogTitle>
          <DialogDescription>
            Tindakan cepat dan rekomendasi untuk mahasiswa di bawah batas kehadiran 75%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student Status Summary Card */}
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-foreground text-sm">{studentNama}</p>
                <p className="text-xs text-muted-foreground">NIM: {studentNim}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-warning/25 text-warning-foreground">
                {persentaseHadir}% Hadir
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Mata Kuliah: <span className="font-medium text-foreground">{courseNama}</span>
            </p>
          </div>

          {/* AI/Smart Recommendations */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-primary">
              <Sparkles className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Rekomendasi Sistem</span>
            </div>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1.5">
              <li>Berikan <span className="font-semibold text-foreground">peringatan langsung</span> melalui WhatsApp / Email agar mahasiswa sadar statusnya.</li>
              <li>Tawarkan <span className="font-semibold text-foreground">tugas kompensasi</span> jika alasan ketidakhadiran valid (sakit/surat resmi).</li>
              <li>Ingatkan mahasiswa untuk selalu mencatat scan sidik jari di awal jam kuliah.</li>
            </ul>
          </div>

          {/* Warning Channel Options */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kirim Peringatan Langsung</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2 h-10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10"
                onClick={handleWhatsApp}
              >
                <MessageSquare className="size-4" /> WhatsApp
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-10 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/5 dark:hover:bg-blue-500/10"
                onClick={handleMail}
              >
                <Mail className="size-4" /> Kirim Email
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between items-center text-[10px] text-muted-foreground border-t pt-4">
          <span className="flex items-center gap-1">
            <ShieldAlert className="size-3" /> Rekap audit log diperbarui secara otomatis.
          </span>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
