let currentData = [];

// 1. INIT LOAD
chrome.storage.local.get(['lpse_data'], (result) => {
    if (result.lpse_data) {
        currentData = result.lpse_data;
        renderTable(currentData);
        updateStatus(`Memuat ${currentData.length} data.`);
        if(currentData.length > 0) document.getElementById('downloadArea').style.display = 'flex';
    }
});

// 2. SCRAPE BUTTON
document.getElementById('btnScrape').addEventListener('click', async () => {
    await injectAndScrape();
});

async function injectAndScrape() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    updateStatus("Sedang mengambil data...");
    
    // Inject Script (Selalu inject agar aman)
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['formatter.js', 'processor.js', 'content.js']
    }, () => {
        if (chrome.runtime.lastError) updateStatus("Error: " + chrome.runtime.lastError.message);
    });
}

// 3. RECEIVE MESSAGE
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "data_scraped") {
        if (request.type === 'list' || request.count > 1) {
            currentData = request.items;
            saveAndRender(`Daftar: ${request.count} paket diambil.`);
        } else if (request.type === 'detail' || request.count === 1) {
            const detail = request.items[0];
            const idx = currentData.findIndex(i => i.kode === detail.kode);
            if (idx !== -1) {
                currentData[idx] = { ...currentData[idx], ...detail };
                // Tandai object ini punya detail lengkap (opsional flag)
                currentData[idx]._hasDetail = true; 
                saveAndRender(`Paket ${detail.kode} diupdate!`);
            } else {
                updateStatus("Data detail diambil (tidak ada di list).");
            }
        }
    }
});

function saveAndRender(msg) {
    chrome.storage.local.set({ 'lpse_data': currentData });
    renderTable(currentData);
    updateStatus(msg);
    document.getElementById('downloadArea').style.display = 'flex';
}

// --- RENDER TABLE UTAMA (LOGIKA LIST GROUP) ---

function renderTable(items) {
    const tbody = document.getElementById('tableBody');
    document.getElementById('dataCount').innerText = items.length;
    tbody.innerHTML = '';

    if (items.length === 0) return;

    items.forEach((item, index) => {
        // --- 1. MAIN ROW (Hanya Info Penting) ---
        const trMain = document.createElement('tr');
        trMain.className = 'main-row';
        if (item._hasDetail) trMain.classList.add('has-detail');

        // Tentukan Nilai untuk ditampilkan (Prioritas: Nilai Kontrak > HPS > Pagu)
        let displayValue = item.nilai_kontrak || item.hps || item.pagu || 0;
        let displayMoney = displayValue === 0 ? '<span class="nil-null">Belum Ada</span>' : formatMoney(displayValue);

        trMain.innerHTML = `
            <td class="toggle-col">+</td>
            <td>
                <div style="font-weight:bold; margin-bottom:2px;">${item.nama_paket || '-'}</div>
                <div style="font-size:9px; color:#666;">${item.kode} | ${item.instansi || ''}</div>
            </td>
            <td style="text-align:right; font-weight:600;">${displayMoney}</td>
        `;

        // Pasang Event Listener ke Nama Paket (Proxy Click)
        // Kita cari text nama paket tadi dan ubah jadi link
        const nameDiv = trMain.cells[1].querySelector('div'); // Div pertama
        if (item.link_url) {
            nameDiv.innerHTML = `<a href="#" class="paket-link">${item.nama_paket}</a>`;
            nameDiv.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation(); // Stop toggle accordion
                openLinkDirect(item.link_url);
            });
        }

        // --- 2. DETAIL ROW (List Group Tersembunyi) ---
        const trDetail = document.createElement('tr');
        trDetail.className = 'detail-row';
        
        // Generate List Group HTML dari SEMUA key object
        let listHTML = '<div class="list-group">';
        
        // Urutkan key agar rapi (Opsional)
        const keys = Object.keys(item).filter(k => !k.startsWith('_') && k !== 'link_url'); // Filter internal key
        
        keys.forEach(key => {
            let val = item[key];
            if (val === null || val === undefined || val === "") return; // Skip kosong
            
            // Format Key: "tahun_anggaran" -> "Tahun Anggaran"
            let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            // Format Value jika uang
            if ((key.includes('hps') || key.includes('nilai') || key.includes('pagu')) && typeof val === 'number') {
                val = formatMoney(val);
            }

            listHTML += `
                <div class="list-item">
                    <span class="label">${label}</span>
                    <span class="value">${val}</span>
                </div>
            `;
        });
        listHTML += '</div>';

        trDetail.innerHTML = `
            <td colspan="3">
                <div class="detail-container">
                    ${listHTML}
                </div>
            </td>
        `;

        // --- 3. EVENT LISTENER TOGGLE ---
        trMain.addEventListener('click', () => {
            const isOpen = trDetail.classList.contains('show');
            // Toggle class show
            if (isOpen) {
                trDetail.classList.remove('show');
                trMain.cells[0].innerText = '+';
                trMain.style.backgroundColor = '';
            } else {
                trDetail.classList.add('show');
                trMain.cells[0].innerText = '-';
                trMain.style.backgroundColor = '#e2e6ea';
            }
        });

        tbody.appendChild(trMain);
        tbody.appendChild(trDetail);
    });
}

// --- HELPERS ---

async function openLinkDirect(url) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (u) => window.open(u, '_blank'),
        args: [url]
    });
}

function formatMoney(num) {
    return "Rp " + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function updateStatus(msg) { document.getElementById('status').innerText = msg; }

// --- DOWNLOAD HANDLERS ---
document.getElementById('btnDownloadCsv').addEventListener('click', () => {
    if (currentData.length === 0) return;
    const csvContent = LpseRepository.toCSV(currentData);
    downloadFile(csvContent, 'csv');
});
document.getElementById('btnDownloadJson').addEventListener('click', () => {
    if (currentData.length === 0) return;
    const jsonContent = LpseRepository.toJSON(currentData);
    downloadFile(jsonContent, 'json');
});

function downloadFile(content, type) {
    const mime = type === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `LPSE_Data_${new Date().getTime()}.${type}`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 0);
}