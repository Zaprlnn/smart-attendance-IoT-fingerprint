"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"

export function useEnrollCommand(commandId: string | null) {
  const [status, setStatus] = useState<"pending" | "processing" | "completed" | "failed">("pending")

  useEffect(() => {
    if (!commandId) return

    const supabase = createClient()
    
    // Ambil status awal
    supabase
      .from("device_commands")
      .select("status")
      .eq("id", commandId)
      .single()
      .then(({ data }) => {
        if (data) setStatus(data.status as any)
      })

    // Listen untuk perubahan status
    const channel = supabase
      .channel(`cmd-${commandId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "device_commands",
          filter: `id=eq.${commandId}`,
        },
        (payload) => {
          setStatus(payload.new.status as any)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [commandId])

  return status
}
