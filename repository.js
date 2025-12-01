if (typeof LpseRepository === 'undefined') {
    window.LpseRepository = class LpseRepository {
        static toCSV(dataArray) {
            if (dataArray.length === 0) return "";

            // AMBIL SEMUA KOLOM SECARA DINAMIS DARI DATA PERTAMA
            const columns = Object.keys(dataArray[0]);

            // Header
            const header = columns.map(col => col.replace(/_/g, ' ').toUpperCase()).join(";") + "\n";
            
            // Body
            const body = dataArray.map(item => {
                return columns.map(col => {
                    let val = item[col];
                    // Handle null/undefined
                    if (val === null || val === undefined) val = "";
                    // Handle string yang butuh escape
                    if (typeof val === 'string') val = val.replace(/"/g, '""');
                    return `"${val}"`;
                }).join(";");
            }).join("\n");
    
            return header + body;
        }
    
        static toJSON(dataArray) {
            return JSON.stringify(dataArray, null, 4);
        }
    }
}