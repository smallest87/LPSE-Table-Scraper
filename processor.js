/**
 * MASTER DATA - HARDCODED LISTS
 * Anda memegang kendali penuh atas data ini.
 * Masukkan semua variasi yang mungkin muncul secara presisi.
 */
const MASTER_DATA = {
    // Daftar Versi SPSE yang valid
    VERSI_SPSE: [
        "spse 3", 
        "spse 4.5", 
        "spse 4.4", 
        "spse 4.3", 
        "spse 5.0"
    ],

    // Daftar Tahun Anggaran
    TAHUN_ANGGARAN: [
        "TA 2026", 
        "TA 2025", 
        "TA 2024", 
        "TA 2023", 
        "TA 2022",
        "TA 2021",
        "TA 2020",
        "TA 2019",
        "TA 2018",
        "TA 2017",
        "TA 2016",
        "TA 2015",
        "TA 2014",
        "TA 2013",
        "TA 2012",
        "TA 2011"
    ],

    // Daftar Jenis Pengadaan
    JENIS_PENGADAAN: [
        "Pengadaan Barang",
        "Pekerjaan Konstruksi",
        "Jasa Konsultansi Badan Usaha Non Konstruksi",
        "Jasa Konsultansi Badan Usaha Konstruksi",
        "Jasa Konsultansi Perorangan Non Konstruksi",
        "Jasa Konsultansi Perorangan Konstruksi",
        "Jasa Lainnya",
        "Pekerjaan Konstruksi Terintegrasi"
    ],

    // Daftar Metode Pemilihan / Sistem Kontrak
    METODE_DAN_SISTEM: [
        "Tender",
        "Tender Ulang",
        "Tender Cepat",
        "Seleksi",
        "Seleksi Ulang",
        "Pengadaan Langsung",
        "Pengadaan Langsung Ulang",
        "Penunjukan Langsung",
        "E-Purchasing",
        "Pascakualifikasi Satu File",
        "Pascakualifikasi Dua File",
        "Pra Kualifikasi",
        "Sistem Gugur",
        "Harga Terendah",
        "Kualitas",
        "Pagu Anggaran",
        "Biaya Terendah"
    ]
};

/**
 * Helper untuk mengecek apakah sebuah teks mengandung salah satu item dari list
 * PERBAIKAN: Menggunakan logika "Longest Match First".
 * Mencari semua yang cocok, lalu mengambil yang string-nya paling panjang.
 * Ini mencegah "Tender" terpilih padahal teks aslinya "Tender Ulang".
 * * @param {string} text - Teks kandidat dari HTML
 * @param {Array} list - Array Master Data
 * @returns {string|null} - Item yang cocok paling spesifik, atau null
 */
function findMatch(text, list) {
    if (!text) return null;
    const lowerText = text.toLowerCase();
    
    // 1. Cari SEMUA item di list yang muncul di dalam teks input
    const matches = list.filter(item => lowerText.includes(item.toLowerCase()));
    
    // 2. Jika tidak ada yang cocok, kembalikan null
    if (matches.length === 0) return null;

    // 3. Urutkan hasil pencocokan berdasarkan panjang string (DESCENDING / Terpanjang dulu)
    // Contoh: ["Tender", "Tender Ulang"] -> menjadi ["Tender Ulang", "Tender"]
    matches.sort((a, b) => b.length - a.length);

    // 4. Kembalikan item terpanjang (paling spesifik)
    return matches[0]; 
}

class NamaPaketParser {
    static parse(tdElement) {
        const paragraphs = tdElement.querySelectorAll('p');
        
        let result = {
            nama_paket: "",
            versi_spse: "",
            jenis_pekerjaan: "",
            tahun_anggaran: "",
            metode_pengadaan: [], // Berupa Array karena bisa ada banyak metode
            nilai_kontrak: "0",
            keterangan_lain: ""
        };

        if (paragraphs.length === 0) return result;

        // 1. Ekstraksi Nama Paket (Bersihkan Badge dari Link)
        const p1 = paragraphs[0];
        const anchor = p1.querySelector('a');
        if (anchor) {
            const tempAnchor = anchor.cloneNode(true);
            tempAnchor.querySelectorAll('.badge').forEach(b => b.remove());
            result.nama_paket = tempAnchor.innerText.trim();
        }

        // 2. Kumpulkan Kandidat Teks (Badges + Metadata Lines)
        let candidates = [];
        
        // Ambil Badges
        p1.querySelectorAll('.badge').forEach(b => candidates.push(b.innerText.trim()));
        
        // Ambil Metadata (Paragraf 2)
        if (paragraphs[1]) {
            // Split berdasarkan " - "
            const metaParts = paragraphs[1].innerText.split(' - ').map(s => s.trim());
            candidates = candidates.concat(metaParts);
        }

        // 3. Loop Kandidat dan Bandingkan dengan MASTER_DATA
        let unknownParts = [];

        candidates.forEach(text => {
            let isIdentified = false;

            // Cek Versi SPSE
            const versi = findMatch(text, MASTER_DATA.VERSI_SPSE);
            if (versi) {
                result.versi_spse = versi;
                isIdentified = true;
            }

            // Cek Tahun Anggaran
            const tahun = findMatch(text, MASTER_DATA.TAHUN_ANGGARAN);
            if (tahun && !isIdentified) {
                result.tahun_anggaran = tahun;
                isIdentified = true;
            }

            // Cek Jenis Pengadaan
            const jenis = findMatch(text, MASTER_DATA.JENIS_PENGADAAN);
            if (jenis && !isIdentified) {
                result.jenis_pekerjaan = jenis;
                isIdentified = true;
            }

            // Cek Metode/Sistem (Bisa multiple, jadi kita tampung di array)
            const metode = findMatch(text, MASTER_DATA.METODE_DAN_SISTEM);
            if (metode && !isIdentified) {
                result.metode_pengadaan.push(metode); // Push ke array
                isIdentified = true;
            }

            // Jika tidak cocok dengan list manapun, anggap keterangan lain
            if (!isIdentified) {
                unknownParts.push(text);
            }
        });

        // Gabungkan array metode menjadi string
        result.metode_pengadaan = result.metode_pengadaan.join(", ");
        
        // Gabungkan sisa data yang tidak teridentifikasi
        result.keterangan_lain = unknownParts.join(" - ");

        // 4. Ambil Nilai Kontrak (Paragraf 3)
        if (paragraphs[2]) {
            result.nilai_kontrak = paragraphs[2].innerText.replace(/Nilai Kontrak\s*:/i, "").trim();
        }

        return result;
    }
}

/**
 * Parser Khusus untuk struktur Pencatatan (Non Tender/Swakelola/Darurat)
 * Struktur HTML: <td> <a>Nama</a> <badge> <badge> <p>Meta</p> </td>
 */
class PencatatanParser {
    static parse(tdElement) {
        let result = {
            nama_paket: "",
            versi_spse: "",
            jenis_pekerjaan: "",
            tahun_anggaran: "",
            metode_pengadaan: [],
            keterangan_lain: ""
        };

        // 1. Ekstraksi Nama Paket
        // Pada pencatatan, Nama Paket ada di tag <a> langsung (child dari td), bukan di dalam <p>
        const anchor = tdElement.querySelector('a');
        if (anchor) {
            result.nama_paket = anchor.innerText.trim();
        }

        // 2. Kumpulkan Kandidat Teks untuk Filter
        let candidates = [];

        // A. Ambil dari Badge (biasanya Versi SPSE & Metode seperti "Pengadaan Langsung")
        const badges = tdElement.querySelectorAll('.badge');
        badges.forEach(b => candidates.push(b.innerText.trim()));

        // B. Ambil dari Paragraf Metadata (biasanya "Jasa Lainnya - TA 2025")
        const paragraphs = tdElement.querySelectorAll('p');
        paragraphs.forEach(p => {
            // Split berdasarkan " - "
            const parts = p.innerText.split(' - ');
            parts.forEach(part => candidates.push(part.trim()));
        });

        // 3. Filter Candidates menggunakan MASTER_DATA
        let unknownParts = [];

        candidates.forEach(text => {
            let isIdentified = false;

            // Cek Versi SPSE
            const versi = findMatch(text, MASTER_DATA.VERSI_SPSE);
            if (versi) {
                result.versi_spse = versi;
                isIdentified = true;
            }

            // Cek Tahun Anggaran
            const tahun = findMatch(text, MASTER_DATA.TAHUN_ANGGARAN);
            if (tahun && !isIdentified) {
                result.tahun_anggaran = tahun;
                isIdentified = true;
            }

            // Cek Jenis Pengadaan
            const jenis = findMatch(text, MASTER_DATA.JENIS_PENGADAAN);
            if (jenis && !isIdentified) {
                result.jenis_pekerjaan = jenis;
                isIdentified = true;
            }

            // Cek Metode/Sistem
            const metode = findMatch(text, MASTER_DATA.METODE_DAN_SISTEM);
            if (metode && !isIdentified) {
                // Hindari duplikasi jika metode yang sama muncul di badge DAN paragraph
                if (!result.metode_pengadaan.includes(metode)) {
                    result.metode_pengadaan.push(metode);
                }
                isIdentified = true;
            }

            if (!isIdentified) {
                unknownParts.push(text);
            }
        });

        // Format hasil akhir
        result.metode_pengadaan = result.metode_pengadaan.join(", ");
        result.keterangan_lain = unknownParts.join(" - ");
        
        // Pencatatan biasanya tidak menampilkan "Nilai Kontrak" di kolom Nama Paket
        // Tapi jika ada polanya nanti, bisa ditambahkan disini.

        return result;
    }
}

class LelangInterface {
    static getRawData(rowElement) {
        const cols = rowElement.querySelectorAll('td');
        if (cols.length < 5) return null;

        // Parsing kolom nama paket
        const details = NamaPaketParser.parse(cols[1]);

        return {
            kode: cols[0].innerText.trim(),
            ...details,
            instansi: cols[2].innerText.trim(),
            tahapan: cols[3].innerText.trim(),
            hps: cols[4].innerText.trim()
        };
    }
}

class NonTenderInterface {
    static getRawData(rowElement) {
        const cols = rowElement.querySelectorAll('td');
        if (cols.length < 5) return null;

        // Parsing kolom nama paket
        const details = NamaPaketParser.parse(cols[1]);

        return {
            kode: cols[0].innerText.trim(),
            ...details,
            instansi: cols[2].innerText.trim(),
            tahapan: cols[3].innerText.trim(),
            hps: cols[4].innerText.trim()
        };
    }
}

class PencatatanNonTenderInterface {
    static getRawData(rowElement) {
        const cols = rowElement.querySelectorAll('td');
        // Pencatatan biasanya minimal 5 kolom
        if (cols.length < 5) return null;

        // PENGGUNAAN PARSER BARU
        const details = PencatatanParser.parse(cols[1]);

        return {
            kode: cols[0].innerText.trim(),     // Kolom 0: Kode
            ...details,                          // Kolom 1: Nama Paket (Parsed)
            instansi: cols[2].innerText.trim(),  // Kolom 2: Instansi
            tahapan: cols[3].innerText.trim(),   // Kolom 3: Status (User Info: Status)
            hps: cols[4].innerText.trim()        // Kolom 4: Pagu (User Info: Pagu)
        };
    }
}

class PencatatanSwakelolaInterface {
    static getRawData(rowElement) {
        const cols = rowElement.querySelectorAll('td');
        if (cols.length < 5) return null;

        // Parsing kolom nama paket
        const details = NamaPaketParser.parse(cols[1]);

        return {
            kode_paket: cols[0].innerText.trim(),
            ...details,
            instansi: cols[2].innerText.trim(),
            status: cols[3].innerText.trim(),
            pagu: cols[4].innerText.trim()
        };
    }
}

class PencatatanPengadaanDaruratInterface {
    static getRawData(rowElement) {
        const cols = rowElement.querySelectorAll('td');
        if (cols.length < 5) return null;

        // Parsing kolom nama paket
        const details = NamaPaketParser.parse(cols[1]);

        return {
            kode_paket: cols[0].innerText.trim(),
            ...details,
            instansi: cols[2].innerText.trim(),
            status: cols[3].innerText.trim(),
            pagu: cols[4].innerText.trim()
        };
    }
}