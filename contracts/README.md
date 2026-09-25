# Panduan Smart Contract LKTIRegistry

File smart contract berada di [`contracts/LKTIRegistry.sol`](./LKTIRegistry.sol).

Kontrak ini mengelola:
1. **Registrasi Naskah**: Mencatat sidik jari (`SHA-256` dan `SimHash` 64-bit), biodata penulis, institusi, dan bukti waktu kepemilikan (*timestamp*).
2. **Pencatatan Partisipasi Lomba**: Panitia lomba mencatat keikutsertaan atau juara naskah dengan domain instansi panitia.
3. **Pencatatan Massal (Batch)**: Memungkinkan panitia mencatat banyak naskah sekaligus dalam 1 transaksi untuk menghemat biaya gas.
4. **Mekanisme Bantahan (Dispute)**: Hanya pendaftar asli naskah yang berhak membantah klaim kompetisi jika dicatut pihak lain.
5. **Lookup Dual-Fingerprint**: Fungsi `getAllSimHashes()` memungkinkan frontend membaca semua simHash on-chain untuk menghitung Hamming Distance di browser (zero-server).

---

## Cara Deploy Termudah (Menggunakan Remix IDE)

### 1. Buka Remix IDE
- Buka [https://remix.ethereum.org](https://remix.ethereum.org) di peramban Anda.
- Di tab **File Explorer**, buat file baru bernama `LKTIRegistry.sol` di dalam folder `contracts`.
- Salin seluruh isi dari file [`contracts/LKTIRegistry.sol`](./LKTIRegistry.sol) ke file tersebut.

### 2. Compile Kontrak
- Masuk ke tab **Solidity Compiler** di sisi kiri (ikon huruf 'S').
- Pilih compiler version `0.8.20` atau lebih baru.
- Klik tombol **Compile LKTIRegistry.sol**.
- Pastikan muncul centang hijau.

### 3. Deploy ke Base Sepolia Testnet
- Masuk ke tab **Deploy & Run Transactions** (ikon Ethereum dengan panah).
- Pada dropdown **Environment**, pilih **Injected Provider - MetaMask**.
- Pastikan MetaMask Anda sudah berada di jaringan **Base Sepolia** (Chain ID: `84532`) dan memiliki saldo faucet ETH Base Sepolia.
  > Faucet Base Sepolia gratis dapat diambil di: [https://www.alchemy.com/faucets/base-sepolia](https://www.alchemy.com/faucets/base-sepolia) atau [https://faucet.quicknode.com/base/sepolia](https://faucet.quicknode.com/base/sepolia).
- Pada dropdown **Contract**, pastikan terpilih `LKTIRegistry - contracts/LKTIRegistry.sol`.
- Klik tombol warna oranye **Deploy**.
- Konfirmasi transaksi di pop-up MetaMask Anda.

### 4. Hubungkan Hasil Deploy ke Frontend
1. Setelah transaksi terkonfirmasi, pada bagian **Deployed Contracts** di Remix, klik tombol salin (*copy*) di sebelah nama kontrak untuk menyalin **Contract Address**.
2. Buka file `.env.local` di folder `PaperCheck-fn` (buat jika belum ada):
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xAlamatKontrakHasilDeployAnda
   ```
   Atau masukkan langsung ke file [`src/lib/contract.js`](../src/lib/contract.js).
3. ABI kontrak sudah siap pakai dan tersimpan di [`src/lib/contractAbi.json`](../src/lib/contractAbi.json).
