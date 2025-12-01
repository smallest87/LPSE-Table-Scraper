// --- MASTER DATA ---
if (typeof MASTER_DATA === 'undefined') {
    var MASTER_DATA = {
        VERSI_SPSE: ["spse 3", "spse 4.5", "spse 4.4", "spse 4.3", "spse 5.0"],
        TAHUN_ANGGARAN: [
            "TA 2026", "TA 2025", "TA 2024", "TA 2023", "TA 2022", "TA 2021",
            "TA 2020", "TA 2019", "TA 2018", "TA 2017", "TA 2016", "TA 2015",
            "TA 2014", "TA 2013", "TA 2012", "TA 2011"
        ],
        JENIS_PENGADAAN: [
            "Pengadaan Barang", "Pekerjaan Konstruksi", "Jasa Konsultansi Badan Usaha Non Konstruksi",
            "Jasa Konsultansi Badan Usaha Konstruksi", "Jasa Konsultansi Perorangan Non Konstruksi",
            "Jasa Konsultansi Perorangan Konstruksi", "Jasa Lainnya", "Pekerjaan Konstruksi Terintegrasi"
        ],
        METODE_DAN_SISTEM: [
            "Tender", "Tender Ulang", "Tender Cepat", "Seleksi", "Seleksi Ulang",
            "Pengadaan Langsung", "Pengadaan Langsung Ulang", "Penunjukan Langsung", "E-Purchasing",
            "Pascakualifikasi Satu File", "Pascakualifikasi Dua File", "Pra Kualifikasi",
            "Sistem Gugur", "Harga Terendah", "Kualitas", "Pagu Anggaran", "Biaya Terendah"
        ]
    };
}

// --- HELPER ---
if (typeof findMatch === 'undefined') {
    window.findMatch = function(text, list) {
        if (!text) return null;
        const lowerText = text.toLowerCase();
        const matches = list.filter(item => lowerText.includes(item.toLowerCase()));
        if (matches.length === 0) return null;
        matches.sort((a, b) => b.length - a.length);
        return matches[0]; 
    };
}

// --- PARSERS ---

if (typeof NamaPaketParser === 'undefined') {
    window.NamaPaketParser = class NamaPaketParser {
        static parse(tdElement) {
            const paragraphs = tdElement.querySelectorAll('p');
            let result = { nama_paket: "", versi_spse: "", jenis_pekerjaan: "", tahun_anggaran: "", metode_pengadaan: [], nilai_kontrak: null, keterangan_lain: "" };

            if (paragraphs.length === 0) return result;

            // 1. Nama Paket
            const p1 = paragraphs[0];
            const anchor = p1.querySelector('a');
            if (anchor) {
                const tempAnchor = anchor.cloneNode(true);
                tempAnchor.querySelectorAll('.badge').forEach(b => b.remove());
                result.nama_paket = tempAnchor.innerText.trim();
            }

            // 2. Kandidat Teks
            let candidates = [];
            p1.querySelectorAll('.badge').forEach(b => candidates.push(b.innerText.trim()));
            if (paragraphs[1]) {
                const metaParts = paragraphs[1].innerText.split(' - ').map(s => s.trim());
                candidates = candidates.concat(metaParts);
            }

            // 3. Filter
            let unknownParts = [];
            candidates.forEach(text => {
                let isIdentified = false;
                if (findMatch(text, MASTER_DATA.VERSI_SPSE)) { result.versi_spse = findMatch(text, MASTER_DATA.VERSI_SPSE); isIdentified = true; }
                else if (findMatch(text, MASTER_DATA.TAHUN_ANGGARAN)) { result.tahun_anggaran = findMatch(text, MASTER_DATA.TAHUN_ANGGARAN); isIdentified = true; }
                else if (findMatch(text, MASTER_DATA.JENIS_PENGADAAN)) { result.jenis_pekerjaan = findMatch(text, MASTER_DATA.JENIS_PENGADAAN); isIdentified = true; }
                else if (findMatch(text, MASTER_DATA.METODE_DAN_SISTEM)) { result.metode_pengadaan.push(findMatch(text, MASTER_DATA.METODE_DAN_SISTEM)); isIdentified = true; }
                
                if (!isIdentified) unknownParts.push(text);
            });

            result.metode_pengadaan = result.metode_pengadaan.join(", ");
            result.keterangan_lain = unknownParts.join(" - ");

            // 4. Nilai Kontrak (Processing Langsung disini)
            if (paragraphs[2]) {
                const rawNilai = paragraphs[2].innerText.replace(/Nilai Kontrak\s*:/i, "").trim();
                result.nilai_kontrak = DataFormatter.parseNilaiKontrak(rawNilai);
            }

            return result;
        }
    }
}

if (typeof PencatatanParser === 'undefined') {
    window.PencatatanParser = class PencatatanParser {
        static parse(tdElement) {
            let result = { nama_paket: "", versi_spse: "", jenis_pekerjaan: "", tahun_anggaran: "", metode_pengadaan: [], nilai_kontrak: null, keterangan_lain: "" };
            
            const anchor = tdElement.querySelector('a');
            if (anchor) result.nama_paket = anchor.innerText.trim();

            let candidates = [];
            tdElement.querySelectorAll('.badge').forEach(b => candidates.push(b.innerText.trim()));
            tdElement.querySelectorAll('p').forEach(p => {
                const rawText = p.innerText;
                const normalized = rawText.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
                rawText.split(' - ').forEach(part => candidates.push(part.trim())); // Split original
                candidates.push(normalized); // Normalized
            });

            let unknownParts = [];
            candidates.forEach(text => {
                let isIdentified = false;
                if (findMatch(text, MASTER_DATA.VERSI_SPSE)) { result.versi_spse = findMatch(text, MASTER_DATA.VERSI_SPSE); isIdentified = true; }
                else if (findMatch(text, MASTER_DATA.TAHUN_ANGGARAN)) { result.tahun_anggaran = findMatch(text, MASTER_DATA.TAHUN_ANGGARAN); isIdentified = true; }
                else if (findMatch(text, MASTER_DATA.JENIS_PENGADAAN)) { result.jenis_pekerjaan = findMatch(text, MASTER_DATA.JENIS_PENGADAAN); isIdentified = true; }
                else {
                    const metode = findMatch(text, MASTER_DATA.METODE_DAN_SISTEM);
                    if (metode) {
                        if (!result.metode_pengadaan.includes(metode)) result.metode_pengadaan.push(metode);
                        isIdentified = true;
                    }
                }
                if (!isIdentified && text.length > 2 && !text.includes('TA 20')) unknownParts.push(text);
            });

            result.metode_pengadaan = result.metode_pengadaan.join(", ");
            result.keterangan_lain = [...new Set(unknownParts)].join(" - ");
            return result;
        }
    }
}

// --- INTERFACES ---

if (typeof LelangInterface === 'undefined') {
    window.LelangInterface = class LelangInterface {
        static getRawData(rowElement) {
            const cols = rowElement.querySelectorAll('td');
            if (cols.length < 5) return null;
            const details = NamaPaketParser.parse(cols[1]);
            return {
                kode: cols[0].innerText.trim(),
                ...details,
                instansi: cols[2].innerText.trim(),
                tahapan: cols[3].innerText.trim(),
                hps: DataFormatter.parseHPS(cols[4].innerText.trim())
            };
        }
    }
}

if (typeof NonTenderInterface === 'undefined') {
    window.NonTenderInterface = class NonTenderInterface {
        static getRawData(rowElement) {
            const cols = rowElement.querySelectorAll('td');
            if (cols.length < 5) return null;
            const details = NamaPaketParser.parse(cols[1]);
            return {
                kode: cols[0].innerText.trim(),
                ...details,
                instansi: cols[2].innerText.trim(),
                tahapan: cols[3].innerText.trim(),
                hps: DataFormatter.parseHPS(cols[4].innerText.trim())
            };
        }
    }
}

if (typeof PencatatanNonTenderInterface === 'undefined') {
    window.PencatatanNonTenderInterface = class PencatatanNonTenderInterface {
        static getRawData(rowElement) {
            const cols = rowElement.querySelectorAll('td');
            if (cols.length < 5) return null;
            const details = PencatatanParser.parse(cols[1]);
            return {
                kode: cols[0].innerText.trim(),
                ...details,
                instansi: cols[2].innerText.trim(),
                tahapan: cols[3].innerText.trim(),
                hps: DataFormatter.parseHPS(cols[4].innerText.trim())
            };
        }
    }
}

if (typeof PencatatanSwakelolaInterface === 'undefined') {
    window.PencatatanSwakelolaInterface = class PencatatanSwakelolaInterface {
        static getRawData(rowElement) {
            const cols = rowElement.querySelectorAll('td');
            if (cols.length < 5) return null;
            const details = PencatatanParser.parse(cols[1]);
            return {
                kode: cols[0].innerText.trim(),
                ...details,
                instansi: cols[2].innerText.trim(),
                tahapan: cols[3].innerText.trim(),
                hps: DataFormatter.parseHPS(cols[4].innerText.trim())
            };
        }
    }
}

if (typeof PencatatanPengadaanDaruratInterface === 'undefined') {
    window.PencatatanPengadaanDaruratInterface = class PencatatanPengadaanDaruratInterface {
        static getRawData(rowElement) {
            const cols = rowElement.querySelectorAll('td');
            if (cols.length < 5) return null;
            const details = NamaPaketParser.parse(cols[1]);
            return {
                kode_paket: cols[0].innerText.trim(),
                ...details,
                instansi: cols[2].innerText.trim(),
                status: cols[3].innerText.trim(),
                pagu: DataFormatter.parseHPS(cols[4].innerText.trim())
            };
        }
    }
}