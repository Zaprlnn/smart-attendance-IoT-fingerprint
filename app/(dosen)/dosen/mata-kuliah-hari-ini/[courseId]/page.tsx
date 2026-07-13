"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Fingerprint, MapPin, Square, Users } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/section-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiFetch } from "@/lib/api-client"
import { usePresensiBySesiRealtime } from "@/lib/realtime/use-presensi-realtime"
import type { Course, LiveRosterEntry, RosterEntry, Session, SesiHariIni } from "@/lib/types"

const DURASI_OPTIONS = [5, 10, 15, 30]

function PresensiMandiriControl({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(true)
  const [sesi, setSesi] = useState<SesiHariIni | null>(null)
  const [liveRoster, setLiveRoster] = useState<LiveRosterEntry[]>([])
  const [topik, setTopik] = useState("")
  const [durasiMenit, setDurasiMenit] = useState(5)
  const [busy, setBusy] = useState(false)
  const [sisaDetik, setSisaDetik] = useState(0)

  const { rows: liveRows } = usePresensiBySesiRealtime(sesi?.status === "dibuka" ? sesi.sesiId : undefined)

  function fetchSesi(): Promise<SesiHariIni | null> {
    return apiFetch<{ data: SesiHariIni | null }>(`/mata-kuliah/${courseId}/sesi/hari-ini`).then((res) => res.data)
  }

  useEffect(() => {
    fetchSesi()
      .then((data) => {
        setSesi(data)
        if (data) setTopik(data.topik)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  useEffect(() => {
    if (!sesi || sesi.status !== "dibuka") return
    apiFetch<{ data: LiveRosterEntry[] }>(`/presensi?mataKuliahId=${courseId}&sesiId=${sesi.sesiId}`).then((res) =>
      setLiveRoster(res.data)
    )
  }, [sesi, courseId])

  useEffect(() => {
    if (!sesi?.presensiSelesai) return
    const tick = () => {
      const remaining = Math.max(0, Math.round((new Date(sesi.presensiSelesai!).getTime() - Date.now()) / 1000))
      setSisaDetik(remaining)
      if (remaining === 0) {
        fetchSesi().then((data) => {
          setSesi(data)
          if (data) setTopik(data.topik)
        })
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesi?.presensiSelesai])

  const recordBySesiRowMahasiswaId = useMemo(() => {
    const map = new Map(liveRoster.map((r) => [r.mahasiswa.id, r.record]))
    for (const row of liveRows) map.set(row.mahasiswa_id, row)
    return map
  }, [liveRoster, liveRows])

  async function handleBuka() {
    setBusy(true)
    try {
      const res = await apiFetch<{ data: SesiHariIni }>(`/mata-kuliah/${courseId}/sesi/hari-ini/buka`, {
        method: "POST",
        body: JSON.stringify({ durasiMenit, topik: topik.trim() || undefined }),
      })
      setSesi(res.data)
      toast.success(`Presensi dibuka ${durasiMenit} menit`)
    } catch (err) {
      toast.error("Gagal membuka presensi", { description: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  async function handleTutup() {
    setBusy(true)
    try {
      const res = await apiFetch<{ data: SesiHariIni }>(`/mata-kuliah/${courseId}/sesi/hari-ini/tutup`, {
        method: "POST",
      })
      setSesi(res.data)
      toast.success("Presensi ditutup")
    } catch (err) {
      toast.error("Gagal menutup presensi", { description: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Skeleton className="h-40 rounded-xl" />

  const menit = String(Math.floor(sisaDetik / 60)).padStart(2, "0")
  const detik = String(sisaDetik % 60).padStart(2, "0")

  return (
    <SectionCard
      title="Kontrol Presensi Hari Ini"
      description={
        sesi
          ? `Pertemuan ke-${sesi.pertemuanKe} — ${sesi.topik}`
          : "Belum ada pertemuan tercatat hari ini."
      }
    >
      {sesi?.status === "dibuka" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
              <span className="font-medium">Presensi sedang dibuka</span>
              <span className="font-display text-lg tabular-nums text-primary">
                {menit}:{detik}
              </span>
            </div>
            <Button size="sm" variant="destructive" disabled={busy} onClick={handleTutup}>
              <Square />
              Tutup Sekarang
            </Button>
          </div>

          <ul className="flex flex-col gap-2">
            {liveRoster.map(({ mahasiswa }) => {
              const record = recordBySesiRowMahasiswaId.get(mahasiswa.id)
              return (
                <li
                  key={mahasiswa.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm">
                      <AvatarFallback>{mahasiswa.nama.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{mahasiswa.nama}</span>
                      <span className="text-xs text-muted-foreground">{mahasiswa.nim}</span>
                    </div>
                  </div>
                  {record ? (
                    <Badge variant="success">
                      <Fingerprint />
                      Hadir
                    </Badge>
                  ) : (
                    <Badge variant="outline">Belum scan</Badge>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Materi / Topik</label>
            <Input
              value={topik}
              onChange={(e) => setTopik(e.target.value)}
              placeholder="cth. Normalisasi Data"
              className="w-56"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Durasi</label>
            <Select value={String(durasiMenit)} onValueChange={(v) => setDurasiMenit(Number(v ?? 5))}>
              <SelectTrigger className="w-32">
                <SelectValue>{(v: string | null) => `${v ?? 5} menit`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DURASI_OPTIONS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} menit
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={busy} onClick={handleBuka}>
            <Fingerprint />
            Buka Presensi
          </Button>
          {sesi?.status === "ditutup" && (
            <span className="text-xs text-muted-foreground">
              Presensi pertemuan ini sudah ditutup — buka lagi kalau perlu sesi tambahan.
            </span>
          )}
        </div>
      )}
    </SectionCard>
  )
}

function initials(nama: string): string {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export default function MataKuliahDetailPage() {
  const params = useParams<{ courseId: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [roster, setRoster] = useState<RosterEntry[]>([])

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: Course }>(`/mata-kuliah/${params.courseId}`).catch(() => null),
      apiFetch<{ data: Session[] }>(`/mata-kuliah/${params.courseId}/sesi`).catch(() => ({ data: [] })),
      apiFetch<{ data: RosterEntry[] }>(`/mata-kuliah/${params.courseId}/roster`).catch(() => ({ data: [] })),
    ]).then(([courseRes, sesiRes, rosterRes]) => {
      setCourse(courseRes?.data ?? null)
      setSessions(sesiRes.data)
      setRoster(rosterRes.data)
      setLoading(false)
    })
  }, [params.courseId])

  if (loading) {
    return (
      <>
        <PageHeader title="Mata Kuliah" />
        <Skeleton className="h-64 rounded-xl" />
      </>
    )
  }

  if (!course) {
    return (
      <>
        <PageHeader
          title="Mata Kuliah"
          description="Mata kuliah tidak ditemukan."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dosen/mata-kuliah-hari-ini")}
            >
              <ArrowLeft />
              Kembali
            </Button>
          }
        />
        <EmptyState icon={BookOpen} title="Mata kuliah tidak ditemukan" />
      </>
    )
  }

  const sesiSelesai = sessions.filter((s) => s.status !== "akan-datang").length
  const rataRata =
    roster.length === 0
      ? 0
      : Math.round(roster.reduce((acc, p) => acc + p.persentaseHadir, 0) / roster.length)

  return (
    <>
      <PageHeader
        title={course.nama}
        description={`${course.kode} • ${course.sks} SKS • Semester ${course.semester}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dosen/mata-kuliah-hari-ini")}
          >
            <ArrowLeft />
            Kembali
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft hover-lift">
          <p className="text-sm text-muted-foreground">Jadwal</p>
          <p className="font-display text-lg font-semibold">
            {course.jadwal.hari}
          </p>
          <p className="text-xs text-muted-foreground">
            {course.jadwal.jamMulai}–{course.jadwal.jamSelesai}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft hover-lift">
          <p className="text-sm text-muted-foreground">Ruang</p>
          <p className="flex items-center gap-1 font-display text-lg font-semibold">
            <MapPin className="size-4" />
            {course.jadwal.ruang}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft hover-lift">
          <p className="text-sm text-muted-foreground">Peserta</p>
          <p className="flex items-center gap-1 font-display text-2xl font-semibold">
            <Users className="size-4" />
            {roster.length}
          </p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-soft hover-lift">
          <p className="text-sm text-muted-foreground">Rata-rata Kehadiran</p>
          <p className="font-display text-2xl font-semibold text-primary">
            {rataRata}%
          </p>
          <p className="text-xs text-muted-foreground">
            {sesiSelesai} dari {sessions.length} pertemuan
          </p>
        </div>
      </div>

      <PresensiMandiriControl courseId={course.id} />

      <SectionCard
        title="Rekap Kehadiran Kelas"
        description="Persentase kehadiran tiap peserta di mata kuliah ini."
      >
        {roster.length === 0 ? (
          <EmptyState title="Belum ada peserta" className="border-none py-10" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mahasiswa</TableHead>
                <TableHead>NIM</TableHead>
                <TableHead>Hadir</TableHead>
                <TableHead>Izin</TableHead>
                <TableHead>Sakit</TableHead>
                <TableHead>Alpha</TableHead>
                <TableHead>% Kehadiran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map(({ student, hadir, izin, sakit, alpha, persentaseHadir, isWarning }) => (
                <TableRow
                  key={student.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Lihat profil ${student.nama}`}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
                  onClick={() => router.push(`/dosen/mahasiswa/${student.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      router.push(`/dosen/mahasiswa/${student.id}`)
                    }
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback>{initials(student.nama)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.nama}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{student.nim}</TableCell>
                  <TableCell className="text-muted-foreground">{hadir}</TableCell>
                  <TableCell className="text-muted-foreground">{izin}</TableCell>
                  <TableCell className="text-muted-foreground">{sakit}</TableCell>
                  <TableCell className="text-muted-foreground">{alpha}</TableCell>
                  <TableCell>
                    <Badge variant={isWarning ? "warning" : "secondary"}>
                      {persentaseHadir}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </>
  )
}
