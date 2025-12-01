# Panduan Kontribusi

Terima kasih atas minat Anda untuk berkontribusi pada **LPSE Pro Scraper**! 🎉
Proyek ini dikembangkan untuk komunitas, dan setiap kontribusi—sekecil apa pun—sangat berharga.

## 🛠️ Persiapan Pengembangan

Proyek ini dibangun menggunakan **Vanilla JavaScript** (tanpa framework seperti React/Vue) untuk menjaga performa ringan dan kompatibilitas maksimal.

### Prasyarat
* Google Chrome / Microsoft Edge / Brave (Chromium based browser).
* Text Editor (VS Code disarankan).
* Pemahaman tentang **Chrome Extension Manifest V3**.

### Cara Menjalankan Proyek Secara Lokal
1.  **Fork** repositori ini ke akun GitHub Anda.
2.  **Clone** ke komputer lokal:
    ```bash
    git clone [https://github.com/USERNAME-ANDA/lpse-pro-scraper.git](https://github.com/USERNAME-ANDA/lpse-pro-scraper.git)
    ```
3.  Buka Chrome dan navigasi ke `chrome://extensions/`.
4.  Aktifkan **Developer Mode**.
5.  Klik **Load Unpacked** dan pilih folder proyek hasil clone.

## 🤝 Cara Berkontribusi

### Melaporkan Bug
Jika Anda menemukan error, silakan buat **Issue** baru dengan format:
* **Judul:** Deskripsi singkat error.
* **URL LPSE:** Link halaman di mana error terjadi (Contoh: lpse.malangkab.go.id).
* **Langkah Reproduksi:** Apa yang Anda klik sebelum error muncul?
* **Screenshot:** (Jika ada).

### Mengirimkan Kode (Pull Request)
1.  Buat **Branch** baru untuk fitur/fix Anda:
    * `fix/nama-bug` (untuk perbaikan bug)
    * `feat/nama-fitur` (untuk fitur baru)
2.  Lakukan perubahan kode. Pastikan kode rapi dan diberi komentar jika logikanya kompleks.
3.  Uji coba ekstensi secara lokal (pastikan fitur Batch Scrape dan Native Click tetap jalan).
4.  Push ke fork Anda dan buat **Pull Request (PR)** ke branch `main` repositori ini.

## 📂 Struktur Kode Penting
* `processor.js`: Logika parsing HTML (Jika ada perubahan struktur tabel LPSE, edit di sini).
* `content.js`: Penghubung antara halaman web dan ekstensi (Router & Click Simulator).
* `sidepanel.js`: Logika UI, manajemen state, dan antrean batch scraping.

## 📜 Code of Conduct
Harap berinteraksi dengan sopan dan profesional. Kami tidak menoleransi pelecehan atau perilaku toksik.