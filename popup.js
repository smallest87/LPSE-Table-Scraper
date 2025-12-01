document.getElementById('btnScrape').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) return;

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        // URUTAN INJEKSI:
        // 1. repository.js (Menyiapkan class output)
        // 2. processor.js (Menyiapkan class parsing)
        // 3. content.js (Eksekusi utama)
        files: ['repository.js', 'processor.js', 'content.js']
    }, () => {
        if (chrome.runtime.lastError) {
            document.getElementById('status').innerText = "Error: " + chrome.runtime.lastError.message;
        }
    });
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "data_scraped") {
        document.getElementById('output').value = request.data;
        document.getElementById('status').innerText = `Berhasil: ${request.count} data.`;
    }
});