// --- MASTER DATA ---
if (typeof MASTER_DATA === 'undefined') {
    var MASTER_DATA = {
        VERSI_SPSE: ["spse 3", "spse 4.5", "spse 4.4", "spse 4.3", "spse 5.0"],
        TAHUN_ANGGARAN: ["TA 2026", "TA 2025", "TA 2024", "TA 2023", "TA 2022", "TA 2021", "TA 2020", "TA 2019"],
        JENIS_PENGADAAN: ["Pengadaan Barang", "Pekerjaan Konstruksi", "Jasa Konsultansi Badan Usaha Non Konstruksi", "Jasa Konsultansi Badan Usaha Konstruksi", "Jasa Konsultansi Perorangan Non Konstruksi", "Jasa Lainnya", "Pekerjaan Konstruksi Terintegrasi"],
        METODE_DAN_SISTEM: ["Tender", "Tender Ulang", "Tender Cepat", "Seleksi", "Pengadaan Langsung", "Penunjukan Langsung", "E-Purchasing", "Pascakualifikasi Satu File", "Sistem Gugur", "Harga Terendah", "Kualitas", "Pagu Anggaran", "Swakelola"]
    };
}

if (typeof findMatch === 'undefined') {
    window.findMatch = function(text, list) {
        if (!text) return null;
        const matches = list.filter(item => text.toLowerCase().includes(item.toLowerCase()));
        if (matches.length === 0) return null;
        matches.sort((a, b) => b.length - a.length);
        return matches[0]; 
    };
}

// --- PARSER DAFTAR (LIST) ---
if (typeof NamaPaketParser === 'undefined') {
    window.NamaPaketParser = class NamaPaketParser {
        static parse(tdElement) {
            const paragraphs = tdElement.querySelectorAll('p');
            let result = { nama_paket: "", link_url: "", versi_spse: "", jenis_pekerjaan: "", tahun_anggaran: "", metode_pengadaan: [], nilai_kontrak: 0, keterangan_lain: "" };
            if (paragraphs.length === 0) return result;

            const p1 = paragraphs[0];
            const anchor = p1.querySelector('a');
            if (anchor) {
                const tempAnchor = anchor.cloneNode(true);
                tempAnchor.querySelectorAll('.badge').forEach(b => b.remove());
                result.nama_paket = tempAnchor.innerText.trim();
                result.link_url = anchor.href;
            }

            let candidates = [];
            p1.querySelectorAll('.badge').forEach(b => candidates.push(b.innerText.trim()));
            if (paragraphs[1]) candidates = candidates.concat(paragraphs[1].innerText.split(' - ').map(s => s.trim()));

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

            if (paragraphs[2]) {
                result.nilai_kontrak = DataFormatter.parseNilaiKontrak(paragraphs[2].innerText.replace(/Nilai Kontrak\s*:/i, "").trim());
            }
            return result;
        }
    }
}

// --- PARSER PENCATATAN ---
if (typeof PencatatanParser === 'undefined') {
    window.PencatatanParser = class PencatatanParser {
        static parse(tdElement) {
            let result = { nama_paket: "", link_url: "", versi_spse: "", jenis_pekerjaan: "", tahun_anggaran: "", metode_pengadaan: [], nilai_kontrak: 0, keterangan_lain: "" };
            const anchor = tdElement.querySelector('a');
            if (anchor) { result.nama_paket = anchor.innerText.trim(); result.link_url = anchor.href; }
            
            let candidates = [];
            tdElement.querySelectorAll('.badge').forEach(b => candidates.push(b.innerText.trim()));
            tdElement.querySelectorAll('p').forEach(p => {
                const rawText = p.innerText;
                candidates.push(rawText.replace(/-/g, ' ').replace(/\s+/g, ' ').trim());
                rawText.split(' - ').forEach(part => candidates.push(part.trim()));
            });

            let unknownParts = [];
            candidates.forEach(text => {
                let isIdentified = false;
                if (findMatch(text, MASTER_DATA.VERSI_SPSE)) { result.versi_spse = findMatch(text, MASTER_DATA.VERSI_SPSE); isIdentified = true; }
                else if (findMatch(text, MASTER_DATA.TAHUN_ANGGARAN)) { result.tahun_anggaran = findMatch(text, MASTER_DATA.TAHUN_ANGGARAN); isIdentified = true; }
                else if (findMatch(text, MASTER_DATA.JENIS_PENGADAAN)) { result.jenis_pekerjaan = findMatch(text, MASTER_DATA.JENIS_PENGADAAN); isIdentified = true; }
                else {
                    const metode = findMatch(text, MASTER_DATA.METODE_DAN_SISTEM);
                    if (metode) { if (!result.metode_pengadaan.includes(metode)) result.metode_pengadaan.push(metode); isIdentified = true; }
                }
                if (!isIdentified && text.length > 2 && !text.includes('TA 20')) unknownParts.push(text);
            });
            result.metode_pengadaan = result.metode_pengadaan.join(", ");
            result.keterangan_lain = [...new Set(unknownParts)].join(" - ");
            return result;
        }
    }
}

// --- PARSER DETAIL PAGE (DIPERBARUI KHUSUS SYARAT KUALIFIKASI) ---
if (typeof DetailParser === 'undefined') {
    window.DetailParser = class DetailParser {
        static parse(tableElement) {
            let result = {};
            const rows = tableElement.querySelectorAll('tr');
            
            rows.forEach(row => {
                const cells = row.children;
                // Kita loop manual karena di baris yang sama ada <th>Label</th> dan <td>Value</td>
                for (let i = 0; i < cells.length; i++) {
                    const cell = cells[i];
                    
                    // Deteksi Header (TH) atau yang punya class bgwarning
                    if (cell.tagName === 'TH' || cell.classList.contains('bgwarning')) {
                        let rawKey = cell.innerText.trim();
                        if (!rawKey) continue;
                        
                        // Buat key yang bersih (syarat_kualifikasi, nilai_pagu, dll)
                        let key = rawKey.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                        
                        // Value ada di sel berikutnya
                        let nextCell = cells[i + 1];
                        let value = "";

                        if (nextCell && nextCell.tagName === 'TD') {
                            
                            // 1. HANDLER KHUSUS: SYARAT KUALIFIKASI
                            if (key === 'syarat_kualifikasi') {
                                value = this.parseSyaratKualifikasi(nextCell);
                            } 
                            
                            // 2. HANDLER UMUM
                            else {
                                value = nextCell.innerText.trim();
                                
                                // Format Angka/Uang
                                if (key.includes('hps') || key.includes('pagu') || key.includes('nilai')) {
                                    value = DataFormatter.parseHPS(value);
                                } 
                                // Bersihkan Kode
                                else if (key === 'kode_tender') {
                                    value = value.replace(/\s+/g, '').trim(); 
                                } 
                                // Bersihkan Tabel RUP (jika ada tabel lain)
                                else if (nextCell.querySelector('table')) {
                                    value = value.replace(/[\r\n]+/g, " ").trim();
                                }
                            }
                            
                            result[key] = value;
                        }
                    }
                }
            });
            return result;
        }

        // --- ENGINE PARSER UNTUK SYARAT KUALIFIKASI ---
        static parseSyaratKualifikasi(tdElement) {
            let textOutput = [];
            
            // Kita iterate childNodes langsung agar urutan (Judul -> Tabel) terjaga
            tdElement.childNodes.forEach(node => {
                
                // A. JUDUL KATEGORI (misal: "Persyaratan Kualifikasi Administrasi...")
                // Biasanya dalam tag <strong> atau <b>
                if (node.nodeName === 'STRONG' || node.nodeName === 'B') {
                    const title = node.innerText.trim();
                    if (title) textOutput.push(`\n[${title}]`);
                }
                
                // B. TABEL PERSYARATAN
                else if (node.nodeName === 'TABLE') {
                    const rows = node.querySelectorAll('tr');
                    
                    rows.forEach(row => {
                        const cols = row.querySelectorAll('td');
                        
                        // Cek apakah ada NESTED TABLE (Tabel dalam Tabel)
                        // Contoh kasus: "Jenis Izin" & "NIB 2020"
                        const nestedTable = row.querySelector('table');
                        
                        if (nestedTable) {
                            // Parsing tabel izin yang bersarang
                            const nRows = nestedTable.querySelectorAll('tr');
                            nRows.forEach(nRow => {
                                const nCols = nRow.querySelectorAll('td');
                                let rowParts = [];
                                nCols.forEach(c => rowParts.push(c.innerText.trim().replace(/[\r\n]+/g, " ")));
                                
                                // Format: "- Jenis Izin : Konstruksi Gedung..."
                                if (rowParts.length > 0) {
                                    textOutput.push(`  - ${rowParts.join(" : ")}`);
                                }
                            });
                        } 
                        else if (cols.length > 0) {
                            // Teks Biasa (misal: "Memiliki NPWP...")
                            // Ambil teks dari kolom pertama (biasanya cuma 1 kolom utama)
                            let txt = cols[0].innerText.trim();
                            // Bersihkan newlines aneh
                            txt = txt.replace(/[\r\n]+/g, " ");
                            
                            if (txt) textOutput.push(`- ${txt}`);
                        }
                    });
                }
            });

            return textOutput.join("\n").trim();
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

// --- INTERFACE DETAIL PAGE ---
if (typeof DetailPageInterface === 'undefined') {
    window.DetailPageInterface = class DetailPageInterface {
        static getRawData(tableElement) {
            const parsedData = DetailParser.parse(tableElement);
            // Normalisasi agar bisa di-merge: pastikan ada 'kode'
            if (parsedData.kode_tender) {
                parsedData.kode = parsedData.kode_tender; // Mapping Kode Tender -> Kode
            }
            return parsedData;
        }
    }
}