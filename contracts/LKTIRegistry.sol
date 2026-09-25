// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LKTIRegistry - Protokol Registry Orisinalitas & Linimasa Naskah LKTI
 * @dev Smart Contract untuk mencatat sidik jari (dual-fingerprint SHA-256 & SimHash 64-bit),
 * bukti waktu kepemilikan, rekam jejak kompetisi oleh panitia, dan mekanisme bantahan klaim (dispute).
 */
contract LKTIRegistry {

    // --- STRUKTUR DATA ---

    struct Participation {
        uint256 id;
        string competitionName; // Nama lomba, misal: "PIMNAS 37"
        uint16 year;            // Tahun lomba, misal: 2024
        string category;        // Kategori lomba, misal: "PKM-RE"
        string status;          // "Peserta" | "Finalis" | "Juara"
        address recordedBy;     // Alamat wallet panitia pencatat
        string recorderName;    // Nama institusi/penyelenggara, misal: "Puspresnas"
        string domain;          // Domain terverifikasi panitia, misal: "puspresnas.kemdikbud.go.id"
        uint256 recordedAt;     // Timestamp on-chain saat dicatat
        bool isDisputed;        // Status apakah klaim ini dibantah oleh pendaftar asli
        string disputeNote;     // Catatan/alasan bantahan
    }

    struct Manuscript {
        bytes32 contentHash;    // SHA-256 dokumen (format bytes32)
        uint64 simHash;         // 64-bit SimHash dokumen untuk deteksi parafrase
        string title;           // Judul karya tulis ilmiah
        string category;        // Kategori bidang ilmu
        string author;          // Nama ketua / perwakilan tim penulis
        string institution;     // Asal perguruan tinggi / sekolah
        uint256 registeredAt;   // Waktu pendaftaran pertama kali
        address registrant;     // Wallet pemilik / pendaftar asli
        bool exists;            // Flag eksistensi naskah
    }

    struct SimHashEntry {
        bytes32 contentHash;
        uint64 simHash;
    }

    // --- STORAGE STATE ---

    // Pemetaan contentHash (SHA-256) => Informasi Detail Naskah
    mapping(bytes32 => Manuscript) public manuscripts;

    // Pemetaan contentHash => Daftar Riwayat Partisipasi Lomba
    mapping(bytes32 => Participation[]) private _participations;

    // Daftar urutan seluruh contentHash yang pernah terdaftar di protokol
    bytes32[] public registeredHashes;

    // --- EVENTS ---

    event ManuscriptRegistered(
        bytes32 indexed contentHash,
        address indexed registrant,
        uint64 simHash,
        string title,
        uint256 timestamp
    );

    event ParticipationAdded(
        bytes32 indexed contentHash,
        uint256 indexed participationId,
        string competitionName,
        string status,
        address indexed recordedBy
    );

    event ParticipationDisputed(
        bytes32 indexed contentHash,
        uint256 indexed participationId,
        address indexed disputedBy,
        string note
    );

    // --- CUSTOM ERRORS (Gas Efficient) ---

    error ManuscriptAlreadyExists(bytes32 contentHash);
    error ManuscriptNotFound(bytes32 contentHash);
    error NotOriginalRegistrant(address caller, address registrant);
    error InvalidParticipationIndex(uint256 index);
    error ArrayLengthMismatch();
    error EmptyField();

    // --- FUNGSI UTAMA ---

    /**
     * @notice Mendaftarkan naskah baru untuk mengunci bukti waktu (timestamp) dan sidik jari naskah.
     * @param _contentHash Hash SHA-256 dari isi naskah (32 bytes).
     * @param _simHash 64-bit SimHash dari naskah untuk perbandingan kemiripan (Hamming Distance).
     * @param _title Judul karya ilmiah.
     * @param _category Bidang atau kategori karya ilmiah.
     * @param _author Nama penulis/ketua tim.
     * @param _institution Nama instansi/kampus penulis.
     */
    function registerManuscript(
        bytes32 _contentHash,
        uint64 _simHash,
        string calldata _title,
        string calldata _category,
        string calldata _author,
        string calldata _institution
    ) external {
        if (manuscripts[_contentHash].exists) {
            revert ManuscriptAlreadyExists(_contentHash);
        }
        if (bytes(_title).length == 0 || bytes(_author).length == 0) {
            revert EmptyField();
        }

        manuscripts[_contentHash] = Manuscript({
            contentHash: _contentHash,
            simHash: _simHash,
            title: _title,
            category: _category,
            author: _author,
            institution: _institution,
            registeredAt: block.timestamp,
            registrant: msg.sender,
            exists: true
        });

        registeredHashes.push(_contentHash);

        emit ManuscriptRegistered(
            _contentHash,
            msg.sender,
            _simHash,
            _title,
            block.timestamp
        );
    }

    /**
     * @notice Menambahkan catatan partisipasi lomba oleh panitia/penyelenggara lomba.
     */
    function addParticipation(
        bytes32 _contentHash,
        string calldata _competitionName,
        uint16 _year,
        string calldata _category,
        string calldata _status,
        string calldata _recorderName,
        string calldata _domain
    ) public {
        if (!manuscripts[_contentHash].exists) {
            revert ManuscriptNotFound(_contentHash);
        }

        uint256 newId = _participations[_contentHash].length + 1;

        _participations[_contentHash].push(Participation({
            id: newId,
            competitionName: _competitionName,
            year: _year,
            category: _category,
            status: _status,
            recordedBy: msg.sender,
            recorderName: _recorderName,
            domain: _domain,
            recordedAt: block.timestamp,
            isDisputed: false,
            disputeNote: ""
        }));

        emit ParticipationAdded(
            _contentHash,
            newId,
            _competitionName,
            _status,
            msg.sender
        );
    }

    /**
     * @notice Pencatatan partisipasi massal (batch upload) untuk efisiensi gas bagi panitia lomba.
     */
    function batchAddParticipation(
        bytes32[] calldata _contentHashes,
        string[] calldata _competitionNames,
        uint16[] calldata _years,
        string[] calldata _categories,
        string[] calldata _statuses,
        string calldata _recorderName,
        string calldata _domain
    ) external {
        uint256 total = _contentHashes.length;
        if (
            total != _competitionNames.length ||
            total != _years.length ||
            total != _categories.length ||
            total != _statuses.length
        ) {
            revert ArrayLengthMismatch();
        }

        for (uint256 i = 0; i < total; i++) {
            if (manuscripts[_contentHashes[i]].exists) {
                addParticipation(
                    _contentHashes[i],
                    _competitionNames[i],
                    _years[i],
                    _categories[i],
                    _statuses[i],
                    _recorderName,
                    _domain
                );
            }
        }
    }

    /**
     * @notice Hak bantah (dispute) yang HANYA bisa dipanggil oleh pendaftar asli naskah.
     * @param _contentHash Hash naskah yang menjadi target.
     * @param _participationIndex Indeks partisipasi pada daftar (0-indexed).
     * @param _disputeNote Alasan/keterangan bantahan (misal: "Naskah dicatut tanpa izin").
     */
    function disputeParticipation(
        bytes32 _contentHash,
        uint256 _participationIndex,
        string calldata _disputeNote
    ) external {
        if (!manuscripts[_contentHash].exists) {
            revert ManuscriptNotFound(_contentHash);
        }

        Manuscript storage m = manuscripts[_contentHash];
        if (m.registrant != msg.sender) {
            revert NotOriginalRegistrant(msg.sender, m.registrant);
        }

        if (_participationIndex >= _participations[_contentHash].length) {
            revert InvalidParticipationIndex(_participationIndex);
        }

        Participation storage p = _participations[_contentHash][_participationIndex];
        p.isDisputed = true;
        p.disputeNote = _disputeNote;

        emit ParticipationDisputed(
            _contentHash,
            p.id,
            msg.sender,
            _disputeNote
        );
    }

    // --- FUNGSI QUERY / READ ---

    /**
     * @notice Mengambil data naskah berdasarkan SHA-256 hash.
     */
    function getManuscript(bytes32 _contentHash) external view returns (Manuscript memory) {
        return manuscripts[_contentHash];
    }

    /**
     * @notice Mengambil seluruh linimasa riwayat partisipasi naskah.
     */
    function getParticipations(bytes32 _contentHash) external view returns (Participation[] memory) {
        return _participations[_contentHash];
    }

    /**
     * @notice Mengambil jumlah naskah yang terdaftar dalam protokol.
     */
    function getTotalManuscripts() external view returns (uint256) {
        return registeredHashes.length;
    }

    /**
     * @notice Mengambil seluruh daftar hash yang terdaftar.
     */
    function getAllHashes() external view returns (bytes32[] memory) {
        return registeredHashes;
    }

    /**
     * @notice Mengambil pasangan contentHash dan simHash dari semua naskah terdaftar.
     * Sangat berguna bagi frontend untuk menghitung kemiripan (SimHash Hamming Distance) secara lokal di browser.
     */
    function getAllSimHashes() external view returns (SimHashEntry[] memory) {
        uint256 total = registeredHashes.length;
        SimHashEntry[] memory list = new SimHashEntry[](total);

        for (uint256 i = 0; i < total; i++) {
            bytes32 hash = registeredHashes[i];
            list[i] = SimHashEntry({
                contentHash: hash,
                simHash: manuscripts[hash].simHash
            });
        }

        return list;
    }
}
