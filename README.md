# Mutaba'ah Yaumiyah — Panduan Deploy ke GitHub Pages

## Isi paket (SEMUA FILE, TANPA FOLDER — bisa langsung upload semua sekaligus)
```
index.html
manifest.json
sw.js
Code.gs
icon-192.png
icon-512.png
icon-maskable-512.png
apple-touch-icon.png
favicon-32.png
screenshot-wide.png
screenshot-narrow.png
```
Tidak ada folder sama sekali sekarang — jadi tinggal select semua file ini sekaligus lalu upload, tidak akan ada masalah lagi seperti sebelumnya.

## Langkah upload
1. Buka repo GitHub kamu (yang sudah ada sebelumnya)
2. **Add file → Upload files**
3. Klik **choose your files**, lalu **select semua file di atas sekaligus** (Ctrl/Cmd+klik satu-satu, atau Ctrl+A/Cmd+A kalau semua ada di satu folder di komputermu)
4. Pastikan semuanya masuk ke **root repo** (bukan di dalam subfolder apapun)
5. Klik **Commit changes**
6. Tunggu 1-2 menit, GitHub Pages otomatis update

## Cara mengecek ikon sudah benar
Buka di browser:
```
https://<username-mu>.github.io/<nama-repo>/icon-192.png
```
Kalau gambar ikon muncul → sukses. Kalau 404 → berarti file itu belum ke-upload, cek lagi di tab **Code** repo kamu apakah `icon-192.png` ada di daftar file root.

## Update server yang sudah berjalan (kalau Code.gs berubah lagi nanti)
Buka Google Sheets kelompokmu → **Extensions → Apps Script** → hapus semua kode lama → tempel `Code.gs` yang baru → **Deploy → Manage deployments** → ✏️ pada deployment aktif → **New version** → **Deploy**.

## Soal source code (opsional, TIDAK perlu di-upload ke GitHub)
Kalau nanti saya kirim source `.jsx` mentah untuk pengembangan lanjutan, itu hanya untuk disimpan di komputermu sebagai cadangan/referensi — tidak perlu dan tidak akan dipakai oleh GitHub Pages (yang dipakai untuk menjalankan situs hanya `index.html`, yang sudah berisi semua kode siap pakai).
