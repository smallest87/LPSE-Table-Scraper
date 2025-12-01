class PackageParser {
    static parse(tdElement) {
        const paragraphs = tdElement.querySelectorAll('p');
        
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

        // --- P1: Nama & Versi ---
        const p1 = paragraphs[0];
        const anchor = p1.querySelector('a');
        const badge = p1.querySelector('.badge');

        if (anchor) result.nama_paket = anchor.innerText.trim();
        if (badge) result.versi_spse = badge.innerText.trim();

        // --- P2: Metadata ---
        if (paragraphs[1]) {
            const rawMeta = paragraphs[1].innerText;
            const parts = rawMeta.split(' - ').map(s => s.trim());

            result.jenis_pekerjaan = parts[0] || "";
            result.tahun_anggaran  = parts[1] || "";
            result.jenis_kontrak   = parts[2] || ""; 
            result.sistem_kontrak  = parts[3] || ""; 
        }

        // --- P3: Nilai Kontrak ---
        if (paragraphs[2]) {
            const rawNilai = paragraphs[2].innerText;
            result.nilai_kontrak = rawNilai.replace(/Nilai Kontrak\s*:/i, "").trim();
        }

        return result;
    }
}

class LpseInterface {
    static getRawData(rowElement) {
        const cols = rowElement.querySelectorAll('td');
        if (cols.length < 5) return null;

        const packageDetails = PackageParser.parse(cols[1]);

        return {
            kode: cols[0].innerText.trim(),
            ...packageDetails, 
            instansi: cols[2].innerText.trim(),
            tahapan: cols[3].innerText.trim(),
            hps: cols[4].innerText.trim()
        };
    }
    // method toCSV SUDAH DIHAPUS DARI SINI
}