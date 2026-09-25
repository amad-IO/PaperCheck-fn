# PaperCheck - Frontend Registry Naskah LKTI

PaperCheck is a decentralized Web3 application for checking manuscript originality and registering paper proof-of-existence on a blockchain. The application performs document extraction locally in the browser so the manuscript content stays private and is never uploaded to a server.

---

## Features

1. **Full Privacy Protection**
   - Manuscript files are never uploaded to any server.
   - Text extraction is done locally with `pdfjs-dist` for PDF and `mammoth` for DOCX files.
2. **Dual-Fingerprint Verification**
   - **SHA-256** via the browser Web Crypto API.
   - **SimHash 64-bit** for detecting paraphrased or substantively similar manuscripts.
3. **Integrated Modules**
   - **Check Paper**: verify originality using uploaded manuscripts or pasted abstracts.
   - **Register Paper**: register a manuscript on-chain with a timestamped proof-of-existence.
   - **Committee Dashboard**: manage competition records and domain verification.
   - **Paper Details**: inspect blockchain timeline and dispute history.
4. **Visual Frontend Showcase**
   - A polished UI with stacked card design and registration flow built for the PaperCheck workflow.

---

## Tech Stack

- **Framework**: Next.js 14, React 18
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Blockchain**: Viem, Wagmi (targeted to Bohr Testnet / EVM-compatible chains)
- **Document Parsing**: PDF.js, Mammoth
- **Cryptography**: Web Crypto API, custom SimHash implementation
- **Icons**: Lucide React

---

## Environment Setup

This project needs environment variables for the contract address.

1. Copy the example file:
   ```bash
   copy .env.example .env
   ```
   or on Linux/macOS:
   ```bash
   cp .env.example .env
   ```

2. Update the contract address in the `.env` file:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddressHere
   ```

3. Keep `.env.example` as a template for other developers, and do not commit your real secret values if you add any later.

---

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file from template:
   ```bash
   copy .env.example .env
   ```

3. Start the app:
   ```bash
   npm run dev
   ```

4. Open the project in the browser:
   ```text
   http://localhost:3000
   ```

5. Production build:
   ```bash
   npm run build
   npm run start
   ```

---

## Notes

- The smart contract address is read from `NEXT_PUBLIC_CONTRACT_ADDRESS`.
- The project is configured to use environment variables from `.env` in a Next.js app.
- If you deploy a new contract, update the value in `.env` and restart the app.
