---
version: "hackathon-anticheat-ui-2026-09-19"
name: "AntiCheat Protocol | Global Hackathon Registry"
description: "Spesifikasi antarmuka terdesentralisasi untuk protokol Anti-Cheat Hackathon di BOT Chain. Mengintegrasikan hash-checking repo GitHub lokal, interaksi smart contract tanpa backend tradisional, verifikasi juri, dan telemetry state Web3 secara real-time."
colors:
  primary: "#10B981"         # Hijau Sukses / Clear to Submit
  secondary: "#1E293B"       # Slate Surface / Card Background
  accent: "#EF4444"          # Merah Warning / Duplicate Revert
  background: "#0B0F17"      # Deep Dark Web3 Canvas
  surface: "#161F30"         # Surface Container / Panel Input
  text-primary: "#F8FAFC"    # Heading & Text Utama
  text-secondary: "#94A3B8"  # Deskripsi & Meta Info
  border: "#334155"          # Border pembatas & input outline
  network-badge: "#059669"   # Penanda BOT Chain Connected
typography:
  display-lg:
    fontFamily: "Inter"
    fontSize: "56px"
    fontWeight: 700
    lineHeight: "1.1"
    letterSpacing: "-0.02em"
  body-md:
    fontFamily: "Inter"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "1.6"
  label-md:
    fontFamily: "JetBrains Mono"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "1.4"
spacing:
  base: "8px"
  gap: "16px"
  card-padding: "24px"
  section-padding: "64px"
rounded:
  card: "12px"
  control: "8px"
  pill: "9999px"
components:
  card:
    background: "Menggunakan surface (#161F30) dengan 1px border (#334155) dan backdrop-blur"
    radius: "12px"
  button:
    background: "Tombol submit/aksi utama menggunakan warna primary (#10B981), status revert menggunakan accent (#EF4444)"
    radius: "8px"
  badge:
    background: "Semi-transparan dengan border spesifik (Hijau untuk verified, Merah untuk winner terpantau)"
    radius: "9999px"
---

# AntiCheat Protocol | Global Hackathon Registry
Platform verifikasi orisinalitas repository hackathon terdesentralisasi tanpa server berbasis BOT Chain Testnet.

Tags: web3, hackathon, anti-cheat, solidity, ethersjs, tailwindcss, bot-chain.

## Overview
AntiCheat Protocol adalah DApp single-page yang beroperasi sebagai registry on-chain permanen. Antarmuka ini menyediakan verifikasi integritas instan bagi peserta dan dashboard eksekutif bagi panitia/juri terdaftar (`authorizedOrganizers`) untuk menandai project pemenang secara on-chain.

Struktur antarmuka dirancang modular, memadukan panel verifikasi publik (Read/Write call) dan kontrol administrative panitia yang terisolasi secara dinamis berdasarkan otorisasi wallet MetaMask.

## Composition
Hierarki visual mengikuti komposisi DApp Web3 modern:
1. **Header & Network Bar:** Logo protokol, Network Status Indicator (`BOT Chain: 968`), dan Dynamic Wallet Connect Button (menampilkan alamat ringkas `0x...` dan role badge).
2. **Hero & Protocol Telemetry:** Judul visual besar *"Zero Tolerance for Recycled Projects"*, sub-judul teknis, dan metrik global (Total Hash Registered, Confirmed Winners, Total Events).
3. **Core Verification Console (Public View):**
   - Single-line search & hashing bar untuk repository link GitHub.
   - Hashing engine lokal instan (SHA-256 hash preview via monospace badge).
   - Dynamic State Banner:
     - **Clear State (Green):** Repository bersih, tombol `Submit Project` aktif (Write tx).
     - **Flagged State (Red):** Warning box tebal *"Repository Flagged: Already Won at [Event Name]"*, tombol submit dinonaktifkan (Revert Prevention).
4. **Organizer Panel (Admin Gate):**
   - Terkunci dan tersembunyi kecuali wallet address terdaftar dalam mapping `authorizedOrganizers`.
   - Form deklarasi: Input hash, input event name, dan tombol `Declare Winner` (Write tx).

## Colors
Palet bertumpu pada background ultra-dark `#0B0F17` dengan card surface `#161F30` dan border tegas `#334155`. Status feedback mengandalkan Emerald Green (`#10B981`) untuk status repository aman serta Rose Red (`#EF4444`) untuk project flagged. Kontras warna teks tetap tinggi untuk memastikan parameter teknis dan hash code terbaca jelas di berbagai kondisi layar.

## Typography
- **Heading & UI Copy:** Menggunakan Inter untuk keterbacaan modern, lugas, dan rapi.
- **Data Hash, Address & Smart Contract Logic:** Menggunakan JetBrains Mono untuk seluruh rendering alamat wallet, hash repository (`0x...`), nama event, dan parameter RPC.

## Layout & Wireframe Blueprint
Desain mengadopsi struktur Single Page Application (SPA) terpusat (max-width: 1120px) dengan layout vertikal yang teratur:

```text
+--------------------------------------------------------------------------+
| [LOGO] AntiCheat Protocol          [Chain: BOT Testnet (968)] [Connect]  |
+--------------------------------------------------------------------------+
|                                                                          |
|                  GLOBAL HACKATHON REPOSITORY REGISTRY                    |
|          Verifikasi integritas repository instan via smart contract      |
|                                                                          |
|   +------------------------------------------------------------------+   |
|   | Enter GitHub Repository URL:                                     |   |
|   | [ https://github.com/user/project-repo                         ] |   |
|   +------------------------------------------------------------------+   |
|   | Hash Output: 0x8f3c92...e14b  [Auto-Generated SHA-256]           |   |
|   +------------------------------------------------------------------+   |
|                                                                          |
|   [ STATUS 1: CLEAR ]                        [ STATUS 2: FLAGGED ]       |
|   +------------------------------+           +-------------------------+ |
|   | Status: Belum Pernah Juara   |           | PERINGATAN: DITEMUKAN   | |
|   | [ Submit to BOT Chain (Gas) ]|           | Juara di Hackathon XYZ  | |
|   +------------------------------+           | [ Submission Disabled ] | |
|                                              +-------------------------+ |
|                                                                          |
|   +------------------------------------------------------------------+   |
|   | [ORGANIZER RESTRICTED AREA] (Active only for Authorized Juries)   |   |
|   | Target Hash: [ 0x8f3c92...     ]   Event Name: [ Web3 Fest 2026 ]|   |
|   | [ Declare as Winner (Write Contract Call) ]                      |   |
|   +------------------------------------------------------------------+   |
+--------------------------------------------------------------------------+
```

## Components
- **Input Terminal:** Input field URL repo dengan prefix ikon GitHub dan feedback hashing instan.
- **Web3 Wallet Switcher:** Button adaptif yang menampilkan modal aktivasi jaringan jika user berada di luar Chain ID 968.
- **Hash Badge:** Kontainer monospace ringkas dengan tombol aksi *one-click copy*.
- **Alert State Cards:** Banner full-width dengan border 2px dan accent glowing untuk membedakan status valid dan status duplikasi.

## Motion & Micro-Interactions
- **Hashing Transition:** Animasi loading halus (pulse ring) selama proses hashing lokal dan pemanggilan smart contract read call.
- **Transaction Feedback:** Toast modal muncul dari sudut kanan bawah saat transaksi MetaMask diinisiasi hingga transaksi terkonfirmasi di block explorer.
- **Admin Reveal:** Transisi fade-in bertahap (opacity & scale) pada panel organizer saat mapping wallet terdeteksi valid.

## Guardrails
- Hashing wajib dilakukan secara lokal di sisi klien sebelum melakukan pengecekan ke blockchain.
- Tombol `Submit Project` tidak boleh dapat di-klik jika hash repository terbukti bernilai `isWinner == true`.
- Tampilan Organizer Dashboard tidak boleh terekspos ke peserta biasa untuk menjaga kerapian antarmuka.
- Konsistensi font monospaced wajib dijaga pada seluruh representasi data kriptografis.