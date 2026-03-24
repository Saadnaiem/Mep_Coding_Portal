const fs = require('fs');
let c = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

// 1. Add handleShowAllItems
const tHandle = `fetchItems(1, { dateFrom: '2026-03-21', dateTo: '' });
    };`;
const rHandle = `fetchItems(1, { dateFrom: '2026-03-21', dateTo: '' });
    };

    const handleShowAllItems = () => {
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
        fetchItems(1, { dateFrom: '', dateTo: '' });
    };`;

if(c.includes(tHandle)) {
    c = c.replace(tHandle, rHandle);
    console.log("Handler added.");
} else {
    console.error("Could not find insertion point for handler.");
}

// 2. Replace the HTML div
const tTarget = `<div className="bg-[#0F3D3E]/5 px-4 py-2.5 rounded-xl border border-[#0F3D3E]/10 flex items-center gap-2 shadow-sm">
                               <span className="text-[#0F3D3E] font-bold text-sm tracking-wide">Total Products</span>`;

const rTarget = `<div 
                            onClick={handleShowAllItems}
                            className="bg-[#0F3D3E]/5 hover:bg-[#0F3D3E]/10 cursor-pointer transition-colors px-4 py-2.5 rounded-xl border border-[#0F3D3E]/20 flex items-center gap-2 shadow-sm">
                               <span className="text-[#0F3D3E] font-bold text-sm tracking-wide">Total Products</span>`;

// Use regex for robust multiline replace
const regexTarget = /<div className="bg-\[#0F3D3E\]\/5 px-4 py-2\.5[\s\r\n]*rounded-xl border border-\[#0F3D3E\]\/10 flex items-center gap-2 shadow-sm">[\s\r\n]*<span className="text-\[#0F3D3E\] font-bold[\s\r\n]*text-sm tracking-wide">Total Products<\/span>/g;

if (regexTarget.test(c)) {
    c = c.replace(regexTarget, `<div 
                            onClick={handleShowAllItems}
                            className="bg-[#0F3D3E]/5 hover:bg-[#0F3D3E]/10 cursor-pointer transition-colors px-4 py-2.5 rounded-xl border border-[#0F3D3E]/20 flex items-center gap-2 shadow-sm">
                               <span className="text-[#0F3D3E] font-bold text-sm tracking-wide">Total Products</span>`);
    console.log("HTML updated.");
} else {
    console.error("Could not find HTML div.");
}

fs.writeFileSync('components/ItemMasterAssignment.tsx', c, 'utf8');
