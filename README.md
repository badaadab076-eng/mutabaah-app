# Mutaba'ah Yaumiyah — Fix: Kas Menampilkan Data Server Lama Saat Pindah Server

## Bug yang diperbaiki
Saat login ke server BARU (URL berbeda dari sebelumnya), tab Kas masih menampilkan data dari server LAMA. Penyebabnya: ada logika "pakai data yang jumlahnya lebih banyak antara cache lokal vs server" yang dimaksudkan untuk jaga-jaga race condition — tapi ini keliru saat ganti server, karena cache lokal dari server lama bisa kebetulan lebih banyak, jadi menutupi data server baru yang benar.

**Fix**: begitu berhasil ambil data dari server, data itu SELALU dipakai apa adanya (tidak dibanding-bandingkan lagi dengan cache). Proteksi race condition transaksi kas sudah ditangani terpisah lewat sistem antrean offline yang sudah ada.

## Catatan kecil (bukan bug, cuma kosmetik)
Saat pertama buka aplikasi setelah pindah server, sekilas mungkin masih sempat menampilkan data lama selama proses memuat (before data server baru selesai diambil) — lalu otomatis diganti begitu server merespons (biasanya di bawah 1 detik). Ini normal dan akan hilang sendiri; kalau butuh instan tanpa kedipan sama sekali, bisa saya bikinkan pembersihan cache otomatis saat URL server berubah — tinggal bilang kalau mau itu juga ditambahkan.

## Upload ke GitHub
File yang di-upload ke root repo (seperti biasa):
```
index.html, manifest.json, sw.js,
icon-192.png, icon-512.png, icon-maskable-512.png,
apple-touch-icon.png, favicon-32.png,
screenshot-wide.png, screenshot-narrow.png
```
`Code.gs` di paket ini SAMA seperti sebelumnya (tidak ada perubahan backend kali ini) — tidak perlu update ulang template atau server manapun.
