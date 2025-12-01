document.getElementById('btnScrape').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        // Urutan tetap: Repository (opsional jika butuh download nanti) -> Processor -> Content
        files: ['repository.js', 'processor.js', 'content.js']
    });
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "data_scraped") {
        renderTable(request.items); // Panggil fungsi render
        document.getElementById('status').innerText = `Ditemukan: ${request.count} data.`;
    }
});

/**
 * Fungsi untuk membangun tabel HTML dari JSON Array
 */
function renderTable(items) {
    const tbody = document.getElementById('tableBody');
    const theadRow = document.getElementById('tableHeader');
    
    // Reset isi tabel
    tbody.innerHTML = '';
    theadRow.innerHTML = '';

    if (items.length === 0) return;

    // 1. Buat Header Otomatis dari Keys object pertama
    const headers = Object.keys(items[0]);
    headers.forEach(key => {
        const th = document.createElement('th');
        // Ubah "nama_paket" jadi "Nama Paket" (formatting text sedikit)
        th.innerText = key.replace(/_/g, ' ').toUpperCase(); 
        theadRow.appendChild(th);
    });

    // 2. Buat Baris Data
    items.forEach(item => {
        const tr = document.createElement('tr');
        
        headers.forEach(key => {
            const td = document.createElement('td');
            td.innerText = item[key]; // Masukkan value
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
}