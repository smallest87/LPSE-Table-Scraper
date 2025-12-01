/**
 * Class khusus untuk membedah kolom HTML 'Nama Paket' yang kompleks
 */
class PackageParser {
    static parse(tdElement) {
        // Ambil semua elemen paragraf <p> di dalam sel
        const paragraphs = tdElement.querySelectorAll('p');
        
        // Default values
        let result = {
            nama_paket: "",
            versi_spse: "",
            jenis_pekerjaan: "",
            tahun_anggaran: "",
            jenis_kontrak: "",
            sistem_kontrak: "",
            nilai_kontrak: ""
        };

        if (paragraphs.length === 0) return result;

        // --- PARAGRAF 1: Nama Paket & Versi SPSE ---
        const p1 = paragraphs[0];
        const anchor = p1.querySelector('a');
        const badge = p1.querySelector('.badge');

        if (anchor) result.nama_paket = anchor.innerText.trim();
        if (badge) result.versi_spse = badge.innerText.trim();

        // --- PARAGRAF 2: Metadata (Dipisah dengan " - ") ---
        // Contoh: Pekerjaan Konstruksi - TA 2025 - Tender - Pascakualifikasi...
        if (paragraphs[1]) {
            const rawMeta = paragraphs[1].innerText;
            const parts = rawMeta.split(' - ').map(s => s.trim());

            // Mapping berdasarkan urutan split
            result.jenis_pekerjaan = parts[0] || "";
            result.tahun_anggaran  = parts[1] || "";
            result.jenis_kontrak   = parts[2] || ""; // User define: 'Tender'
            result.sistem_kontrak  = parts[3] || ""; // User define: 'Pascakualifikasi...'
        }

        // --- PARAGRAF 3: Nilai Kontrak ---
        // Contoh: Nilai Kontrak : Nilai Kontrak belum dibuat
        if (paragraphs[2]) {
            const rawNilai = paragraphs[2].innerText;
            // Hapus prefix "Nilai Kontrak :"
            result.nilai_kontrak = rawNilai.replace(/Nilai Kontrak\s*:/i, "").trim();
        }

        return result;
    }
}

/**
 * Interface Utama Pengolah Data
 */
class LpseInterface {
    static getRawData(rowElement) {
        const cols = rowElement.querySelectorAll('td');

        // Validasi: Baris data valid minimal punya 5 kolom (sesuai thead tabel LPSE)
        if (cols.length < 5) return null;

        // Parsing kolom 1 (Nama Paket) menggunakan parser khusus
        const packageDetails = PackageParser.parse(cols[1]);

        return {
            kode: cols[0].innerText.trim(),
            // Spread operator untuk menggabungkan hasil parsing detail
            ...packageDetails, 
            instansi: cols[2].innerText.trim(),
            tahapan: cols[3].innerText.trim(),
            hps: cols[4].innerText.trim()
        };
    }

    static toCSV(dataArray) {
        // Header CSV diperbarui sesuai pecahan kolom baru
        const header = [
            "Kode", 
            "Nama Paket", 
            "Versi SPSE", 
            "Jenis Pekerjaan", 
            "Tahun Anggaran", 
            "Jenis Kontrak", 
            "Sistem Kontrak", 
            "Nilai Kontrak", 
            "Instansi", 
            "Tahapan", 
            "HPS"
        ].join(";") + "\n";
        
        const body = dataArray.map(item => {
            return [
                `"${(item.kode || "").replace(/"/g, '""')}"`,
                `"${(item.nama_paket || "").replace(/"/g, '""')}"`,
                `"${(item.versi_spse || "").replace(/"/g, '""')}"`,
                `"${(item.jenis_pekerjaan || "").replace(/"/g, '""')}"`,
                `"${(item.tahun_anggaran || "").replace(/"/g, '""')}"`,
                `"${(item.jenis_kontrak || "").replace(/"/g, '""')}"`,
                `"${(item.sistem_kontrak || "").replace(/"/g, '""')}"`,
                `"${(item.nilai_kontrak || "").replace(/"/g, '""')}"`,
                `"${(item.instansi || "").replace(/"/g, '""')}"`,
                `"${(item.tahapan || "").replace(/"/g, '""')}"`,
                `"${(item.hps || "").replace(/"/g, '""')}"`
            ].join(";");
        }).join("\n");

        return header + body;
    }
}