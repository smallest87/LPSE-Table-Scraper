/**
 * MASTER DATA - HARDCODED LISTS
 * Anda memegang kendali penuh atas data ini.
 * Masukkan semua variasi yang mungkin muncul secara presisi.
 */
const MASTER_DATA = {
    // Daftar Versi SPSE yang valid
    VERSI_SPSE: [
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
        "TA 2020"
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
    // Masukkan variasi "Ulang" di sini juga jika ingin ditangkap spesifik
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
 * @param {string} text - Teks kandidat dari HTML (misal: "TA 2025")
 * @param {Array} list - Array Master Data
 * @returns {string|null} - Item yang cocok, atau null
 */
function findMatch(text, list) {
    if (!text) return null;
    // Normalisasi teks input ke lowercase agar pencocokan tidak case-sensitive
    const lowerText = text.toLowerCase();
    
    // Cari item di list yang muncul di dalam teks input
    // Kita gunakan .find() untuk mengambil item list pertama yang cocok
    const match = list.find(item => lowerText.includes(item.toLowerCase()));
    
    return match || null; // Kembalikan item asli dari list (format casing asli)
}

class PackageParser {
    static parse(tdElement) {
        const paragraphs = tdElement.querySelectorAll('p');
        
        let result = {
            nama_paket: "",
            versi_spse: "",
            jenis_pekerjaan: "",
            tahun_anggaran: "",
            metode_pengadaan: [], // Berupa Array karena bisa ada banyak metode (Tender + Pascakualifikasi)
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

class LpseInterface {
    static getRawData(rowElement) {
        const cols = rowElement.querySelectorAll('td');
        if (cols.length < 5) return null;

        // Parsing kolom nama paket
        const details = PackageParser.parse(cols[1]);

        return {
            kode: cols[0].innerText.trim(),
            ...details,
            instansi: cols[2].innerText.trim(),
            tahapan: cols[3].innerText.trim(),
            hps: cols[4].innerText.trim()
        };
    }
}