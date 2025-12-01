// Variabel Global
let scrapedData = [];
let sourceName = "LPSE";

document.getElementById('btnScrape').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    updateStatus("Menginjeksikan script...");

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        // URUTAN KRUSIAL: formatter -> processor -> content
        files: ['formatter.js', 'processor.js', 'content.js']
    }, () => {
        if (chrome.runtime.lastError) {
            updateStatus("Error: " + chrome.runtime.lastError.message);
        }
    });
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "data_scraped") {
        scrapedData = request.items;
        sourceName = request.source || "LPSE";
        
        renderTable(scrapedData);
        
        updateStatus(`Berhasil mengambil ${request.count} data dari tab "${sourceName}".`);
        document.getElementById('downloadArea').style.display = 'flex';
    }
});

// --- TOMBOL DOWNLOAD ---

document.getElementById('btnDownloadCsv').addEventListener('click', () => {
    if (scrapedData.length === 0) return;
    const csvContent = LpseRepository.toCSV(scrapedData);
    const filename = `Data_${sourceName}_${getTimestamp()}.csv`;
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
});

document.getElementById('btnDownloadJson').addEventListener('click', () => {
    if (scrapedData.length === 0) return;
    const jsonContent = LpseRepository.toJSON(scrapedData);
    const filename = `Data_${sourceName}_${getTimestamp()}.json`;
    downloadFile(jsonContent, filename, 'application/json');
});

// --- HELPER ---

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 0);
}

function getTimestamp() {
    const now = new Date();
    return now.toISOString().slice(0,10).replace(/-/g,"") + "_" + now.toTimeString().slice(0,5).replace(/:/g,"");
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

    const headers = Object.keys(items[0]);
    headers.forEach(key => {
        const th = document.createElement('th');
        th.innerText = key.replace(/_/g, ' ').toUpperCase();
        theadRow.appendChild(th);
    });

    items.forEach(item => {
        const tr = document.createElement('tr');
        headers.forEach(key => {
            const td = document.createElement('td');
            
            let displayValue = item[key];
            
            // LOGIKA TAMPILAN:
            // Jika kolom adalah 'nilai_kontrak' dan isinya 0,
            // Kita anggap itu sebagai "Belum Dibuat" secara visual.
            if (key === 'nilai_kontrak' && displayValue === 0) {
                displayValue = "Nilai Kontrak belum dibuat";
                td.style.color = "#999"; 
                td.style.fontStyle = "italic";
            } 
            // Handle null/undefined umum
            else if (displayValue === null || displayValue === undefined) {
                displayValue = "-";
            }

            td.innerText = displayValue;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}