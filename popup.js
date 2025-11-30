document.getElementById('btnScrape').addEventListener('click', async () => {
    // 1. Dapatkan tab yang sedang aktif
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
        updateStatus("Error: Tidak ada tab aktif.");
        return;
    }

    // 2. Injeksikan script ke dalam tab tersebut
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        // PENTING: Urutan file di array ini sangat menentukan.
        // processor.js harus dimuat DULUAN agar class LpseInterface tersedia untuk content.js
        files: ['processor.js', 'content.js']
    }, () => {
        // Callback setelah script berhasil di-inject (atau gagal)
        if (chrome.runtime.lastError) {
            updateStatus("Error Scripting: " + chrome.runtime.lastError.message);
        } else {
            updateStatus("Sedang mengambil data...");
        }
    });
});

// 3. Dengarkan pesan balasan dari content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "data_scraped") {
        // Tampilkan hasil CSV di textarea
        const outputArea = document.getElementById('output');
        outputArea.value = request.data;
        
        // Update status info
        updateStatus(`Berhasil! ${request.count} baris data ditemukan.`);
        
        // Auto-select text agar mudah dicopy
        outputArea.select();
    }
});

// Helper sederhana untuk update teks status di UI
function updateStatus(msg) {
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.innerText = msg;
}