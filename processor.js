class LpseInterface {
    /**
     * Mengambil data mentah dari baris tabel (TR)
     * Kolom target: Kode, Nama Paket, Instansi, Tahapan, HPS
     */
    static getRawData(rowElement) {
        const cols = rowElement.querySelectorAll('td');

        // Validasi sederhana: pastikan baris memiliki cukup kolom
        // (Baris "No data available" biasanya hanya punya 1 kolom)
        if (cols.length < 5) return null;

        return {
            // Index 0: Kode
            kode: cols[0].innerText, 
            
            // Index 1: Nama Paket (Berisi Nama + Link + Status + Pagu, diambil gelondongan)
            nama_paket: cols[1].innerText, 
            
            // Index 2: K/L/Instansi Lainnya
            instansi: cols[2].innerText, 
            
            // Index 3: Tahapan
            tahapan: cols[3].innerText, 
            
            // Index 4: HPS
            hps: cols[4].innerText 
        };
    }

    /**
     * Konversi Array Object ke CSV String
     * Hanya melakukan escaping tanda kutip (") agar format CSV tidak rusak.
     */
    static toCSV(dataArray) {
        // Header sesuai permintaan
        const header = "Kode;Nama Paket;K/L/Instansi;Tahapan;HPS\n";
        
        const body = dataArray.map(item => {
            return [
                // Bungkus setiap value dengan kutip ganda (") untuk keamanan CSV
                // Ganti kutip di dalam teks menjadi double-quote ("") sesuai standar CSV
                `"${(item.kode || "").replace(/"/g, '""')}"`,
                `"${(item.nama_paket || "").replace(/"/g, '""')}"`,
                `"${(item.instansi || "").replace(/"/g, '""')}"`,
                `"${(item.tahapan || "").replace(/"/g, '""')}"`,
                `"${(item.hps || "").replace(/"/g, '""')}"`
            ].join(";");
        }).join("\n");

        return header + body;
    }
}