(function() {
    // 1. DETEKSI MODE HALAMAN
    const listTabEl = document.querySelector('ul#tabs li.nav-item a.active');
    const detailTableEl = document.querySelector('.content .table, .content-detail .table');

    // --- MODE A: DAFTAR PAKET ---
    if (listTabEl) {
        const activeTabName = listTabEl.innerText.trim();
        let currentScenario = null;
        
        switch (activeTabName) {
            case 'Tender': currentScenario = { tableSelector: '#tabellelang, #tbllelang', interface: LelangInterface }; break;
            case 'Non Tender': currentScenario = { tableSelector: '#tabellelang, #tblnontender, #tbllelang', interface: NonTenderInterface }; break;
            case 'Pencatatan Non Tender': currentScenario = { tableSelector: '#tabellelang, #tblpencatatan', interface: PencatatanNonTenderInterface }; break;
            case 'Pencatatan Swakelola': currentScenario = { tableSelector: '#tblswakelola', interface: PencatatanSwakelolaInterface }; break;
            case 'Pencatatan Pengadaan Darurat': currentScenario = { tableSelector: '#tabellelang, #tbldarurat', interface: PencatatanPengadaanDaruratInterface }; break;
        }

        if (currentScenario) {
            const table = document.querySelector(currentScenario.tableSelector);
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                const dataList = [];
                rows.forEach(row => {
                    const rowData = currentScenario.interface.getRawData(row);
                    if (rowData) {
                        rowData.sumber_data = activeTabName; 
                        dataList.push(rowData);
                    }
                });
                
                chrome.runtime.sendMessage({
                    action: "data_scraped", items: dataList, count: dataList.length, source: activeTabName, type: "list"
                });
            }
        }
        return; 
    }

    // --- MODE B: DETAIL PAKET ---
    else if (detailTableEl) {
        const singleData = DetailPageInterface.getRawData(detailTableEl);
        const dataList = [singleData];
        
        chrome.runtime.sendMessage({
            action: "data_scraped", items: dataList, count: 1, source: "Detail Paket", type: "detail"
        });
        return;
    }

    // --- LISTENER BUKA LINK (Proxy Click) ---
    if (!window.hasLinkListener) {
        window.hasLinkListener = true;
        chrome.runtime.onMessage.addListener((request) => {
            if (request.action === "open_link_in_tab") {
                window.open(request.url, '_blank');
            }
        });
    }

// --- SKENARIO C: TIDAK DIKENALI ---
    else {
        // alert("[LPSE Scraper] Halaman tidak dikenali..."); // MATIKAN ALERT INI
        console.log("[LPSE Scraper] Struktur halaman tidak cocok dengan pattern List atau Detail.");
    }
})();