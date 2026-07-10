# Mutaba'ah Yaumiyah — Server "Buat Salinan Template" Sudah Aktif

## ✅ Sudah tersambung
ID Template Sheet kamu (`1XTZwPCD4M803CDQHKyZwEMFbUIS6aJjkEnVCbbf_uFw`) sudah dipasang di 2 tempat:
- `Code.gs` → `TEMPLATE_SPREADSHEET_ID` (jaring pengaman anti bootstrap/deploy tidak sengaja)
- `index.html` (kode aplikasi) → tombol "Buat Salinan Template Sekarang" di wizard

## ⚠️ WAJIB dicek sebelum dipakai orang lain
**Pastikan Sheet template kamu (link di atas) sudah berisi `Code.gs` VERSI TERBARU ini** (yang ada di paket ini), bukan versi lama. Soalnya kalau template masih pakai kode lama, SEMUA orang yang nanti "Buat Salinan" akan otomatis mewarisi bug lama (kas hilang setelah refresh, dll) — walau aplikasinya sendiri sudah versi baru.

Cara pastikan:
1. Buka Sheet template: https://docs.google.com/spreadsheets/d/1XTZwPCD4M803CDQHKyZwEMFbUIS6aJjkEnVCbbf_uFw/edit
2. **Extensions → Apps Script**
3. Hapus semua kode yang ada, tempel isi `Code.gs` dari paket ini
4. `Ctrl+S` untuk simpan — **jangan** jalankan bootstrap atau Deploy di sini (memang akan ditolak otomatis oleh `guardAgainstTemplate_`, itu jaring pengamannya)
5. Pastikan sharing masih "Anyone with the link → Viewer" dengan opsi copy tetap aktif

## Tes end-to-end (disarankan sebelum dibagikan ke orang lain)
1. Buka aplikasi pakai mode Incognito / akun Google lain
2. Login screen → **"Ingin jadi admin kelompok baru? Buat server sendiri di sini"**
3. Ikuti 3 langkah wizard sampai selesai → pastikan bisa login `admin`/`admin123` di server baru itu

## Upload ke GitHub (seperti biasa)
File yang di-upload ke root repo:
```
index.html, manifest.json, sw.js,
icon-192.png, icon-512.png, icon-maskable-512.png,
apple-touch-icon.png, favicon-32.png,
screenshot-wide.png, screenshot-narrow.png
```
(`Code.gs` TIDAK perlu di-upload ke GitHub — itu khusus untuk ditempel ke Google Sheets template & server yang sudah jalan.)

## Server kelompok yang sudah jalan (server Adab sendiri, bukan template)
Tetap perlu di-update manual terpisah kalau belum: Extensions → Apps Script → tempel `Code.gs` baru → Deploy → Manage deployments → New version → Deploy.
