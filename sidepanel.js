let currentData = [];
let isBatchProcessing = false;

// --- KONFIGURASI JEDA (HUMANIZE) ---
const DELAY_MIN = 3000; 
const DELAY_MAX = 7000; 

// 1. INIT LOAD
chrome.storage.local.get(['lpse_data'], (result) => {
    if (result.lpse_data) {
        currentData = result.lpse_data;
        renderTable(currentData);
        updateStatus(`Memuat ${currentData.length} data tersimpan.`);
        if(currentData.length > 0) document.getElementById('downloadArea').style.display = 'flex';
    }
});

// 2. MANUAL SCRAPE
document.getElementById('btnScrape').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    await injectAndScrape(tab.id);
});

// 3. BATCH SCRAPE
document.getElementById('btnBatchScrape').addEventListener('click', async () => {
    if (isBatchProcessing) { isBatchProcessing = false; updateStatus("Menghentikan proses..."); return; }

    const targets = currentData.filter(item => item.link_url && !item._hasDetail);
    if (targets.length === 0) { updateStatus("Semua detail sudah lengkap!"); return; }

    if (!confirm(`Akan memproses ${targets.length} paket secara ACAK. Lanjutkan?`)) return;

    targets = shuffleArray(targets);
    const [mainTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!mainTab) { updateStatus("Error: Tidak dapat menemukan tab utama."); return; }
    const mainTabId = mainTab.id;

    isBatchProcessing = true;
    document.getElementById('btnBatchScrape').innerText = "STOP";
    document.getElementById('btnBatchScrape').style.backgroundColor = "#dc3545";

    for (let i = 0; i < targets.length; i++) {
        if (!isBatchProcessing) break;
        const item = targets[i];
        updateStatus(`[${i+1}/${targets.length}] Memproses (Acak): ${item.kode}...`);
        highlightRow(item.kode, '#fff3cd');

        try {
            await chrome.tabs.update(mainTabId, { active: true });
            const newTab = await triggerClickAndWaitForTab(mainTabId, item.link_url);
            if (!newTab) { console.error("Gagal buka tab:", item.kode); continue; }
            await waitForTabLoad(newTab.id);
            await randomDelay(1000, 3000);
            await injectAndScrape(newTab.id);
            await waitForDataUpdate(item.kode);
            await chrome.tabs.remove(newTab.id);
            
            const delay = getRandomInt(DELAY_MIN, DELAY_MAX);
            updateStatus(`Istirahat ${Math.round(delay/100)/10} detik...`);
            await new Promise(r => setTimeout(r, delay));
        } catch (err) { console.error("Batch Error:", err); }
    }

    isBatchProcessing = false;
    document.getElementById('btnBatchScrape').innerText = "SCRAPE SEMUA DETAIL (Antrean)";
    document.getElementById('btnBatchScrape').style.backgroundColor = "#17a2b8";
    updateStatus("Selesai.");
});

// --- HELPERS ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomDelay(min, max) { return new Promise(resolve => setTimeout(resolve, getRandomInt(min, max))); }

function triggerClickAndWaitForTab(mainTabId, url) {
    return new Promise((resolve) => {
        let newTabId = null;
        const createdListener = (tab) => { newTabId = tab.id; chrome.tabs.onCreated.removeListener(createdListener); resolve(tab); };
        chrome.tabs.onCreated.addListener(createdListener);
        (async () => {
            try { await chrome.tabs.sendMessage(mainTabId, { action: "simulate_click", url: url }); } 
            catch (err) {
                try {
                    await chrome.scripting.executeScript({ target: { tabId: mainTabId }, files: ['formatter.js', 'processor.js', 'content.js'] });
                    setTimeout(async () => { try { await chrome.tabs.sendMessage(mainTabId, { action: "simulate_click", url: url }); } catch (e) { chrome.tabs.onCreated.removeListener(createdListener); resolve(null); } }, 1000);
                } catch (injectErr) { chrome.tabs.onCreated.removeListener(createdListener); resolve(null); }
            }
        })();
        setTimeout(() => { if (!newTabId) { chrome.tabs.onCreated.removeListener(createdListener); resolve(null); } }, 8000);
    });
}

function waitForTabLoad(tabId) {
    return new Promise(resolve => {
        const listener = (tid, changeInfo) => {
            if (tid === tabId && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener); resolve();
            }
        };
        chrome.tabs.onUpdated.addListener(listener);
    });
}

function waitForDataUpdate(kode) {
    return new Promise(resolve => {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            const item = currentData.find(i => i.kode === kode);
            if ((item && item._hasDetail) || attempts > 20) { clearInterval(interval); resolve(); }
        }, 500);
    });
}

async function injectAndScrape(tabId) {
    if (!isBatchProcessing) updateStatus("Mengambil data..."); 
    try { await chrome.scripting.executeScript({ target: { tabId: tabId }, files: ['formatter.js', 'processor.js', 'content.js'] }); } catch (err) { console.log("Inject error:", err); }
}

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (isBatchProcessing) return; 
    if (changeInfo.status === 'complete' && tab.url) {
        const keywords = ['lelang', 'nontender', 'pencatatan', 'swakelola', 'pengumuman', 'jadwal'];
        if (keywords.some(k => tab.url.toLowerCase().includes(k))) injectAndScrape(tabId);
    }
});

// --- RENDER & HELPERS UI ---

function renderTable(items) {
    const tbody = document.getElementById('tableBody');
    document.getElementById('dataCount').innerText = items.length;
    tbody.innerHTML = '';
    if (items.length === 0) return;

    items.forEach((item) => {
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

        const nameDiv = trMain.cells[1].querySelector('div');
        if (item.link_url) {
            nameDiv.innerHTML = `<a href="#" class="paket-link">${item.nama_paket}</a>`;
            nameDiv.querySelector('a').addEventListener('click', async (e) => {
                e.preventDefault(); e.stopPropagation();
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab) return;
                try {
                    await chrome.tabs.sendMessage(tab.id, { action: "simulate_click", url: item.link_url });
                } catch (err) {
                    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['formatter.js', 'processor.js', 'content.js'] });
                    setTimeout(() => { chrome.tabs.sendMessage(tab.id, { action: "simulate_click", url: item.link_url }); }, 500);
                }
            });
        }

        const trDetail = document.createElement('tr');
        trDetail.className = 'detail-row';
        let listHTML = '<div class="list-group">';
        
        Object.keys(item).filter(k => !k.startsWith('_') && k !== 'link_url').forEach(key => {
            let val = item[key];
            if (val === null || val === undefined || val === "") return;
            let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            // --- FORMAT TAMPILAN ---
            
            // 1. Format Uang
            if ((key.includes('hps') || key.includes('nilai') || key.includes('pagu')) && typeof val === 'number') {
                val = formatMoney(val);
            }
            // 2. Format Tanggal ISO (2025-08-13) -> Indo (13 Agustus 2025)
            if (key === 'tanggal_pembuatan') {
                val = formatDateDisplay(val);
            }

            listHTML += `<div class="list-item"><span class="label">${label}</span><span class="value">${val}</span></div>`;
        });
        listHTML += '</div>';
        trDetail.innerHTML = `<td colspan="3"><div class="detail-container">${listHTML}</div></td>`;

        trMain.addEventListener('click', () => {
            if (trDetail.classList.contains('show')) {
                trDetail.classList.remove('show'); trMain.style.backgroundColor = '';
                trMain.cells[0].innerHTML = item._hasDetail ? '&#10003;' : '+';
            } else {
                trDetail.classList.add('show'); trMain.style.backgroundColor = '#f1f3f5';
                trMain.cells[0].innerText = '-';
            }
        });
        tbody.appendChild(trMain); tbody.appendChild(trDetail);
    });
}

function saveAndRender(msg) { chrome.storage.local.set({ 'lpse_data': currentData }); renderTable(currentData); updateStatus(msg); document.getElementById('downloadArea').style.display = 'flex'; }
function updateStatus(msg) { const el = document.getElementById('status'); if(el) el.innerText = msg; }
function highlightRow(kode, color) { const rows = document.querySelectorAll('.main-row'); rows.forEach(row => { if (row.innerText.includes(kode)) { row.style.backgroundColor = color || "#d4edda"; if (!isBatchProcessing) setTimeout(() => { row.style.backgroundColor = ""; }, 1500); } }); }

function formatMoney(num) { return "Rp " + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

// --- FORMAT TANGGAL BALIK (ISO -> INDO) UNTUK TAMPILAN SIDE PANEL ---
function formatDateDisplay(isoDate) {
    if (!isoDate || !isoDate.includes('-')) return isoDate;
    const [y, m, d] = isoDate.split('-');
    const months = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    // parseInt untuk menghilangkan angka 0 di depan (08 -> 8) jika diinginkan, atau biarkan string
    return `${d} ${months[parseInt(m)]} ${y}`;
}

document.getElementById('btnDownloadCsv').addEventListener('click', () => downloadFile(LpseRepository.toCSV(currentData), 'csv'));
document.getElementById('btnDownloadJson').addEventListener('click', () => downloadFile(LpseRepository.toJSON(currentData), 'json'));
function downloadFile(content, type) {
    const blob = new Blob([content], { type: type === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `LPSE_Data_${Date.now()}.${type}`;
    document.body.appendChild(a); a.click(); setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 0);
}