-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "absensi" (
    "id" BIGSERIAL NOT NULL,
    "id_jari" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'hadir',
    "waktu" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_commands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_id" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mahasiswa" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nim" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "prodi" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "email" TEXT,
    "id_jari" INTEGER,
    "fingerprint_enrolled" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mahasiswa_nim_key" ON "mahasiswa"("nim");
