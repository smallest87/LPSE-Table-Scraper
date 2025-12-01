// Mengatur agar klik ikon ekstensi membuka Side Panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));