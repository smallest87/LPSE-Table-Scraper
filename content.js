(function() {
    // -----------------------------------------------------------------------
    // BAGIAN 1: DETEKSI & SCRAPING DATA
    // -----------------------------------------------------------------------

    // Elemen indikator
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
    }

    // --- MODE B: DETAIL PAKET ---
    else if (detailTableEl) {
        const singleData = DetailPageInterface.getRawData(detailTableEl);
        chrome.runtime.sendMessage({
            action: "data_scraped", items: [singleData], count: 1, source: "Detail Paket", type: "detail"
        });
    }

    // --- MODE C: TIDAK DIKENALI ---
    else {
        // Console log saja, jangan alert
        console.log("[LPSE Scraper] Struktur halaman tidak cocok.");
    }

    // -----------------------------------------------------------------------
    // BAGIAN 2: MANIPULASI KLIK (UNTUK REFERRER/SESSION AMAN)
    // -----------------------------------------------------------------------
    
    if (!window.hasClickListener) {
        window.hasClickListener = true;
        
        chrome.runtime.onMessage.addListener((request) => {
            
            // ACTION: SIMULASI KLIK
            if (request.action === "simulate_click") {
                const targetUrl = request.url;
                
                // 1. Coba Cari Link Asli di DOM (Paling Aman)
                const allLinks = document.querySelectorAll('a');
                let found = false;

                for (let link of allLinks) {
                    if (link.href === targetUrl) {
                        link.focus();
                        link.click(); // Klik Native
                        found = true;
                        break;
                    }
                }

                // 2. Link Hantu (Fallback jika elemen tidak ketemu)
                // Membuat elemen A baru, klik, lalu hapus.
                // Ini memaksa browser mengirim Referrer dari halaman ini.
                if (!found) {
                    console.log("[LPSE Scraper] Menggunakan Ghost Link...");
                    const ghostLink = document.createElement('a');
                    ghostLink.href = targetUrl;
                    ghostLink.target = "_blank";
                    ghostLink.rel = "opener"; // Penting untuk session
                    ghostLink.style.display = "none";
                    
                    document.body.appendChild(ghostLink);
                    ghostLink.click();
                    
                    setTimeout(() => {
                        document.body.removeChild(ghostLink);
                    }, 100);
                }
            }
        });
    }

})();