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
```

## 🛠️ Cara Instalasi

Karena ekstensi ini belum tersedia di Chrome Web Store, Anda perlu menginstalnya secara manual (Developer Mode).

### Langkah 1: Unduh Kode
1.  **Clone** repositori ini menggunakan Git:
    ```bash
    git clone [https://github.com/juliansukrisna/lpse-pro-scraper.git](https://github.com/juliansukrisna/lpse-pro-scraper.git)
    ```
    *Atau*
2.  **Download ZIP** dari halaman GitHub ini, lalu ekstrak (unzip) ke sebuah folder di komputer Anda.

### Langkah 2: Muat ke Chrome
1.  Buka Google Chrome.
2.  Ketik `chrome://extensions/` di address bar dan tekan Enter.
3.  Aktifkan toogle **Developer mode** di pojok kanan atas halaman.
4.  Klik tombol **Load unpacked** (Muat yang belum dikemas) di pojok kiri atas.
5.  Pilih **folder** tempat Anda menyimpan/mengekstrak kode proyek ini.

### Langkah 3: Sematkan (Penting!)
Agar Side Panel mudah diakses:
1.  Klik ikon **Puzzle (🧩)** di toolbar Chrome (sebelah kanan address bar).
2.  Cari **"LPSE Pro Scraper"**.
3.  Klik ikon **Pin (📌)** agar ikon ekstensi selalu muncul di toolbar.

🎉 **Selesai!** Sekarang klik ikon ekstensi tersebut untuk membuka Side Panel.

## 👥 PARA SPONSOR
Masih menunggu orang-orang baik

## 💰 DONASI

### 📢 STATUS DONASI:
```
OPERASIONAL BULANAN
Biaya Hidup & Menghidupi (DES '25)
█|░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| IDR  6.000.000 |
Terkumpul: IDR 0,00 (0%)

Biaya Sewa/Beli Developer Tools (DES '25)
█|░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| IDR  2.000.000 |
Terkumpul: IDR 0,00 (0%)
====================================================
Target Impian:
14-inch MacBook Pro M4
█|░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| IDR 26.499.000 |
Terkumpul: IDR 0,00 (0%)
```

### LINK DONASI
1. [SAWERIA](https://saweria.co/juliansukrisna) - QRIS, GoPay, OVO, Dana, LinkAja
2. [SOCIABUZZ](https://sociabuzz.com/juliansukrisna/tribe) - eWallet, QRIS, Bank Transfer, Retail Outlet, Credit Card
3. [TRAKTEER](https://teer.id/juliansukrisna)