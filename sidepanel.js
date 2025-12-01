let currentData = [];

// 1. SAAT PANEL DIBUKA: Load data dari Storage
chrome.storage.local.get(['lpse_data'], (result) => {
    if (result.lpse_data) {
        currentData = result.lpse_data;
        renderTable(currentData);
        updateStatus(`Memuat ${currentData.length} data tersimpan.`);
        const dlArea = document.getElementById('downloadArea');
        if (dlArea) dlArea.style.display = 'flex';
    }
});

// 2. TOMBOL SCRAPE (AMBIL DATA)
const btnScrape = document.getElementById('btnScrape');
if (btnScrape) {
    btnScrape.addEventListener('click', async () => {
        await injectAndScrape();
    });
}

async function injectAndScrape() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    updateStatus("Sedang mengambil data...");

    // Kita SELALU inject ulang script sebelum scrape untuk memastikan script hidup
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['formatter.js', 'processor.js', 'content.js']
    }, () => {
        if (chrome.runtime.lastError) {
            updateStatus("Error Inject: " + chrome.runtime.lastError.message);
        }
    });
}

// 3. MENERIMA PESAN DARI CONTENT SCRIPT
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "data_scraped") {
        
        // CASE A: DAFTAR PAKET
        if (request.type === 'list' || request.count > 1) {
            currentData = request.items;
            saveToStorage(currentData);
            renderTable(currentData);
            updateStatus(`Daftar: ${request.count} paket berhasil diambil.`);
        } 
        
        // CASE B: DETAIL PAKET
        else if (request.type === 'detail' || request.count === 1) {
            const detailItem = request.items[0];
            const index = currentData.findIndex(item => item.kode === detailItem.kode);

            if (index !== -1) {
                currentData[index] = { ...currentData[index], ...detailItem };
                saveToStorage(currentData);
                renderTable(currentData);
                updateStatus(`Paket ${detailItem.kode} berhasil diupdate!`);
            } else {
                updateStatus(`Info: Data Detail ${detailItem.kode} diambil.`);
            }
        }
        
        const dlArea = document.getElementById('downloadArea');
        if (dlArea) dlArea.style.display = 'flex';
    }
});

// --- HELPER ---

function saveToStorage(data) { chrome.storage.local.set({ 'lpse_data': data }); }
function updateStatus(msg) { const el = document.getElementById('status'); if (el) el.innerText = msg; }
function getTimestamp() { const now = new Date(); return now.toISOString().slice(0,10).replace(/-/g,"") + "_" + now.toTimeString().slice(0,5).replace(/:/g,""); }

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 0);
}

const btnCsv = document.getElementById('btnDownloadCsv');
if (btnCsv) {
    btnCsv.addEventListener('click', () => {
        if (currentData.length === 0) return;
        const csvContent = LpseRepository.toCSV(currentData);
        downloadFile(csvContent, `LPSE_Data_${getTimestamp()}.csv`, 'text/csv;charset=utf-8;');
    });
}

const btnJson = document.getElementById('btnDownloadJson');
if (btnJson) {
    btnJson.addEventListener('click', () => {
        if (currentData.length === 0) return;
        const jsonContent = LpseRepository.toJSON(currentData);
        downloadFile(jsonContent, `LPSE_Data_${getTimestamp()}.json`, 'application/json');
    });
}

// --- RENDER TABEL (DENGAN DIRECT INJECTION CLICK) ---

function renderTable(items) {
    const tbody = document.getElementById('tableBody');
    const theadRow = document.getElementById('tableHeader');
    
    if (!tbody || !theadRow) return;

    tbody.innerHTML = ''; theadRow.innerHTML = '';
    if (items.length === 0) return;

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
            
            // --- LOGIKA KLIK BARU (DIRECT INJECTION) ---
            if (key === 'nama_paket' && item.link_url) {
                const link = document.createElement('a');
                link.innerText = displayValue;
                link.href = "#"; 
                link.style.color = "#007bff"; link.style.fontWeight = "bold"; link.style.textDecoration = "none"; link.style.cursor = "pointer";
                
                link.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (!tab) return;

                    // METODE NUCLEAR: Direct Script Injection
                    // Kita tidak mengirim pesan. Kita langsung menyuntikkan fungsi window.open ke tab target.
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: (url) => {
                            // Code ini berjalan DI DALAM TAB BROWSER (Konteks LPSE)
                            // Jadi Referrer aman, dan tidak butuh content.js standby
                            window.open(url, '_blank');
                        },
                        args: [item.link_url] // Kirim URL sebagai argumen
                    });
                });
                
                td.appendChild(link);
            } 
            else if (key === 'nilai_kontrak' && displayValue === 0) {
                td.innerText = "Belum Dibuat";
                td.style.color = "#999"; td.style.fontStyle = "italic";
            } 
            else {
                if (displayValue === null || displayValue === undefined) displayValue = "-";
                td.innerText = displayValue;
            }

            if (key === 'nama_paket' && item.link_url) {
                const tdWrapper = document.createElement('td');
                tdWrapper.appendChild(td.firstChild);
                tr.appendChild(tdWrapper);
            } else {
                tr.appendChild(td);
            }
        });
        tbody.appendChild(tr);
    });
}