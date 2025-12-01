let currentData = [];

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

// FUNGSI INJEKSI & SCRAPE (Bisa dipanggil manual atau otomatis)
async function injectAndScrape(tabId) {
    updateStatus("Mencoba mengambil data...");
    
    // Gunakan try-catch agar tidak memutus flow jika tab tertutup/error
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['formatter.js', 'processor.js', 'content.js']
        });
    } catch (err) {
        console.log("Inject error (mungkin tab tertutup/restricted):", err);
        // Jangan updateStatus error ke UI agar tidak spamming saat user buka tab non-LPSE
    }
}

// 3. RECEIVE MESSAGE (Hasil Scrape)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "data_scraped") {
        
        // CASE A: LIST
        if (request.type === 'list' || request.count > 1) {
            currentData = request.items;
            saveAndRender(`Daftar diperbarui: ${request.count} paket.`);
        } 
        
        // CASE B: DETAIL (MERGING)
        else if (request.type === 'detail' || request.count === 1) {
            const detail = request.items[0];
            
            // Logic Merging: Cari berdasarkan Kode
            const idx = currentData.findIndex(i => i.kode === detail.kode);
            
            if (idx !== -1) {
                // Update data lama dengan detail baru
                currentData[idx] = { ...currentData[idx], ...detail };
                currentData[idx]._hasDetail = true; // Flag visual
                
                saveAndRender(`Auto-Update: Detail Paket ${detail.kode} masuk!`);
                
                // Efek visual highlight pada baris tabel
                highlightRow(detail.kode);
            } else {
                updateStatus(`Info: Detail ${detail.kode} diambil (Data baru).`);
                // Opsional: Jika ingin menambahkan data baru yg tidak ada di list
                // currentData.push(detail); saveAndRender(...);
            }
        }
    }
});

// 4. AUTO-SCRAPE LISTENER (CCTV)
// Memantau setiap tab yang selesai loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Hanya bereaksi jika status = complete (Halaman selesai loading)
    if (changeInfo.status === 'complete' && tab.url) {
        
        // Filter URL: Hanya jalankan di halaman yang terlihat seperti LPSE
        // Keyword: lelang, nontender, pencatatan, pengumuman, detail, jadwal
        const keywords = ['lelang', 'nontender', 'pencatatan', 'swakelola', 'pengumuman', 'jadwal'];
        const isTargetUrl = keywords.some(k => tab.url.toLowerCase().includes(k));

        if (isTargetUrl) {
            console.log("Auto-Scraping detected for:", tab.url);
            updateStatus("Mendeteksi halaman LPSE, auto-scraping...");
            injectAndScrape(tabId);
        }
    }
});


// --- HELPERS ---

function saveAndRender(msg) {
    chrome.storage.local.set({ 'lpse_data': currentData });
    renderTable(currentData);
    updateStatus(msg);
    document.getElementById('downloadArea').style.display = 'flex';
}

function updateStatus(msg) { 
    const el = document.getElementById('status');
    if (el) el.innerText = msg; 
}

function highlightRow(kode) {
    // Cari elemen baris berdasarkan kode (kita perlu sedikit modifikasi renderTable untuk kasih ID/Class unik, 
    // tapi cara kasar ini cukup scan text)
    const rows = document.querySelectorAll('.main-row');
    rows.forEach(row => {
        if (row.innerHTML.includes(kode)) {
            row.style.backgroundColor = "#d4edda"; // Hijau muda sukses
            setTimeout(() => { row.style.backgroundColor = ""; }, 1500);
        }
    });
}

function renderTable(items) {
    const tbody = document.getElementById('tableBody');
    document.getElementById('dataCount').innerText = items.length;
    tbody.innerHTML = '';

    if (items.length === 0) return;

    items.forEach((item, index) => {
        const trMain = document.createElement('tr');
        trMain.className = 'main-row';
        if (item._hasDetail) trMain.classList.add('has-detail');

        let displayValue = item.nilai_kontrak || item.hps || item.pagu || 0;
        let displayMoney = displayValue === 0 ? '<span class="nil-null">Belum Ada</span>' : formatMoney(displayValue);

        trMain.innerHTML = `
            <td class="toggle-col">${item._hasDetail ? '✓' : '+'}</td>
            <td>
                <div style="font-weight:bold; margin-bottom:2px;">${item.nama_paket || '-'}</div>
                <div style="font-size:9px; color:#666;">${item.kode} | ${item.instansi || ''}</div>
            </td>
            <td style="text-align:right; font-weight:600;">${displayMoney}</td>
        `;

        // Proxy Link Click (DIRECT INJECTION METHOD)
        const nameDiv = trMain.cells[1].querySelector('div');
        if (item.link_url) {
            nameDiv.innerHTML = `<a href="#" class="paket-link">${item.nama_paket}</a>`;
            nameDiv.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                
                // Gunakan chrome.tabs.create agar lebih reliable membuka tab baru dan mentrigger onUpdated
                chrome.tabs.create({ url: item.link_url, active: true });
            });
        }

        const trDetail = document.createElement('tr');
        trDetail.className = 'detail-row';
        
        let listHTML = '<div class="list-group">';
        const keys = Object.keys(item).filter(k => !k.startsWith('_') && k !== 'link_url');
        keys.forEach(key => {
            let val = item[key];
            if (val === null || val === undefined || val === "") return;
            let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if ((key.includes('hps') || key.includes('nilai') || key.includes('pagu')) && typeof val === 'number') {
                val = formatMoney(val);
            }
            listHTML += `<div class="list-item"><span class="label">${label}</span><span class="value">${val}</span></div>`;
        });
        listHTML += '</div>';

        trDetail.innerHTML = `<td colspan="3"><div class="detail-container">${listHTML}</div></td>`;

        trMain.addEventListener('click', () => {
            const isOpen = trDetail.classList.contains('show');
            if (isOpen) {
                trDetail.classList.remove('show');
                trMain.style.backgroundColor = '';
            } else {
                trDetail.classList.add('show');
                trMain.style.backgroundColor = '#f1f3f5';
            }
        });

        tbody.appendChild(trMain);
        tbody.appendChild(trDetail);
    });
}

function formatMoney(num) {
    return "Rp " + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Download Handlers (Sama seperti sebelumnya)
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