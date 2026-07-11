# Fix: Tab WhatsApp Undangan Tidak Terbuka (popup diblokir diam-diam)

## Penyebabnya
Tombol "Simpan & Kirim Undangan WhatsApp" memanggil `window.open()` (buka WhatsApp) **setelah** proses simpan ke server selesai. Karena ada jeda proses (async) di antara klik tombol dan `window.open`, browser modern (terutama di HP) menganggap ini bukan lagi hasil klik langsung dari user, lalu **memblokirnya diam-diam tanpa pesan error**. Anggota tetap berhasil tersimpan (makanya tidak terasa "gagal"), tapi tab WhatsApp memang tidak pernah terbuka — jadi wajar undangannya tidak pernah terkirim.

## Fix
Tab WhatsApp sekarang dibuka **sebelum** proses simpan (masih dalam konteks klik langsung), baru diarahkan ke pesan undangan setelah simpan selesai. Kalau ternyata browser tetap memblokir (sangat ketat), sekarang muncul pesan peringatan yang jelas, bukan diam saja.

## Catatan penting yang perlu kamu tahu
Tombol ini **membuka WhatsApp dengan pesan sudah siap**, tapi kamu (admin) **tetap perlu tap tombol Kirim ➤ di dalam WhatsApp** — ini bukan bug, tapi memang batasan WhatsApp: tidak ada cara mengirim pesan otomatis tanpa sentuhan sama sekali, kecuali pakai WhatsApp Business API resmi (berbayar & perlu verifikasi bisnis).

## Upload ke GitHub (frontend, seperti biasa)
```
index.html, manifest.json, sw.js,
icon-192.png, icon-512.png, icon-maskable-512.png,
apple-touch-icon.png, favicon-32.png,
screenshot-wide.png, screenshot-narrow.png
```
`Code.gs` di paket ini sama seperti sebelumnya (tidak ada perubahan backend kali ini) — tidak perlu update ulang server manapun.
