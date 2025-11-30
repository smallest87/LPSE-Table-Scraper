document.getElementById('btnScrape').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
        alert("Tidak ada tab aktif.");
        return;
    }

    // Injeksikan content script
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    }, () => {
        // Tangkap error jika permission bermasalah
        if (chrome.runtime.lastError) {
            document.getElementById('status').innerText = "Error: " + chrome.runtime.lastError.message;
        }
    });
});

// Mendengarkan pesan balasan dari content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "data_scraped") {
        document.getElementById('output').value = request.data;
        document.getElementById('status').innerText = `Berhasil mengambil ${request.count} baris.`;
    }
});