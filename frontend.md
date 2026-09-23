# Dokumentasi Spesifikasi Frontend: Registry Naskah LKTI

Dokumen ini adalah panduan implementasi teknis untuk pengembang frontend dalam membangun antarmuka web platform verifikasi dan registry naskah LKTI berbasis Web3.

---

## 1. Visi Produk dan Pengalaman Pengguna (UX)

Sistem ini dirancang untuk menyelesaikan masalah naskah LKTI yang didaur ulang lintas kompetisi tanpa melanggar privasi peserta. Naskah karya ilmiah tidak pernah diunggah ke server terpusat. Seluruh ekstraksi teks dan pembuatan sidik jari digital dilakukan langsung di dalam memori browser pengguna (*client-side*).

### Aturan UX Utama:
* **Bersifat Informatif, Bukan Memvonis**: Antarmuka tidak boleh menampilkan kata "didiskualifikasi" atau "dilarang". Keputusan diskualifikasi sepenuhnya berada pada dewan juri.
* **Transparansi Privasi**: Setiap area pemrosesan naskah harus memuat penegasan bahwa file diproses lokal di browser.
* **Perlindungan Data Pribadi (Data Minimization)**: Nama, email, dan instansi tidak boleh dicatat di blockchain. Data tersebut hanya disimpan lokal/off-chain.
* **Bahasa yang Ramah Akademisi**: Mengurangi jargon teknis blockchain. Menggunakan istilah seperti "Pencatatan Permanen", "Bukti Waktu", dan "Sidik Jari Naskah".
* **Desain Mengutamakan Perangkat Bergerak (Mobile-First)**: Sebagian besar mahasiswa dan panitia mengakses informasi melalui smartphone.

---

## 2. Arsitektur Antarmuka (4 Halaman Utama)

### Halaman 1: Cek Naskah (Beranda Publik)
* **Akses**: Terbuka untuk umum tanpa perlu menghubungkan dompet kripto (*wallet*).
* **Komponen**:
  * Hero banner dengan penjelasan satu kalimat.
  * Area Drag & Drop berkas (mendukung ekstensi PDF dan DOCX) dengan indikator batas ukuran.
  * Tab alternatif untuk input teks langsung ("Tempel Abstrak").
  * Indikator progress pemrosesan:
    1. Ekstraksi teks naskah.
    2. Pembuatan sidik jari (SHA-256 dan SimHash).
    3. Pencarian data di smart contract registry.
  * Kartu Hasil Pemeriksaan (3 Status):
    * **Status Hijau (Bersih)**: Belum ditemukan riwayat naskah di database.
    * **Status Oranye (Pernah Ikut)**: Menampilkan tabel riwayat lomba, tahun, status kepesertaan, dan pihak pencatat.
    * **Status Merah (Kemiripan Terdeteksi)**: Menampilkan persentase kemiripan teks SimHash dan riwayat naskah pembanding.
  * Tampilan badge kredibilitas pihak pencatat.
  * Tombol aksi: "Unduh Laporan Hasil (PDF)" dan "Lihat Bukti Waktu di Explorer".

### Halaman 2: Daftarkan Naskah (Peserta / Penulis)
* **Akses**: Memerlukan koneksi wallet sebagai identitas penandatangan bukti kepemilikan.
* **Komponen**:
  * Stepper alur 4 langkah:
    * **Langkah 1 (Biodata)**: Nama ketua, kampus/instansi, email (disimpan off-chain, bersifat opsional).
    * **Langkah 2 (Data Karya)**: Judul naskah dan kategori/sub-tema.
    * **Langkah 3 (Ekstraksi Naskah)**: Pembacaan file di browser, penghitungan nilai SHA-256 dan SimHash, serta visualisasi hash.
    * **Langkah 4 (Konfirmasi & Tanda Tangan)**: Notifikasi transparan mengenai data apa saja yang masuk on-chain vs off-chain, diikuti tombol "Daftarkan Naskah".
  * Layar Sukses: Penerbitan Sertifikat Bukti Waktu Pendaftaran dengan ID unik, timestamp, dan tombol unduh sertifikat.

### Halaman 3: Dashboard Panitia
* **Akses**: Memerlukan koneksi wallet panitia.
* **Komponen**:
  * Modul Buat Lomba: Formulir pendaftaran nama lomba, tahun, kategori, dan domain resmi kampus.
  * Modul Verifikasi Domain: Instruksi pemasangan wallet pada DNS TXT kampus (`lkti-verify=<wallet>`), dilengkapi tombol cek status verifikasi.
  * Modul Catat Hasil Massal (Batch Upload):
    * Unggah multi-file naskah sekaligus.
    * Tabel hasil parsing: nama file, judul, dropdown status (Peserta / Finalis / Juara), dan skor kemiripan.
    * Tombol eksekusi transaksi massal (*batch sign transaction*).
  * Pintasan skrining naskah masuk.

### Halaman 4: Detail Naskah & Penyelesaian Sengketa (Dispute)
* **Akses**: Publik untuk membaca data; Khusus wallet pendaftar pertama untuk mengajukan bantahan.
* **Komponen**:
  * Informasi spesifik sidik jari naskah (SHA-256 dan SimHash), tanggal pendaftaran pertama, dan wallet pemilik awal.
  * Linimasa (timeline) riwayat keikutsertaan lomba dari tahun ke tahun.
  * Tombol "Bantah Klaim" pada setiap baris riwayat:
    * Hanya aktif jika wallet pengguna adalah pendaftar pertama hash tersebut.
    * Menampilkan status bantahan resmi pada entri lomba yang disengketakan.

---

## 3. Komponen Badge Kredibilitas Sumber

Setiap riwayat pencatatan naskah wajib menampilkan salah satu dari 4 badge kredibilitas berikut:
1. **Terverifikasi Domain**: Wallet pencatat terbukti cocok dengan domain institusi kampus (contoh: `unm.ac.id` atau `ugm.ac.id`).
2. **Terattestasi**: Memiliki attestation/surat digital dari institusi yang diakui.
3. **Anonim**: Wallet biasa yang belum diverifikasi, wajib disertai label peringatan "Klaim belum diverifikasi".
4. **Dibantah**: Pendaftar pertama naskah telah menyematkan bantahan resmi atas klaim keikutsertaan tersebut.

---

## 4. Standar Responsivitas & Desain Sistem

* **Breakpoint Standar**:
  * Mobile: `< 640px` (fokus utama interaksi satu tangan, tombol aksi berukuran minimal 44px).
  * Tablet: `640px - 1024px` (tata letak 2 kolom adaptif).
  * Desktop: `> 1024px` (tata letak maksimal 1200px dengan padding nyaman).
* **Palet Warna Netral & Ramah Akademisi**:
  * Background: Putih / Warm Slate lembut (`#F8FAFC` atau `#F4F1EC`).
  * Surface/Card: Bersih dengan border halus dan bayangan lembut.
  * Warna Aksen Aksi: Oranye/Terracotta (`#ED7B46` / `#E48B59`) atau Biru Edukasi.
  * Status Bersih: Hijau Emerald (`#10B981` / `#059669`).
  * Status Pernah Ikut: Oranye Kuning (`#F59E0B`).
  * Status Kemiripan Tinggi: Merah Lembut (`#EF4444`).
* **Tipografi**:
  * Teks umum dan heading: Inter atau Plus Jakarta Sans.
  * Representasi data hash, alamat wallet, dan timestamp: JetBrains Mono.

---

## 5. Checklist Pengerjaan Frontend per Fitur

* [ ] Fitur 1: Shell Navigasi, Responsivitas Mobile, dan Manajemen State Wallet.
* [ ] Fitur 2: Modul Ekstraksi Teks Lokal Dokumen (PDF via `pdf.js` dan DOCX via `mammoth.js`).
* [ ] Fitur 3: Mesin Kriptografi Klien (SHA-256 Web Crypto API + SimHash 64-bit).
* [ ] Fitur 4: Halaman Cek Naskah & Tampilan 3 Kondisi Kartu Hasil.
* [ ] Fitur 5: Halaman Daftarkan Naskah dengan Stepper 4 Langkah & Penerbitan Sertifikat.
* [ ] Fitur 6: Halaman Dashboard Panitia (Buat Lomba, Verifikasi Domain, Batch Upload).
* [ ] Fitur 7: Halaman Detail Naskah, Linimasa Riwayat, dan Aksi Bantah Klaim.
