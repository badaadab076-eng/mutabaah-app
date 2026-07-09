# Perubahan dari Versi Sebelumnya

## 🐛 Perbaikan Bug / Stabilitas
- **Antrean sinkron offline**: perubahan (centang amalan, bookmark, kas) yang gagal terkirim karena tidak ada koneksi sekarang otomatis masuk antrean dan dicoba ulang begitu koneksi kembali — sebelumnya data yang gagal sinkron tidak pernah dicoba ulang otomatis.
- **Debounce penyimpanan**: centang amalan beruntun tidak lagi membanjiri server dengan banyak request — digabung jadi satu setelah jeda singkat.
- **Race condition di server**: penyimpanan data anggota/kas/config/mutaba'ah sekarang memakai penguncian (lock) di server, mencegah data tertimpa saat dua admin menyimpan hampir bersamaan.
- **Keamanan login**: percobaan login sekarang dibatasi (dikunci sementara setelah 5x gagal) untuk mencegah brute-force; perbandingan password memakai metode constant-time (mencegah timing attack).
- **PWA lengkap**: `manifest.json`, ikon, dan service worker (`sw.js`) yang sebelumnya direferensikan tapi tidak ada filenya, sekarang sudah lengkap dan berfungsi.

## ✨ Fitur Baru
- **Wizard "Buat Server Baru"** — tersedia di layar login & Pengaturan. Menuntun user awam membuat server kelompok sendiri (Google Sheets + Apps Script) langkah-demi-langkah, dengan kode server tersalin otomatis ke clipboard, tanpa perlu cari tutorial di luar aplikasi.
- **Install sebagai Aplikasi (PWA)** — tombol install langsung di menu Pengaturan (Android/desktop), plus panduan khusus untuk iPhone/iPad.
- **Akses dari mana saja via link** — paket ini siap di-deploy ke GitHub Pages (gratis), menghasilkan satu link yang bisa dibuka dari perangkat mana pun.
- **Indikator antrean offline** — badge kecil di Pengaturan menunjukkan berapa perubahan yang masih menunggu koneksi untuk disinkron.
- **Endpoint `ping`** di backend — dipakai wizard & tombol "Tes Koneksi" untuk memverifikasi server benar-benar aktif, sekaligus menampilkan nama kelompok.
