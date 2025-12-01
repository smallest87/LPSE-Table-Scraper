(function() {
    // 1. DETEKSI TAB AKTIF
    // Mencari elemen <a> di dalam <ul id="tabs"> yang memiliki class 'active'
    const activeTabEl = document.querySelector('ul#tabs li.nav-item a.active');
    
    if (!activeTabEl) {
        alert('[LPSE Scraper] Gagal mendeteksi tab menu yang aktif. Pastikan halaman sudah dimuat sempurna.');
        return;
    }

    const activeTabName = activeTabEl.innerText.trim();
    console.log(`[LPSE Scraper] Tab Aktif Terdeteksi: "${activeTabName}"`);

    // 2. DEFINISI SKENARIO
    // Mapping antara Nama Tab -> Selector Tabel -> Interface Processor
    // Note: Saya masukkan selector backup (seperti #tbllelang) untuk jaga-jaga jika ID aslinya beda tipis.
    let currentScenario = null;

    switch (activeTabName) {
        case 'Tender':
            currentScenario = {
                // User info: #tabellelang (tapi standar LPSE sering #tbllelang, saya pasang keduanya)
                tableSelector: '#tbllelang', 
                interface: LelangInterface 
            };
            break;

        case 'Non Tender':
            currentScenario = {
                tableSelector: '#tbllelang',
                interface: NonTenderInterface 
            };
            break;

        case 'Pencatatan Non Tender':
            currentScenario = {
                tableSelector: '#tbllelang',
                interface: PencatatanNonTenderInterface 
            };
            break;

        case 'Pencatatan Swakelola':
            currentScenario = {
                tableSelector: '#tblswakelola',
                interface: PencatatanSwakelolaInterface 
            };
            break;

        case 'Pencatatan Pengadaan Darurat':
            currentScenario = {
                tableSelector: '#tabellelang',
                interface: PencatatanPengadaanDaruratInterface 
            };
            break;

        default:
            alert(`[LPSE Scraper] Jenis tab "${activeTabName}" belum didukung dalam skenario.`);
            return;
    }

    // 3. AMBIL TABEL BERDASARKAN SKENARIO
    const table = document.querySelector(currentScenario.tableSelector);

    if (!table) {
        alert(`[LPSE Scraper] Tabel dengan ID target tidak ditemukan pada tab "${activeTabName}".`);
        return;
    }

    // 4. EKSEKUSI SCRAPING
    const rows = table.querySelectorAll('tbody tr');
    const dataList = [];

    rows.forEach(row => {
        // Gunakan Interface yang sesuai dengan Tab Aktif
        const rowData = currentScenario.interface.getRawData(row);
        
        if (rowData) {
            // Kita tambahkan properti 'sumber' agar tahu data ini dari tab mana
            rowData.sumber_data = activeTabName; 
            dataList.push(rowData);
        }
    });

    // 5. KIRIM DATA KE POPUP
    chrome.runtime.sendMessage({
        action: "data_scraped",
        items: dataList,
        count: dataList.length,
        source: activeTabName
    });

})();