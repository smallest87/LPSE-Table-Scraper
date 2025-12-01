if (typeof LpseRepository === 'undefined') {
    window.LpseRepository = class LpseRepository {
        static toCSV(dataArray) {
            const header = [
                "Kode", "Nama Paket", "Versi SPSE", "Jenis Pekerjaan", 
                "Tahun Anggaran", "Jenis Kontrak", "Sistem Kontrak", 
                "Nilai Kontrak", "Instansi", "Tahapan", "HPS"
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
                    // HANDLING NULL: Jika null ganti string kosong, jika ada isi pakai isinya
                    `"${(item.nilai_kontrak !== null ? item.nilai_kontrak : "")}"`,
                    `"${(item.instansi || "").replace(/"/g, '""')}"`,
                    `"${(item.tahapan || "").replace(/"/g, '""')}"`,
                    `"${(item.hps || "").replace(/"/g, '""')}"`
                ].join(";");
            }).join("\n");
    
            return header + body;
        }
    
        static toJSON(dataArray) {
            return JSON.stringify(dataArray, null, 4);
        }
    }
}