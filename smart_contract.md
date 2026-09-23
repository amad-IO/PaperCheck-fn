# Dokumentasi Spesifikasi Smart Contract: LKTI Registry Protocol

Dokumen ini mendefinisikan struktur data, fungsi on-chain, event, dan antarmuka (ABI) untuk tim pengembang smart contract dan integrasi frontend.

---

## 1. Lingkungan & Target Jaringan

* **Bahasa**: Solidity ^0.8.20
* **Jaringan**: Ethereum Layer 2 Testnet (Base Sepolia / Lisk Sepolia)
* **Karakteristik**: Biaya transaksi ultra-rendah, finalitas cepat, ramah untuk pencatatan transaksi massal (*batch operations*).

---

## 2. Prinsip Penyimpanan Data On-Chain vs Off-Chain

| Data | Disimpan Di Mana | Alasan |
|---|---|---|
| Isi Naskah Lengkap (PDF/DOCX) | **Tidak Disimpan** | Privasi karya peserta; perlindungan hak kekayaan intelektual sebelum lomba |
| Nama Penulis, Asal Kampus, Email | **Off-Chain (Database / Lokal)** | Perlindungan privasi peserta (GDPR / UU Perlindungan Data Pribadi) |
| Nilai Hash SHA-256 (`contentHash`) | **On-Chain (Blockchain)** | Sidik jari unik 32 byte untuk pencocokan mutlak 100% |
| Nilai SimHash 64-bit (`simHash`) | **On-Chain (Blockchain)** | Sidik jari 8 byte untuk mendeteksi kemiripan teks/parafrase |
| Waktu Pendaftaran (*Timestamp*) | **On-Chain (Blockchain)** | Bukti waktu permanen yang tidak dapat dimanipulasi |
| Alamat Wallet Pendaftar | **On-Chain (Blockchain)** | Bukti kepemilikan naskah pertama kali |
| Riwayat Status Lomba & Pihak Pencatat | **On-Chain (Blockchain)** | Rekam jejak partisipasi dan prestasi naskah |
| Status Bantahan (*Dispute*) | **On-Chain (Blockchain)** | Penanda resmi jika klaim partisipasi dibantah pendaftar asli |

---

## 3. Struktur Data (Data Structures)

### A. Tipe Data Status Partisipasi
```solidity
enum ParticipationStatus {
    Peserta, // Nilai: 0
    Finalis, // Nilai: 1
    Juara    // Nilai: 2
}
```

### B. Struktur Data Naskah (Manuscript)
```solidity
struct Manuscript {
    bytes32 contentHash;    // Hash SHA-256 dari teks naskah
    uint64 simHash;         // Fingerprint SimHash 64-bit
    uint256 registeredAt;   // Waktu pendaftaran pertama kali (block.timestamp)
    address registrant;     // Alamat wallet pemilik/pendaftar pertama
    bool isRegistered;      // Penanda bahwa naskah telah terdaftar
}
```

### C. Struktur Data Kompetisi (Competition)
```solidity
struct Competition {
    uint256 id;             // ID unik kompetisi
    string name;            // Nama kompetisi LKTI
    uint16 year;            // Tahun penyelenggaraan (misal: 2026)
    string category;        // Kategori / Sub-tema (misal: "Teknologi Tepat Guna")
    address organizer;      // Alamat wallet panitia penyelenggara
    string domain;          // Domain resmi institusi (misal: "lkti.unm.ac.id")
    bool isDomainVerified;  // Status apakah domain telah diverifikasi
}
```

### D. Struktur Data Riwayat Partisipasi (ParticipationRecord)
```solidity
struct ParticipationRecord {
    uint256 id;             // ID unik riwayat partisipasi
    uint256 competitionId;  // ID kompetisi terkait
    bytes32 contentHash;    // Hash naskah yang ikut serta
    ParticipationStatus status; // Status (Peserta / Finalis / Juara)
    address recordedBy;     // Wallet panitia yang mencatat data
    uint256 recordedAt;     // Waktu pencatatan
    bool isDisputed;        // True jika dibantah oleh pendaftar pertama
}
```

---

## 4. Fungsi Utama Smart Contract (Interface)

### A. Fungsi untuk Peserta / Penulis

#### 1. `registerManuscript`
Mendaftarkan sidik jari naskah baru ke dalam blockchain.
```solidity
function registerManuscript(bytes32 _contentHash, uint64 _simHash) external returns (bool);
```
* **Kondisi Khusus**:
  * Menolak jika `_contentHash` sudah pernah didaftarkan sebelumnya (`revert("Naskah sudah terdaftar")`).
  * Mencatat `msg.sender` sebagai pemilik awal naskah tersebut.
* **Event**: `ManuscriptRegistered(bytes32 indexed contentHash, uint64 simHash, address indexed registrant, uint256 timestamp)`

#### 2. `disputeClaim`
Mengajukan bantahan terhadap klaim keikutsertaan lomba yang dicatatkan panitia.
```solidity
function disputeClaim(uint256 _participationId) external returns (bool);
```
* **Kondisi Khusus**:
  * Hanya dapat dipanggil oleh wallet pendaftar pertama dari naskah tersebut (`msg.sender == manuscript.registrant`).
  * Mengubah `isDisputed = true` pada rekaman partisipasi terkait.
* **Event**: `ClaimDisputed(uint256 indexed participationId, bytes32 indexed contentHash, address indexed disputedBy, uint256 timestamp)`

---

### B. Fungsi untuk Panitia Penyelenggara Lomba

#### 3. `createCompetition`
Mendaftarkan kompetisi baru di blockchain.
```solidity
function createCompetition(
    string calldata _name,
    uint16 _year,
    string calldata _category,
    string calldata _domain
) external returns (uint256 competitionId);
```
* **Event**: `CompetitionCreated(uint256 indexed competitionId, string name, address indexed organizer, string domain)`

#### 4. `batchRecordParticipations`
Mencatat hasil kepesertaan banyak naskah sekaligus dalam 1 transaksi untuk menghemat biaya gas.
```solidity
function batchRecordParticipations(
    uint256 _competitionId,
    bytes32[] calldata _contentHashes,
    ParticipationStatus[] calldata _statuses
) external returns (bool);
```
* **Kondisi Khusus**:
  * Hanya panitia pembuat kompetisi tersebut (`organizer`) yang berhak memanggil fungsi ini.
  * Panjang array `_contentHashes` dan `_statuses` harus sama persis.
* **Event**: `ParticipationsRecorded(uint256 indexed competitionId, uint256 count, address indexed recordedBy)`

---

### C. Fungsi Pembacaan Data (Read-Only / View)

#### 5. `getManuscript`
Mengambil informasi pendaftaran pertama naskah.
```solidity
function getManuscript(bytes32 _contentHash) external view returns (Manuscript memory);
```

#### 6. `getParticipationsByHash`
Mengambil seluruh riwayat keikutsertaan lomba dari satu hash naskah tertentu.
```solidity
function getParticipationsByHash(bytes32 _contentHash) external view returns (ParticipationRecord[] memory);
```

#### 7. `getCompetition`
Mengambil data detail kompetisi berdasarkan ID.
```solidity
function getCompetition(uint256 _competitionId) external view returns (Competition memory);
```

---

## 5. Event Definition

```solidity
event ManuscriptRegistered(bytes32 indexed contentHash, uint64 simHash, address indexed registrant, uint256 timestamp);
event CompetitionCreated(uint256 indexed competitionId, string name, address indexed organizer, string domain);
event ParticipationsRecorded(uint256 indexed competitionId, uint256 count, address indexed recordedBy);
event ClaimDisputed(uint256 indexed participationId, bytes32 indexed contentHash, address indexed disputedBy, uint256 timestamp);
event DomainVerified(address indexed organizer, string domain, uint256 timestamp);
```
