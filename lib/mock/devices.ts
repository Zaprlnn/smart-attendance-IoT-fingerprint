import type { Device } from "@/lib/types"

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

export const devices: Device[] = [
  {
    id: "DEV01",
    nama: "ESP32-Lab-IoT",
    ruang: "Lab IoT",
    status: "online",
    sensorOk: true,
    signal: 87,
    lastSeen: minutesAgo(2),
    totalScanHariIni: 34,
  },
  {
    id: "DEV02",
    nama: "ESP32-RPL1",
    ruang: "Lab.RPL 1",
    status: "online",
    sensorOk: true,
    signal: 72,
    lastSeen: minutesAgo(5),
    totalScanHariIni: 21,
  },
  {
    id: "DEV03",
    nama: "ESP32-E301",
    ruang: "E.301",
    status: "offline",
    sensorOk: false,
    signal: 0,
    lastSeen: minutesAgo(60 * 26),
    totalScanHariIni: 0,
  },
]

/** Memetakan ruang kelas ke device ESP32 yang terpasang di ruang tersebut. */
export function deviceForRoom(ruang: string): Device {
  return devices.find((d) => d.ruang === ruang) ?? devices[0]
}
