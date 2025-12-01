(function() {
    const table = document.querySelector('#tbllelang');

    if (!table) {
        alert('[LPSE Scraper] Tabel data tidak ditemukan.');
        return;
    }

    const rows = table.querySelectorAll('tbody tr');
    const dataList = [];

    // 1. Parsing (Menggunakan Interface/Processor)
    rows.forEach(row => {
        const rowData = LpseInterface.getRawData(row);
        if (rowData) {
            dataList.push(rowData);
        }
    });

    // 2. Formatting (Menggunakan Repository)
    // const csvOutput = LpseRepository.toCSV(dataList); // Format Lama
    const jsonOutput = LpseRepository.toJSON(dataList); // Format Baru

    // 3. Sending
    chrome.runtime.sendMessage({
        action: "data_scraped",
        data: jsonOutput,
        count: dataList.length
    });
})();