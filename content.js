(function() {
    // 1. Target tabel spesifik berdasarkan ID dari source code
    const table = document.querySelector('#tbllelang');

    if (!table) {
        alert('Tabel #tbllelang tidak ditemukan! Pastikan kamu berada di halaman cari paket LPSE.');
        return;
    }

    let csvContent = "Kode;Nama Paket;Instansi;Tahapan;HPS;Jadwal\n";
    let count = 0;

    // 2. Ambil semua baris di tbody
    // Kita abaikan thead karena kita sudah hardcode header di atas
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        
        // Pastikan baris memiliki data (bukan baris "No data available")
        if (cols.length > 1) {
            // Mapping kolom berdasarkan struktur thead HTML:
            // Index 0: Kode
            // Index 1: Nama Paket (Seringkali HTML kompleks)
            // Index 2: Instansi
            // Index 3: Tahapan
            // Index 4: HPS
            // Index 5: Jadwal Pengumuman

            const kode = cleanText(cols[0]?.innerText);
            const namaPaket = cleanText(cols[1]?.innerText); 
            const instansi = cleanText(cols[2]?.innerText);
            const tahapan = cleanText(cols[3]?.innerText);
            const hps = cleanText(cols[4]?.innerText);
            const jadwal = cleanText(cols[5]?.innerText);

            // Gabungkan dengan delimiter (titik koma agar aman jika ada koma di angka uang)
            csvContent += `${kode};"${namaPaket}";"${instansi}";"${tahapan}";"${hps}";"${jadwal}"\n`;
            count++;
        }
    });

    // Fungsi helper untuk membersihkan teks dari enter/tab berlebih
    function cleanText(text) {
        if (!text) return "";
        return text.replace(/[\r\n]+/g, " ").trim();
    }

    // 3. Kirim data kembali ke Popup
    chrome.runtime.sendMessage({
        action: "data_scraped",
        data: csvContent,
        count: count
    });

})();