"use client"

import { useId, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Sparkles } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/login/password-input"
import { useAuthStore } from "@/lib/stores/auth-store"

type RoleTab = "mahasiswa" | "dosen"

interface FieldState {
  identifier: string
  password: string
}

interface FieldErrors {
  identifier?: string
  password?: string
}

// Akun demo — lihat README (password = nama lengkap, huruf kecil tanpa spasi).
const DEMO_STUDENT = { nim: "2300016035", password: "alvindraramadhan" }
const DEMO_LECTURER = { nip: "60880123", password: "hendrowicaksono" }

const DASHBOARD_BY_ROLE: Record<"student" | "lecturer", string> = {
  student: "/mahasiswa/dashboard",
  lecturer: "/dosen/dashboard",
}

function validate(
  identifier: string,
  password: string,
  identifierLabel: string
): FieldErrors {
  const errors: FieldErrors = {}
  if (!identifier.trim()) {
    errors.identifier = `${identifierLabel} wajib diisi.`
  } else if (!/^\d+$/.test(identifier.trim())) {
    errors.identifier = `${identifierLabel} hanya berisi angka.`
  }
  if (!password) {
    errors.password = "Password wajib diisi."
  }
  return errors
}

export function LoginForm() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const formId = useId()

  const [activeTab, setActiveTab] = useState<RoleTab>("mahasiswa")
  const [mahasiswa, setMahasiswa] = useState<FieldState>({
    identifier: "",
    password: "",
  })
  const [dosen, setDosen] = useState<FieldState>({
    identifier: "",
    password: "",
  })
  const [mahasiswaErrors, setMahasiswaErrors] = useState<FieldErrors>({})
  const [dosenErrors, setDosenErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function fillDemoAccount() {
    if (activeTab === "mahasiswa" && DEMO_STUDENT) {
      setMahasiswa({
        identifier: DEMO_STUDENT.nim,
        password: DEMO_STUDENT.password,
      })
      setMahasiswaErrors({})
    } else if (activeTab === "dosen" && DEMO_LECTURER) {
      setDosen({
        identifier: DEMO_LECTURER.nip,
        password: DEMO_LECTURER.password,
      })
      setDosenErrors({})
    }
  }

  function handleSubmit(role: RoleTab) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      const field = role === "mahasiswa" ? mahasiswa : dosen
      const label = role === "mahasiswa" ? "NIM" : "NIP"
      const errors = validate(field.identifier, field.password, label)

      if (role === "mahasiswa") setMahasiswaErrors(errors)
      else setDosenErrors(errors)

      if (Object.keys(errors).length > 0) return

      setIsSubmitting(true)
      const backendRole = role === "mahasiswa" ? "student" : "lecturer"
      login(backendRole, field.identifier.trim(), field.password)
        .then((result) => {
          if (!result) {
            toast.error("Login gagal", {
              description: `${label} atau password salah.`,
            })
            return
          }
          toast.success(`Selamat datang, ${result.user.nama}`)
          router.push(DASHBOARD_BY_ROLE[result.role])
        })
        .catch(() => {
          toast.error("Login gagal", { description: "Tidak bisa terhubung ke server." })
        })
        .finally(() => setIsSubmitting(false))
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-soft-lg">
      <CardHeader>
        <CardTitle className="font-display text-xl">Masuk</CardTitle>
        <CardDescription>
          Gunakan akun mahasiswa atau dosen untuk mengakses dashboard presensi.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as RoleTab)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="mahasiswa">Mahasiswa</TabsTrigger>
            <TabsTrigger value="dosen">Dosen</TabsTrigger>
          </TabsList>

          <TabsContent value="mahasiswa">
            <form
              className="flex flex-col gap-4 pt-4"
              onSubmit={handleSubmit("mahasiswa")}
              noValidate
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-nim`}>NIM</Label>
                <Input
                  id={`${formId}-nim`}
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="2300016035"
                  value={mahasiswa.identifier}
                  aria-invalid={Boolean(mahasiswaErrors.identifier)}
                  aria-describedby={
                    mahasiswaErrors.identifier ? `${formId}-nim-error` : undefined
                  }
                  onChange={(e) =>
                    setMahasiswa((s) => ({ ...s, identifier: e.target.value }))
                  }
                />
                {mahasiswaErrors.identifier && (
                  <p id={`${formId}-nim-error`} className="text-xs text-destructive">
                    {mahasiswaErrors.identifier}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-mhs-password`}>Password</Label>
                <PasswordInput
                  id={`${formId}-mhs-password`}
                  autoComplete="current-password"
                  value={mahasiswa.password}
                  invalid={Boolean(mahasiswaErrors.password)}
                  aria-describedby={`${formId}-mhs-password-hint`}
                  onChange={(value) =>
                    setMahasiswa((s) => ({ ...s, password: value }))
                  }
                />
                {mahasiswaErrors.password ? (
                  <p id={`${formId}-mhs-password-hint`} className="text-xs text-destructive">
                    {mahasiswaErrors.password}
                  </p>
                ) : (
                  <p id={`${formId}-mhs-password-hint`} className="text-xs text-muted-foreground">
                    Password = nama lengkap, huruf kecil tanpa spasi.
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting} className="mt-1">
                {isSubmitting && <Loader2 className="animate-spin" />}
                Masuk sebagai Mahasiswa
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="dosen">
            <form
              className="flex flex-col gap-4 pt-4"
              onSubmit={handleSubmit("dosen")}
              noValidate
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-nip`}>NIP</Label>
                <Input
                  id={`${formId}-nip`}
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="60880123"
                  value={dosen.identifier}
                  aria-invalid={Boolean(dosenErrors.identifier)}
                  aria-describedby={
                    dosenErrors.identifier ? `${formId}-nip-error` : undefined
                  }
                  onChange={(e) =>
                    setDosen((s) => ({ ...s, identifier: e.target.value }))
                  }
                />
                {dosenErrors.identifier && (
                  <p id={`${formId}-nip-error`} className="text-xs text-destructive">
                    {dosenErrors.identifier}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-dsn-password`}>Password</Label>
                <PasswordInput
                  id={`${formId}-dsn-password`}
                  autoComplete="current-password"
                  value={dosen.password}
                  invalid={Boolean(dosenErrors.password)}
                  aria-describedby={`${formId}-dsn-password-hint`}
                  onChange={(value) =>
                    setDosen((s) => ({ ...s, password: value }))
                  }
                />
                {dosenErrors.password ? (
                  <p id={`${formId}-dsn-password-hint`} className="text-xs text-destructive">
                    {dosenErrors.password}
                  </p>
                ) : (
                  <p id={`${formId}-dsn-password-hint`} className="text-xs text-muted-foreground">
                    Password = nama dosen, huruf kecil tanpa spasi.
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting} className="mt-1">
                {isSubmitting && <Loader2 className="animate-spin" />}
                Masuk sebagai Dosen
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={fillDemoAccount}
          className="text-muted-foreground"
        >
          <Sparkles />
          Isi akun demo
        </Button>
      </CardFooter>
    </Card>
  )
}
