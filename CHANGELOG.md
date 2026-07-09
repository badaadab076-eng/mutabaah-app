# Perubahan — Update Kedua

## 🐛 Bug ditemukan & diperbaiki
- **Kas hilang setelah refresh (akar masalah)**: Google Sheets diam-diam mengubah teks tanggal ("2026-07-05") menjadi object Date saat disimpan. Ketika dibaca kembali, formatnya berubah jadi timestamp UTC penuh dan tidak cocok lagi dengan filter tanggal di aplikasi — sehingga transaksi kas (dan data mutaba'ah mingguan) tampak "hilang" padahal datanya utuh di spreadsheet. Sekarang backend menormalkan nilai tanggal saat dibaca, dan kolom tanggal di sheet diformat sebagai teks biasa agar tidak dikonversi lagi.
- **Teks berjalan tilawah** (No Ayat/Surah/halaman terakhir) sudah ada di kode tapi hanya membaca data lokal HP masing-masing — di mode kelompok jadi tidak menampilkan progres anggota lain. Sekarang mengambil data bookmark seluruh anggota dari server.

## ✨ Fitur baru
- **Animasi simpan modern**: badge kecil "Menyimpan... → Tersimpan ✓" muncul di atas layar setiap kali data dikirim ke server, sebelum notifikasi biasa.
- **Mode Siang/Malam**: tombol matahari/bulan di header, tersimpan sebagai preferensi.
- **Auto-update real-time**: di mode kelompok, data (dashboard, isian harian, kas) otomatis diperbarui tiap ±15 detik dan saat kembali membuka tab — tidak perlu refresh manual lagi. Perubahan lokal yang belum terkirim tidak akan tertimpa.
- **Kirim Laporan multi-channel**: tombol "Kirim" sekarang membuka menu pilihan — Bagikan lewat aplikasi manapun yang terinstall (WhatsApp, Telegram, Drive, dll — via share sheet asli HP), atau langsung ke WhatsApp/Telegram/Simpan PDF/Salin teks.

## 🔧 Perlu tindakan dari kamu
Karena backend (`Code.gs`) berubah, **server yang sudah kamu deploy perlu diperbarui manual** (lihat instruksi di pesan chat) — bukan otomatis, karena itu ada di akun Google-mu sendiri.
