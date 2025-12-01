if (typeof DataFormatter === 'undefined') {
    window.DataFormatter = class DataFormatter {
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
    }
}