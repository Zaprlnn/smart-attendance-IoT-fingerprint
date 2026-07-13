"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"

type CommandStatus = "pending" | "processing" | "completed" | "failed"

function toCommandStatus(value: unknown): CommandStatus {
  return value === "processing" || value === "completed" || value === "failed" ? value : "pending"
}

export function useEnrollCommand(commandId: string | null) {
  const [status, setStatus] = useState<CommandStatus>("pending")

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
        if (data) setStatus(toCommandStatus(data.status))
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
          setStatus(toCommandStatus(payload.new.status))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [commandId])

  return status
}
