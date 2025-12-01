if (typeof DataFormatter === 'undefined') {
    window.DataFormatter = class DataFormatter {
        // Format Uang
        static parseHPS(value) {
            if (!value) return 0;
            let str = value.toString().toLowerCase().trim();
            let multiplier = 1;
            if (str.includes(" t ") || str.endsWith("t") || str.includes("triliun")) multiplier = 1000000000000;
            else if (str.includes(" m ") || str.endsWith("m") || str.includes("miliar")) multiplier = 1000000000;
            else if (str.includes("jt") || str.includes("juta")) multiplier = 1000000;
            
            let cleanNum = str.replace(/[^0-9,.]/g, "");
            if (multiplier > 1) cleanNum = cleanNum.replace(/\./g, "").replace(",", ".");
            else cleanNum = cleanNum.replace(/\./g, "").replace(",", ".");
            
            return Math.round(parseFloat(cleanNum) * multiplier);
        }

        static parseNilaiKontrak(value) {
            if (!value) return 0;
            const hasDigit = /\d/.test(value);
            if (hasDigit) return this.parseHPS(value);
            else return 0;
        }

        // --- BARU: FORMAT TANGGAL ISO (YYYY-MM-DD) ---
        // Input: "13 Agustus 2025" -> Output: "2025-08-13"
        static formatDateISO(text) {
            if (!text) return "";
            
            const months = {
                "januari": "01", "februari": "02", "maret": "03", "april": "04",
                "mei": "05", "juni": "06", "juli": "07", "agustus": "08",
                "september": "09", "oktober": "10", "november": "11", "desember": "12",
                "jan": "01", "feb": "02", "mar": "03", "apr": "04", "may": "05", "jun": "06",
                "jul": "07", "aug": "08", "sep": "09", "oct": "10", "nov": "11", "dec": "12",
                "agt": "08" // Singkatan umum Indo
            };

            // Hapus karakter aneh, sisakan huruf dan angka
            const cleanText = text.trim().replace(/,/g, ''); 
            const parts = cleanText.split(" ");

            if (parts.length < 3) return text; // Gagal parse, kembalikan asli

            const day = parts[0].padStart(2, '0'); // "1" -> "01"
            const monthName = parts[1].toLowerCase();
            const year = parts[2];

            const month = months[monthName];

            if (day && month && year) {
                return `${year}-${month}-${day}`;
            }
            
            return text; // Fallback jika format tidak dikenali
        }
    }
}