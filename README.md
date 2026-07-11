# 4 Perbaikan Sekaligus

## 1. Kas & Iuran sekarang benar-benar terpisah
Sebelumnya tiap pembayaran Iuran otomatis membuat entri di Kas juga. Sekarang dihapus — dua-duanya berdiri sendiri, tidak saling memengaruhi.

## 2. Fix: "Belum pernah login" padahal sudah login
Ada 2 penyebab, sekaligus diperbaiki:
- Sheet Members lama belum punya kolom `lastLoginAt` di baris header-nya (cuma ditambahkan otomatis untuk sheet BARU, bukan yang sudah ada isinya) → sekarang ada migrasi otomatis: kolom yang kurang di sheet lama akan ditambahkan sendiri ke header begitu diakses.
- Data `lastLoginAt` sempat sengaja tidak disertakan saat dikirim ke aplikasi (`actionGetGroupData_`) → sudah diperbaiki, sekarang ikut terkirim.

## 3. Fix: Modal (form Kas/Anggota/dll) muncul di luar layar, harus scroll dulu
Akar masalahnya CSS: filter mode-malam yang dipasang di wrapper utama aplikasi membuat semua elemen "fixed" (termasuk modal) dihitung posisinya relatif ke wrapper itu, bukan ke layar sungguhan — makanya modal "kabur" ke bawah, di luar area yang kelihatan. Sekarang modal (dan juga badge loading & notifikasi toast) dirender langsung ke `<body>` lewat React Portal, sepenuhnya lepas dari masalah ini.

## 4. Fix: Loading "Menyimpan..." tidak terlihat saat simpan
Penyebabnya sama persis dengan #3 (bug CSS yang sama) — otomatis ikut teratasi begitu badge status disimpan dipindah lewat Portal. Sekarang harusnya selalu kelihatan di bagian atas layar setiap kali menyimpan data, di HP maupun laptop, mode terang maupun gelap.

## ⚠️ WAJIB update Code.gs (ada perubahan skema & logika)
Update di **template master** dan **server yang sudah jalan**:
Extensions → Apps Script → tempel `Code.gs` baru → Deploy → Manage deployments → New version → Deploy.

## Upload ke GitHub (frontend)
```
index.html, manifest.json, sw.js,
icon-192.png, icon-512.png, icon-maskable-512.png,
apple-touch-icon.png, favicon-32.png,
screenshot-wide.png, screenshot-narrow.png
```
