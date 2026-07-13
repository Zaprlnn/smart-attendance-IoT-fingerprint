-- AlterTable
ALTER TABLE "sesi" ADD COLUMN     "presensi_mulai" TIMESTAMPTZ(6),
ADD COLUMN     "presensi_selesai" TIMESTAMPTZ(6);
