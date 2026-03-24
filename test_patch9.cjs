const fs = require('fs');
let c = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

c = c.replace(
    /<div className="bg-emerald-50 px-4 py-2\.5[\s\r\n]*rounded-xl border border-emerald-100 flex items-center gap-2 shadow-sm[\s\r\n]*animate-in fade-in">/s,
    `<div 
                            onClick={handleShowNewItems}
                            className="bg-emerald-50 hover:bg-emerald-100 cursor-pointer px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-2 shadow-sm transition-colors animate-in fade-in">`
);

fs.writeFileSync('components/ItemMasterAssignment.tsx', c, 'utf8');
