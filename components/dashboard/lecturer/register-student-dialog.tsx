"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { FingerprintEnroll } from "@/components/dashboard/lecturer/fingerprint-enroll"

const PRODI_OPTIONS = [
  "Sistem Informasi",
  "Informatika",
  "Teknik Elektro",
  "Teknik Industri",
]

const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]

const EMPTY_FORM = {
  nama: "",
  nim: "",
  prodi: PRODI_OPTIONS[0],
  semester: "4",
  email: "",
}

export function RegisterStudentDialog() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [fingerprintDone, setFingerprintDone] = useState(false)
  const [commandId, setCommandId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isFormValid =
    form.nama.trim() !== "" && form.nim.trim() !== "" && form.email.trim() !== ""

  function resetAndClose() {
    setForm(EMPTY_FORM)
    setFingerprintDone(false)
    setCommandId(null)
    setLoading(false)
    setOpen(false)
  }

  async function handleStartEnroll() {
    if (!isFormValid) return
    setLoading(true)

    try {
      const res = await apiFetch<{ ok: true; commandId: string }>("/mahasiswa", {
        method: "POST",
        body: JSON.stringify({
          nama: form.nama.trim(),
          nim: form.nim.trim(),
          prodi: form.prodi,
          semester: Number(form.semester),
          email: form.email.trim(),
        }),
      })
      setCommandId(res.commandId)
    } catch (err) {
      toast.error("Error", { description: err instanceof Error ? err.message : String(err) })
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit() {
    if (!isFormValid || !fingerprintDone) return
    toast.success("Mahasiswa berhasil didaftarkan", {
      description: `${form.nama} (${form.nim}) tersimpan ke database.`,
    })
    resetAndClose()
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? setOpen(true) : resetAndClose())}>
      <SheetTrigger render={<Button />}>
        <UserPlus />
        Daftarkan Mahasiswa Baru
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Daftarkan Mahasiswa Baru</SheetTitle>
          <SheetDescription>
            Data akan disimpan langsung ke Supabase dan mengirim perintah ke ESP32 secara realtime.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reg-nama">Nama Lengkap</Label>
            <Input
              id="reg-nama"
              placeholder="cth. Dian Permatasari"
              value={form.nama}
              onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reg-nim">NIM</Label>
            <Input
              id="reg-nim"
              placeholder="cth. 2400016050"
              value={form.nim}
              onChange={(e) => setForm((f) => ({ ...f, nim: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Prodi</Label>
              <Select
                value={form.prodi}
                onValueChange={(v) => setForm((f) => ({ ...f, prodi: v ?? f.prodi }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODI_OPTIONS.map((prodi) => (
                    <SelectItem key={prodi} value={prodi}>
                      {prodi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Semester</Label>
              <Select
                value={form.semester}
                onValueChange={(v) => setForm((f) => ({ ...f, semester: v ?? f.semester }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTER_OPTIONS.map((semester) => (
                    <SelectItem key={semester} value={String(semester)}>
                      Semester {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="cth. mahasiswa@webmail.uad.ac.id"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <FingerprintEnroll 
            onEnrolled={() => setFingerprintDone(true)} 
            commandId={commandId}
            onStartEnroll={handleStartEnroll}
          />
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose render={<Button variant="outline" />}>Batal</SheetClose>
          <Button disabled={loading || !isFormValid || !fingerprintDone} onClick={handleSubmit}>
            Simpan Mahasiswa
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
