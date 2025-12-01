(function() {
    // 1. DETEKSI TAB AKTIF
    const activeTabEl = document.querySelector('ul#tabs li.nav-item a.active');
    
    if (!activeTabEl) {
        alert('[LPSE Scraper] Gagal mendeteksi tab menu yang aktif. Pastikan halaman sudah dimuat sempurna.');
        return;
    }

    const activeTabName = activeTabEl.innerText.trim();
    console.log(`[LPSE Scraper] Tab Aktif Terdeteksi: "${activeTabName}"`);

    // 2. DEFINISI SKENARIO
    // Menggunakan multiple selector (koma) untuk fallback ID tabel
    let currentScenario = null;

    switch (activeTabName) {
        case 'Tender':
            currentScenario = {
                tableSelector: '#tabellelang, #tbllelang', 
                interface: LelangInterface 
            };
            break;

        case 'Non Tender':
            currentScenario = {
                tableSelector: '#tabellelang, #tblnontender, #tbllelang',
                interface: NonTenderInterface 
            };
            break;

        case 'Pencatatan Non Tender':
            currentScenario = {
                tableSelector: '#tabellelang, #tblpencatatan, #tbllelang',
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
                tableSelector: '#tabellelang, #tbldarurat',
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
        const rowData = currentScenario.interface.getRawData(row);
        if (rowData) {
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

    // --- FITUR BARU: LISTENER UNTUK BUKA LINK ---
    // Mencegah duplicate listener jika script di-inject berkali-kali
    if (!window.hasLinkListener) {
        window.hasLinkListener = true;
        
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === "open_link_in_tab") {
                // Membuka URL dari konteks halaman ini (Referrer aman)
                window.open(request.url, '_blank');
            }
        });
    }
})();