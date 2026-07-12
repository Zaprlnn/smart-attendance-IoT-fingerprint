"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"

export interface MahasiswaDB {
  id: string
  nim: string
  nama: string
  prodi: string
  semester: number
  email: string
  id_jari: number | null
  fingerprint_enrolled: boolean
  avatarUrl?: string
}

export function useMahasiswaDatabase() {
  const [mahasiswa, setMahasiswa] = useState<MahasiswaDB[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Ambil data awal
    supabase
      .from("mahasiswa")
      .select("*")
      .order("nama", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setMahasiswa(data as MahasiswaDB[])
        }
        setLoading(false)
      })

    // Listen untuk penambahan mahasiswa baru
    const channel = supabase
      .channel("mahasiswa-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mahasiswa" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMahasiswa((prev) => [...prev, payload.new as MahasiswaDB])
          } else if (payload.eventType === "UPDATE") {
            setMahasiswa((prev) => 
              prev.map(m => m.id === payload.new.id ? (payload.new as MahasiswaDB) : m)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { mahasiswa, loading }
}
