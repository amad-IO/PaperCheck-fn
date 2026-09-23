# PaperCheck - Frontend Registry Naskah LKTI

Platform verifikasi orisinalitas naskah karya ilmiah (LKTI) terdesentralisasi berbasis Web3 tanpa server terpusat. Naskah karya ilmiah diproses dan diekstrak secara lokal langsung di memori browser pengguna (*client-side*) untuk menjamin kerahasiaan dan hak kekayaan intelektual peserta sebelum kompetisi.

---

## Fitur Utama

1. **Jaminan Privasi Penuh (Zero-Server Leak)**:
   - Berkas naskah (PDF/DOCX) tidak pernah diunggah ke server manapun.
   - Ekstraksi teks lokal menggunakan `pdfjs-dist` (untuk PDF) dan `mammoth.js` (untuk DOCX).
2. **Dual-Fingerprint Mesin Analisis**:
   - **SHA-256** via native Web Crypto API untuk mendeteksi naskah yang 100% identik.
   - **SimHash 64-bit** berbasis FNV-1a dan pembersihan stop words untuk mendeteksi naskah parafrase atau kesamaan substansi ide.
3. **4 Modul Terintegrasi**:
   - **Cek Naskah**: Drag & drop naskah atau tempel abstrak untuk verifikasi orisinalitas instan dengan 3 status (Bersih, Pernah Ikut, Mirip Naskah Lain).
   - **Daftarkan Naskah**: Stepper 4 langkah pendaftaran naskah oleh peserta dengan penerbitan Sertifikat Bukti Waktu on-chain.
   - **Dashboard Panitia**: Pembuatan lomba, panduan verifikasi domain institusi kampus via DNS TXT, dan fitur pencatatan hasil massal (*batch upload*).
   - **Detail & Linimasa**: Audit linimasa riwayat keikutsertaan lomba dan hak bantah klaim (*dispute*) bagi pemilik asli naskah.
4. **Visual Showcase Sesuai Spesifikasi**:
   - Tampilan hero bertumpuk seragam (*fanned stacked cards*) bergaya Neuform / System Metriqs, dipadukan dengan area kerja formulir fungsional di bawahnya.

---

## Teknologi yang Digunakan

- **Framework**: Next.js 14 (App Router), React 18
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Web3 & Blockchain**: Viem, Wagmi, RainbowKit (Target Jaringan: Base Sepolia / Lisk Sepolia)
- **Ekstraksi Dokumen**: PDF.js (`pdfjs-dist`), Mammoth.js
- **Kriptografi**: Web Crypto API (SHA-256), SimHash 64-bit Custom Module
- **Ikon**: Lucide React

---

## Cara Menjalankan Proyek Secara Lokal

1. Pasang dependensi proyek:
   ```bash
   npm install
   ```

2. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```

3. Buka peramban di alamat:
   ```
   http://localhost:3000
   ```

4. Untuk membangun versi produksi:
   ```bash
   npm run build
   npm run start
   ```
