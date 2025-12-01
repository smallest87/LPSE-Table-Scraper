if (typeof DataFormatter === 'undefined') {
    window.DataFormatter = class DataFormatter {
        /**
         * Mengubah format mata uang (HPS/Pagu) menjadi Angka Murni.
         */
        static parseHPS(value) {
            if (!value) return 0;
    
            let str = value.toString().toLowerCase().trim();
            let multiplier = 1;
    
            if (str.includes(" t ") || str.endsWith("t") || str.includes("triliun")) {
                multiplier = 1000000000000;
            } else if (str.includes(" m ") || str.endsWith("m") || str.includes("miliar")) {
                multiplier = 1000000000;
            } else if (str.includes("jt") || str.includes("juta")) {
                multiplier = 1000000;
            }
    
            // Hapus karakter non-angka/koma/titik
            let cleanNum = str.replace(/[^0-9,.]/g, "");
    
            if (multiplier > 1) {
                // Singkatan (2,6 M) -> Koma adalah desimal
                cleanNum = cleanNum.replace(/\./g, "").replace(",", ".");
            } else {
                // Lengkap (Rp 1.000,00) -> Titik hapus, Koma jadi titik
                cleanNum = cleanNum.replace(/\./g, "").replace(",", ".");
            }
    
            return Math.round(parseFloat(cleanNum) * multiplier);
        }

        /**
         * LOGIKA: 
         * - Jika ada angka -> Return Integer
         * - Jika teks huruf saja -> Return null
         */
        static parseNilaiKontrak(value) {
            if (!value) return null;

            // Cek apakah ada digit (0-9) dalam string
            const hasDigit = /\d/.test(value);

            if (hasDigit) {
                return this.parseHPS(value);
            } else {
                return null; // Return NULL agar JSON bersih
            }
        }
    }
}