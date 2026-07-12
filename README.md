# Smart Attendance UAD

Dashboard presensi sidik jari (fingerprint) berbasis IoT untuk Universitas Ahmad
Dahlan — dua peran (mahasiswa & dosen), simulasi scan ESP32 secara realtime, dan
manajemen mata kuliah/mahasiswa/perangkat.

> **Status data: mock.** Seluruh data (mahasiswa, dosen, mata kuliah, presensi,
> device) berasal dari `lib/mock/*` dan disimpan in-memory (zustand). Tidak ada
> backend/database sungguhan di belakangnya — siap diganti dengan integrasi
> backend + sensor fingerprint ESP32 yang sebenarnya tanpa mengubah UI.

## Cara Install & Menjalankan

```bash
npm install      # install dependencies
npm run dev      # jalankan dev server -> http://localhost:3000
```

Build & cek kualitas sebelum deploy:

```bash
npm run build    # production build
npm run lint     # ESLint (harus 0 error & 0 warning)
```

## Akun Demo

Password mock = nama lengkap, huruf kecil, tanpa spasi. Tombol **"Isi akun
demo"** di halaman login otomatis mengisi NIM/NIP + password akun pertama di
tab yang aktif (Alvindra untuk mahasiswa, Hendro Wicaksono untuk dosen).

### Mahasiswa

| Nama | NIM | Password | Semester | Fingerprint |
|---|---|---|---|---|
| Alvindra Ramadhan | `2300016035` | `alvindraramadhan` | 6 | Terdaftar |
| Muhammad Ibnu ZS | `2300016045` | `muhammadibnuzs` | 6 | Terdaftar |
| Ardiansyah | `2300016053` | `ardiansyah` | 6 | Terdaftar |
| Dewi Lestari Putri | `2300016012` | `dewilestariputri` | 6 | Terdaftar |
| Rizky Maulana Akbar | `2300016019` | `rizkymaulanaakbar` | 6 | Terdaftar |
| Putri Ayu Wulandari | `2300016027` | `putriayuwulandari` | 6 | Terdaftar |
| Fajar Nur Hidayat | `2400016008` | `fajarnurhidayat` | 4 | Terdaftar |
| Anisa Rahmawati | `2400016014` | `anisarahmawati` | 4 | Terdaftar |
| Bayu Setiawan | `2400016021` | `bayusetiawan` | 4 | Terdaftar |
| Salsabila Putri Anggraini | `2400016030` | `salsabilaputrianggraini` | 4 | Terdaftar |
| Galih Pratama *(kehadiran <75%, demo warning)* | `2400016038` | `galihpratama` | 4 | Terdaftar |
| Nadia Permata Sari | `2400016044` | `nadiapermatasari` | 4 | **Belum** terdaftar |

### Dosen

| Nama | NIP | Password | Mata Kuliah Diampu |
|---|---|---|---|
| Hendro Wicaksono | `60880123` | `hendrowicaksono` | Pemrograman Web, Basis Data |
| Siti Maryam Hidayati | `60910256` | `sitimaryamhidayati` | Internet of Things, Sistem Pendukung Keputusan |
| Bambang Sutopo | `60950341` | `bambangsutopo` | Analisis & Perancangan Sistem |

## Ringkasan Fitur

**Mahasiswa**
- Dashboard ringkas: % kehadiran, jadwal hari ini, komposisi presensi, aktivitas terakhir
- Presensi realtime (simulasi scan fingerprint)
- Daftar & detail mata kuliah, riwayat presensi dengan filter tanggal/status, jadwal mingguan
- Profil: data akun, ganti tema (Terang/Gelap/Sistem), ringkasan kehadiran

**Dosen**
- Dashboard: statistik mengajar, mata kuliah hari ini, mahasiswa perlu perhatian (<75%)
- Monitoring realtime — control room scan fingerprint seluruh kampus + status device live
- Rekap presensi per mata kuliah/pertemuan dengan filter & paginasi
- Manajemen mahasiswa: tabel + pendaftaran mahasiswa baru lengkap dengan simulasi enroll sidik jari
- Mata kuliah hari ini & semua mata kuliah, lengkap dengan rekap kehadiran per kelas
- Manajemen perangkat ESP32: status online/offline, sinyal, kesehatan sensor, uptime, log heartbeat
- Profil: data akun, ganti tema, ringkasan mengajar

**Umum**
- Dark mode penuh di seluruh halaman, transisi halaman & micro-interaction (count-up stat, hover lift, fade-in)
- Audit aksesibilitas: kontras warna AA, navigasi keyboard, label/aria pada form & ikon, heading semantik

## Catatan Pengembangan

- State auth & roster mahasiswa baru disimpan di zustand (`lib/stores/`), reset saat reload penuh kecuali auth yang di-persist ke `localStorage`.
- Simulator realtime (`lib/stores/realtime-store.ts`) men-generate event scan + memperbarui status device secara berkala saat di-"Play" dari halaman Monitoring.
- Untuk integrasi nyata: ganti fungsi-fungsi di `lib/mock/*` dengan panggilan API ke backend, dan arahkan event scan dari `realtime-store` ke koneksi nyata (WebSocket/MQTT) dari perangkat ESP32.
