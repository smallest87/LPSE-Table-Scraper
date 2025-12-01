(function() {
    const table = document.querySelector('#tbllelang');
    if (!table) {
        alert('[LPSE Scraper] Tabel data tidak ditemukan.');
        return;
    }

    const rows = table.querySelectorAll('tbody tr');
    const dataList = [];

    // 1. Parsing
    rows.forEach(row => {
        const rowData = LpseInterface.getRawData(row);
        if (rowData) {
            dataList.push(rowData);
        }
    });

    // 2. Kirim RAW DATA (Array Object), bukan String
    // Chrome extension otomatis menangani serialisasi object
    chrome.runtime.sendMessage({
        action: "data_scraped",
        items: dataList, // Kirim list mentah
        count: dataList.length
    });
})();