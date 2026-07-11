# Mutaba'ah Yaumiyah — Fitur Baru: Undang Anggota via WhatsApp

## Yang baru
- Saat **Tambah Anggota**, username & password otomatis di-generate (bisa diedit manual atau klik 🪄 untuk buat ulang password acak)
- Tombol **"Simpan & Kirim Undangan WhatsApp"** — membuka WhatsApp dengan pesan siap kirim berisi link aplikasi yang **otomatis mengisi form login** penerima (URL server, username, password)
- Penerima tinggal klik link → form login sudah terisi → tinggal tap **Masuk**
- Admin bisa lihat status tiap anggota di daftar: **"Belum pernah login"** atau **"Aktif · login terakhir [tanggal jam]"** — otomatis update begitu anggota berhasil login

## ⚠️ WAJIB: update Code.gs (ada kolom baru di Members)
Karena ada kolom baru (`lastLoginAt`) di sheet Members, `Code.gs` di paket ini **wajib** ditempel ulang di:
1. **Template master**
2. **Server yang sudah jalan** — lalu Deploy versi baru

Tidak perlu jalankan ulang menu Setup — kolom baru otomatis terpakai begitu kode di-update (anggota lama tetap aman, statusnya akan menampilkan "Belum pernah login" sampai mereka login lagi dengan kode baru ini).

## Catatan keamanan
Link undangan membawa password di URL — begitu link diklik, aplikasi otomatis membersihkan URL tersebut dari address bar/riwayat browser penerima (jadi tidak nyangkut di history). Link **sengaja tidak auto-login sendiri** — penerima tetap harus tap tombol Masuk, supaya tidak ada risiko link-preview WhatsApp/Telegram memicu percobaan login otomatis.

## Upload ke GitHub (frontend, seperti biasa)
```
index.html, manifest.json, sw.js,
icon-192.png, icon-512.png, icon-maskable-512.png,
apple-touch-icon.png, favicon-32.png,
screenshot-wide.png, screenshot-narrow.png
```
