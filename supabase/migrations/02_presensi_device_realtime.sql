-- Tabel dosen, mata_kuliah, enrollment, sesi, presensi, device dibuat & dikelola oleh Prisma
-- (lihat backend/prisma/schema.prisma + backend/prisma/migrations/). File ini hanya
-- mendokumentasikan perintah ALTER PUBLICATION yang dijalankan manual, karena Prisma
-- tidak mengelola publication Supabase Realtime.

ALTER PUBLICATION supabase_realtime ADD TABLE presensi;
ALTER PUBLICATION supabase_realtime ADD TABLE device;
