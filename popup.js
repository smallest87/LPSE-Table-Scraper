// Variabel Global untuk menyimpan data hasil scrape sementara
let scrapedData = [];
let sourceName = "LPSE"; // Untuk nama file

document.getElementById('btnScrape').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    updateStatus("Menginjeksikan script...");

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        // Pastikan urutan file benar
        files: ['repository.js', 'processor.js', 'content.js']
    }, () => {
        if (chrome.runtime.lastError) {
            updateStatus("Error: " + chrome.runtime.lastError.message);
        }
    });
});

// Listener Pesan dari Content Script
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "data_scraped") {
        // 1. Simpan data ke variabel global
        scrapedData = request.items;
        sourceName = request.source || "LPSE";

        // 2. Render Tabel Visual
        renderTable(scrapedData);
        
        // 3. Update Status & Munculkan Tombol Download
        updateStatus(`Berhasil mengambil ${request.count} data dari tab "${sourceName}".`);
        document.getElementById('downloadArea').style.display = 'flex';
    }
});

// --- LOGIKA TOMBOL DOWNLOAD ---

document.getElementById('btnDownloadCsv').addEventListener('click', () => {
    if (scrapedData.length === 0) return;
    
    // Panggil Repository untuk format CSV (Delimiter ;)
    const csvContent = LpseRepository.toCSV(scrapedData);
    const filename = `Data_${sourceName}_${getTimestamp()}.csv`;
    
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
});

document.getElementById('btnDownloadJson').addEventListener('click', () => {
    if (scrapedData.length === 0) return;

    // Panggil Repository untuk format JSON
    const jsonContent = LpseRepository.toJSON(scrapedData);
    const filename = `Data_${sourceName}_${getTimestamp()}.json`;
    
    downloadFile(jsonContent, filename, 'application/json');
});

// --- HELPER FUNCTIONS ---

function downloadFile(content, filename, mimeType) {
    // 1. Buat Blob
    const blob = new Blob([content], { type: mimeType });
    
    // 2. Buat URL Object
    const url = URL.createObjectURL(blob);
    
    // 3. Buat elemen <a> fiktif dan klik secara programmatik
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // 4. Bersihkan
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

function getTimestamp() {
    const now = new Date();
    // Format: YYYYMMDD_HHMM
    return now.toISOString().slice(0,10).replace(/-/g,"") + "_" + 
           now.toTimeString().slice(0,5).replace(/:/g,"");
}

function updateStatus(msg) {
    document.getElementById('status').innerText = msg;
}

function renderTable(items) {
    const tbody = document.getElementById('tableBody');
    const theadRow = document.getElementById('tableHeader');
    
    tbody.innerHTML = '';
    theadRow.innerHTML = '';

    if (items.length === 0) return;

    // Header Dinamis
    const headers = Object.keys(items[0]);
    headers.forEach(key => {
        const th = document.createElement('th');
        th.innerText = key.replace(/_/g, ' ').toUpperCase();
        theadRow.appendChild(th);
    });

    // Body Dinamis
    items.forEach(item => {
        const tr = document.createElement('tr');
        headers.forEach(key => {
            const td = document.createElement('td');
            td.innerText = item[key];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}