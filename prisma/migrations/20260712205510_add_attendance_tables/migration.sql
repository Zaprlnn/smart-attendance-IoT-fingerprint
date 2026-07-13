-- AlterTable
ALTER TABLE "mahasiswa" ADD COLUMN     "password_hash" TEXT;

-- CreateTable
CREATE TABLE "dosen" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nip" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dosen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mata_kuliah" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,
    "dosen_id" UUID NOT NULL,
    "semester" INTEGER NOT NULL,
    "hari" TEXT NOT NULL,
    "jam_mulai" TEXT NOT NULL,
    "jam_selesai" TEXT NOT NULL,
    "ruang" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mata_kuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mahasiswa_id" UUID NOT NULL,
    "mata_kuliah_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesi" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mata_kuliah_id" UUID NOT NULL,
    "pertemuan_ke" INTEGER NOT NULL,
    "tanggal" DATE NOT NULL,
    "topik" TEXT NOT NULL,

    CONSTRAINT "sesi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presensi" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mahasiswa_id" UUID NOT NULL,
    "mata_kuliah_id" UUID NOT NULL,
    "sesi_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'hadir',
    "method" TEXT NOT NULL DEFAULT 'manual',
    "device_id" TEXT,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nama" TEXT NOT NULL,
    "ruang" TEXT NOT NULL,
    "device_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "sensor_ok" BOOLEAN NOT NULL DEFAULT true,
    "signal" INTEGER NOT NULL DEFAULT 0,
    "last_seen" TIMESTAMPTZ(6),
    "total_scan_hari_ini" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dosen_nip_key" ON "dosen"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "mata_kuliah_kode_key" ON "mata_kuliah"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_mahasiswa_id_mata_kuliah_id_key" ON "enrollment"("mahasiswa_id", "mata_kuliah_id");

-- CreateIndex
CREATE UNIQUE INDEX "sesi_mata_kuliah_id_pertemuan_ke_key" ON "sesi"("mata_kuliah_id", "pertemuan_ke");

-- CreateIndex
CREATE UNIQUE INDEX "presensi_mahasiswa_id_sesi_id_key" ON "presensi"("mahasiswa_id", "sesi_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_device_key_key" ON "device"("device_key");

-- AddForeignKey
ALTER TABLE "mata_kuliah" ADD CONSTRAINT "mata_kuliah_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_mata_kuliah_id_fkey" FOREIGN KEY ("mata_kuliah_id") REFERENCES "mata_kuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi" ADD CONSTRAINT "sesi_mata_kuliah_id_fkey" FOREIGN KEY ("mata_kuliah_id") REFERENCES "mata_kuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi" ADD CONSTRAINT "presensi_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi" ADD CONSTRAINT "presensi_mata_kuliah_id_fkey" FOREIGN KEY ("mata_kuliah_id") REFERENCES "mata_kuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi" ADD CONSTRAINT "presensi_sesi_id_fkey" FOREIGN KEY ("sesi_id") REFERENCES "sesi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
