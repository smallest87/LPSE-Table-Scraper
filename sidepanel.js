let currentData = [];
let isBatchProcessing = false;

// 1. INIT LOAD
chrome.storage.local.get(['lpse_data'], (result) => {
    if (result.lpse_data) {
        currentData = result.lpse_data;
        renderTable(currentData);
        updateStatus(`Memuat ${currentData.length} data tersimpan.`);
        if(currentData.length > 0) document.getElementById('downloadArea').style.display = 'flex';
    }
});

// 2. MANUAL SCRAPE BUTTON
document.getElementById('btnScrape').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    await injectAndScrape(tab.id);
});

// 3. BATCH SCRAPE BUTTON
document.getElementById('btnBatchScrape').addEventListener('click', async () => {
    if (isBatchProcessing) { isBatchProcessing = false; updateStatus("Batch stop."); return; }
    
    const targets = currentData.filter(item => item.link_url && !item._hasDetail);
    if (targets.length === 0) { updateStatus("Semua detail sudah lengkap!"); return; }
    if (!confirm(`Proses ${targets.length} paket?`)) return;

    isBatchProcessing = true;
    document.getElementById('btnBatchScrape').innerText = "STOP";
    document.getElementById('btnBatchScrape').style.backgroundColor = "#dc3545";

    for (let i = 0; i < targets.length; i++) {
        if (!isBatchProcessing) break;
        const item = targets[i];
        updateStatus(`[${i+1}/${targets.length}] ${item.kode}...`);
        highlightRow(item.kode, '#fff3cd');

        try {
            const tab = await chrome.tabs.create({ url: item.link_url, active: true });
            await new Promise(r => setTimeout(r, 2000)); // Tunggu load
            await injectAndScrape(tab.id);
            await new Promise(r => setTimeout(r, 1000)); // Tunggu scrape
            await chrome.tabs.remove(tab.id);
        } catch (e) { console.error(e); }
    }

    isBatchProcessing = false;
    document.getElementById('btnBatchScrape').innerText = "SCRAPE SEMUA DETAIL";
    document.getElementById('btnBatchScrape').style.backgroundColor = "#17a2b8";
    updateStatus("Selesai.");
});

// FUNGSI INJEKSI
async function injectAndScrape(tabId) {
    updateStatus("Mengambil data...");
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['formatter.js', 'processor.js', 'content.js']
        });
    } catch (err) { console.log("Inject error:", err); }
}

// RECEIVE MESSAGE
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "data_scraped") {
        if (request.type === 'list' || request.count > 1) {
            currentData = request.items;
            saveAndRender(`Daftar diperbarui: ${request.count} item.`);
        } else if (request.type === 'detail' || request.count === 1) {
            const detail = request.items[0];
            const idx = currentData.findIndex(i => i.kode === detail.kode);
            if (idx !== -1) {
                currentData[idx] = { ...currentData[idx], ...detail };
                currentData[idx]._hasDetail = true;
                saveAndRender(`Update: ${detail.kode}`);
                highlightRow(detail.kode);
            }
        }
    }
});

// AUTO SCRAPE LISTENER
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (isBatchProcessing) return; // Skip saat batch
    if (changeInfo.status === 'complete' && tab.url) {
        const keywords = ['lelang', 'nontender', 'pencatatan', 'swakelola', 'pengumuman', 'jadwal'];
        if (keywords.some(k => tab.url.toLowerCase().includes(k))) {
            injectAndScrape(tabId);
        }
    }
});

// --- RENDER TABLE (ACCORDION + PROXY CLICK) ---
function renderTable(items) {
    const tbody = document.getElementById('tableBody');
    document.getElementById('dataCount').innerText = items.length;
    tbody.innerHTML = '';
    if (items.length === 0) return;

    items.forEach((item) => {
        // Main Row
        const trMain = document.createElement('tr');
        trMain.className = 'main-row';
        if (item._hasDetail) trMain.classList.add('has-detail');

        let displayValue = item.nilai_kontrak || item.hps || item.pagu || 0;
        let displayMoney = displayValue === 0 ? '<span class="nil-null">Belum Ada</span>' : formatMoney(displayValue);

        trMain.innerHTML = `
            <td class="toggle-col" style="color: ${item._hasDetail ? '#28a745' : '#007bff'}">${item._hasDetail ? '&#10003;' : '+'}</td>
            <td>
                <div style="font-weight:bold; margin-bottom:2px;">${item.nama_paket || '-'}</div>
                <div style="font-size:9px; color:#666;">${item.kode} | ${item.instansi || ''}</div>
            </td>
            <td style="text-align:right; font-weight:600;">${displayMoney}</td>
        `;

        // --- KLIK TAUTAN (FITUR UTAMA) ---
        const nameDiv = trMain.cells[1].querySelector('div');
        if (item.link_url) {
            nameDiv.innerHTML = `<a href="#" class="paket-link">${item.nama_paket}</a>`;
            nameDiv.querySelector('a').addEventListener('click', async (e) => {
                e.preventDefault(); e.stopPropagation();
                
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab) return;

                // Kirim pesan "simulate_click"
                try {
                    await chrome.tabs.sendMessage(tab.id, { action: "simulate_click", url: item.link_url });
                } catch (err) {
                    // Jika script mati, suntik ulang -> tunggu -> kirim lagi
                    console.log("Re-injecting content script...");
                    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['formatter.js', 'processor.js', 'content.js'] });
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tab.id, { action: "simulate_click", url: item.link_url });
                    }, 500);
                }
            });
        }

        // Detail Row
        const trDetail = document.createElement('tr');
        trDetail.className = 'detail-row';
        let listHTML = '<div class="list-group">';
        Object.keys(item).filter(k => !k.startsWith('_') && k !== 'link_url').forEach(key => {
            let val = item[key];
            if (val === null || val === undefined || val === "") return;
            let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if ((key.includes('hps') || key.includes('nilai') || key.includes('pagu')) && typeof val === 'number') val = formatMoney(val);
            listHTML += `<div class="list-item"><span class="label">${label}</span><span class="value">${val}</span></div>`;
        });
        listHTML += '</div>';
        trDetail.innerHTML = `<td colspan="3"><div class="detail-container">${listHTML}</div></td>`;

        // Accordion Toggle
        trMain.addEventListener('click', () => {
            if (trDetail.classList.contains('show')) {
                trDetail.classList.remove('show'); trMain.style.backgroundColor = '';
                trMain.cells[0].innerHTML = item._hasDetail ? '&#10003;' : '+';
            } else {
                trDetail.classList.add('show'); trMain.style.backgroundColor = '#f1f3f5';
                trMain.cells[0].innerText = '-';
            }
        });

        tbody.appendChild(trMain);
        tbody.appendChild(trDetail);
    });
}

// Helpers
function saveAndRender(msg) { chrome.storage.local.set({ 'lpse_data': currentData }); renderTable(currentData); updateStatus(msg); document.getElementById('downloadArea').style.display = 'flex'; }
function updateStatus(msg) { const el = document.getElementById('status'); if(el) el.innerText = msg; }
function formatMoney(num) { return "Rp " + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function highlightRow(kode, color) { const rows = document.querySelectorAll('.main-row'); rows.forEach(row => { if (row.innerText.includes(kode)) { row.style.backgroundColor = color || "#d4edda"; if (!isBatchProcessing) setTimeout(() => { row.style.backgroundColor = ""; }, 1500); } }); }

// Download
document.getElementById('btnDownloadCsv').addEventListener('click', () => downloadFile(LpseRepository.toCSV(currentData), 'csv'));
document.getElementById('btnDownloadJson').addEventListener('click', () => downloadFile(LpseRepository.toJSON(currentData), 'json'));
function downloadFile(content, type) {
    const blob = new Blob([content], { type: type === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `LPSE_Data_${Date.now()}.${type}`;
    document.body.appendChild(a); a.click(); setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 0);
}