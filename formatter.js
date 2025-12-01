if (typeof DataFormatter === 'undefined') {
    window.DataFormatter = class DataFormatter {
        /**
         * Mengubah format mata uang singkat (Indo) menjadi Angka Murni (Number)
         */
        static parseHPS(value) {
            if (!value) return 0;
    
            // 1. Normalisasi: Lowercase & Trim
            let str = value.toString().toLowerCase().trim();
            let multiplier = 1;
    
            // 2. Deteksi Suffix
            if (str.includes(" t ") || str.endsWith("t") || str.includes("triliun")) {
                multiplier = 1000000000000;
            } else if (str.includes(" m ") || str.endsWith("m") || str.includes("miliar")) {
                multiplier = 1000000000;
            } else if (str.includes("jt") || str.includes("juta")) {
                multiplier = 1000000;
            }
    
            // 3. Pembersihan Karakter (Hanya angka, koma, titik)
            let cleanNum = str.replace(/[^0-9,.]/g, "");
    
            // 4. Konversi String ke Float
            if (multiplier > 1) {
                // Format singkatan (2,6 M) -> Koma adalah desimal JS
                cleanNum = cleanNum.replace(/\./g, "").replace(",", ".");
            } else {
                // Format lengkap (Rp 1.000,00) -> Titik hapus, Koma jadi titik
                cleanNum = cleanNum.replace(/\./g, "").replace(",", ".");
            }
    
            // 5. Kalkulasi Akhir
            return Math.round(parseFloat(cleanNum) * multiplier);
        }
    }
}