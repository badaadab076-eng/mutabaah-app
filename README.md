# Mutaba'ah Yaumiyah — Panduan Deploy ke GitHub Pages

Paket ini berisi aplikasi yang sudah bisa **diakses lewat link dari mana saja** dan **di-install seperti aplikasi** (PWA). Ikuti langkah di bawah — semua gratis, tidak perlu kartu kredit.

## Isi paket

```
index.html      -> aplikasi utama (sudah termasuk semua kode, siap pakai)
manifest.json   -> konfigurasi PWA (nama, ikon, warna)
sw.js           -> service worker (bikin app bisa dipakai offline & di-install)
icons/          -> ikon aplikasi
Code.gs         -> kode backend (Google Apps Script) — untuk admin kelompok, opsional
```

## Langkah 1 — Buat repository GitHub

1. Buka [github.com](https://github.com) dan login (buat akun dulu kalau belum punya, gratis).
2. Klik tombol **New** (repository baru).
3. Isi nama repo, misalnya `mutabaah-app`. Pilih **Public**. Klik **Create repository**.

## Langkah 2 — Upload file

1. Di halaman repo yang baru dibuat, klik **uploading an existing file** (atau menu **Add file → Upload files**).
2. Seret (drag & drop) **semua isi paket ini** — termasuk folder `icons` — ke area upload.
3. Klik **Commit changes**.

## Langkah 3 — Aktifkan GitHub Pages

1. Di repo, buka tab **Settings**.
2. Di menu kiri, klik **Pages**.
3. Pada bagian **Branch**, pilih `main` dan folder `/ (root)`, lalu klik **Save**.
4. Tunggu 1–2 menit. GitHub akan menampilkan link seperti:
   `https://namamu.github.io/mutabaah-app/`

Link itulah yang bisa dibagikan ke siapa saja — bisa dibuka dari HP, laptop, dari mana saja, kapan saja.

## Langkah 4 — Install sebagai aplikasi (opsional tapi disarankan)

Buka link tersebut di HP:
- **Android/Chrome**: akan muncul tombol/menu "Install App" — atau buka Pengaturan di dalam app lalu tap **Install Aplikasi Sekarang**.
- **iPhone/Safari**: buka menu Share (kotak panah ke atas) → **Add to Home Screen**.

Setelah itu ikon aplikasi muncul di layar utama seperti aplikasi biasa.

## Langkah 5 — Mode Kelompok (opsional)

Kalau ingin pakai fitur kelompok (banyak anggota, data tersinkron, kas pengajian), buka aplikasinya lalu tap **"Ingin jadi admin kelompok baru? Buat server sendiri di sini"** di layar login — akan dituntun langkah-demi-langkah membuat server sendiri di Google Sheets milikmu, tanpa perlu keluar dari aplikasi.

(File `Code.gs` di paket ini juga sudah otomatis tersalin oleh wizard tersebut — kamu tidak perlu membukanya manual, kecuali ingin melihat isinya.)

## Update aplikasi di kemudian hari

Kalau nanti ada perubahan/perbaikan lagi, cukup upload ulang file yang berubah ke repo yang sama (menimpa file lama) — GitHub Pages otomatis memperbarui dalam 1–2 menit.

---
Ada kendala saat deploy? Screenshot error-nya dan tanyakan kembali di sini.
