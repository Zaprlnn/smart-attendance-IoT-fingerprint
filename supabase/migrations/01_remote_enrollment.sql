-- 1. Buat tabel mahasiswa
CREATE TABLE IF NOT EXISTS public.mahasiswa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nim TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    prodi TEXT NOT NULL,
    semester INTEGER NOT NULL,
    email TEXT,
    id_jari INTEGER, -- ID sidik jari di memori AS608 (1-127)
    fingerprint_enrolled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Buat tabel antrean perintah (device_commands)
CREATE TABLE IF NOT EXISTS public.device_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL, -- misal: 'smart-attendance-iot-key'
    command TEXT NOT NULL,   -- misal: 'enroll'
    payload JSONB,           -- misal: {"id_jari": 7}
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Nyalakan Realtime untuk tabel baru ini supaya website bisa update otomatis!
ALTER PUBLICATION supabase_realtime ADD TABLE mahasiswa;
ALTER PUBLICATION supabase_realtime ADD TABLE device_commands;

-- Matikan RLS (Row Level Security) agar frontend bisa langsung insert data tanpa perlu token login
ALTER TABLE public.mahasiswa DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_commands DISABLE ROW LEVEL SECURITY;
