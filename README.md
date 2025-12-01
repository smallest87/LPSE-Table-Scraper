# LPSE Pro Scraper 🚀

**LPSE Pro Scraper** adalah Ekstensi Google Chrome canggih untuk melakukan ekstraksi data (scraping) dari situs **LPSE (Layanan Pengadaan Secara Elektronik)** di Indonesia.

Dibangun dengan **Manifest V3** dan menggunakan antarmuka **Side Panel** yang persisten, alat ini memungkinkan Anda mengumpulkan data lelang, non-tender, dan pencatatan secara massal, lengkap dengan detail paketnya.

![Version](https://img.shields.io/badge/version-2.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Fitur Utama

* **🖥️ Side Panel Persisten:** Antarmuka tidak akan tertutup saat Anda berpindah tab atau mengklik tautan.
* **🔗 Auto-Merge Data:** Menggabungkan data tabel utama (Daftar) dengan data detail (Halaman Satuan) secara otomatis ke dalam satu baris JSON/CSV.
* **🤖 Batch Scraping Otomatis:** Mengambil detail dari puluhan paket secara otomatis dengan satu klik.
* **🛡️ Anti-Bot Detection:**
    * **Randomized Delay:** Jeda waktu acak antar request (3-7 detik) agar terlihat seperti manusia.
    * **Randomized Queue:** Mengacak urutan pengambilan data.
    * **Native Click Simulation:** Menggunakan simulasi klik DOM asli untuk menjaga validitas Referrer dan Session ID.
* **📊 Format Data Bersih:** Nilai mata uang (Rp) otomatis dikonversi menjadi *Integer* siap olah.
* **💾 Ekspor Mudah:** Unduh data dalam format `.CSV` (Excel compatible) atau `.JSON`.

## 📂 Struktur File

```text
├── manifest.json       # Konfigurasi Ekstensi V3
├── sidepanel.html      # Antarmuka Pengguna (UI)
├── sidepanel.js        # Logika Utama UI & Kontrol Batch
├── content.js          # Script Injeksi (Router & Click Simulator)
├── processor.js        # Parser HTML (Tabel & Detail)
├── formatter.js        # Helper konversi angka/uang
├── repository.js       # Helper ekspor data (CSV/JSON)
├── background.js       # Service Worker
└── icons/              # Folder ikon aplikasi