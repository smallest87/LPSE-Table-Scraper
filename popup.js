// Variabel Global
let scrapedData = [];
let sourceName = "LPSE";

document.getElementById('btnScrape').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    updateStatus("Menginjeksikan script...");

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
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

    // Filter header agar link_url tidak muncul sebagai kolom
    const headers = Object.keys(items[0]).filter(k => k !== 'link_url');
    
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
            
            // --- LOGIKA KLIK NAMA PAKET (PROXY CLICK) ---
            if (key === 'nama_paket' && item.link_url) {
                // Buat elemen <a> tapi HAPUS href-nya agar tidak buka otomatis
                // Kita simpan URL asli di data-url
                const link = document.createElement('a');
                link.innerText = displayValue;
                link.href = "#"; // Dummy href
                link.style.color = "#007bff";
                link.style.fontWeight = "bold";
                link.style.textDecoration = "none";
                link.style.cursor = "pointer";
                
                // Event Listener Klik
                link.addEventListener('click', async (e) => {
                    e.preventDefault(); // Cegah aksi default
                    
                    // Kirim perintah ke Content Script
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tab) {
                        chrome.tabs.sendMessage(tab.id, {
                            action: "open_link_in_tab",
                            url: item.link_url
                        });
                    }
                });
                
                td.appendChild(link);
            } 
            
            // --- Logika Nilai Kontrak 0 ---
            else if (key === 'nilai_kontrak' && displayValue === 0) {
                td.innerText = "Nilai Kontrak belum dibuat";
                td.style.color = "#999"; 
                td.style.fontStyle = "italic";
            } 
            
            // --- Default ---
            else {
                if (displayValue === null || displayValue === undefined) displayValue = "-";
                td.innerText = displayValue;
            }

            if (key !== 'nama_paket' || !item.link_url) {
                tr.appendChild(td);
            } else {
                // Khusus nama paket karena kita pakai appendChild(link), bukan innerText
                const tdLink = document.createElement('td');
                tdLink.appendChild(td.firstChild); 
                tr.appendChild(tdLink);
            }
        });
        tbody.appendChild(tr);
    });
}