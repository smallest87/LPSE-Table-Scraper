# Kebijakan Privasi

**LPSE Pro Scraper** menghargai privasi Anda. Dokumen ini menjelaskan bagaimana data ditangani oleh ekstensi ini.

## Pengumpulan Data
Ekstensi ini **tidak** mengumpulkan, menyimpan, atau mengirimkan data pribadi atau data hasil scraping Anda ke server eksternal, server pihak ketiga, atau server pengembang.

## Penyimpanan Data
Semua data yang diambil (scraped) dari situs LPSE disimpan secara **lokal** di dalam browser Anda menggunakan API `chrome.storage.local`. Data ini hanya ada di komputer Anda dan akan hilang jika Anda menghapus ekstensi atau membersihkan cache ekstensi.

## Izin Akses (Permissions)
* **activeTab & scripting:** Digunakan semata-mata untuk membaca tabel HTML pada halaman LPSE yang sedang Anda buka.
* **storage:** Digunakan untuk menyimpan sementara hasil scraping agar tidak hilang saat Anda berpindah tab.
* **sidePanel:** Digunakan untuk menampilkan antarmuka pengguna.

## Hubungi Kami
Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini, silakan buat Issue di repositori GitHub ini.