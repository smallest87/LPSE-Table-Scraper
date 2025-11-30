(function() {
    // 1. Cari elemen tabel target berdasarkan ID
    const table = document.querySelector('#tbllelang');

    // Jika tabel belum ter-load (misal user menekan tombol terlalu cepat), hentikan proses
    if (!table) {
        alert('[LPSE Scraper] Tabel data tidak ditemukan. Pastikan halaman sudah memuat daftar lelang.');
        return;
    }

    // 2. Ambil semua baris (tr) di dalam body tabel
    const rows = table.querySelectorAll('tbody tr');
    const dataList = [];

    // 3. Iterasi setiap baris
    rows.forEach((row, index) => {
        // Panggil Interface (LpseInterface) yang ada di processor.js
        // Kita mengirim elemen raw 'row' agar diolah oleh Interface
        const rowData = LpseInterface.getRawData(row);

        // Jika data valid (bukan null), masukkan ke list
        if (rowData) {
            dataList.push(rowData);
        }
    });

    // 4. Ubah List Object menjadi string CSV menggunakan Interface
    const csvOutput = LpseInterface.toCSV(dataList);

    // 5. Kirim data matang ke Popup (popup.js)
    chrome.runtime.sendMessage({
        action: "data_scraped",
        data: csvOutput,
        count: dataList.length
    });

    console.log(`[LPSE Scraper] Selesai. ${dataList.length} data berhasil diambil.`);
})();