const fs = require('fs');
let c = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

const regexTarget2 = /<div className="bg-\[#0F3D3E\]\/5 px-4 py-2\.5[\s\r\n]*rounded-xl border border-\[#0F3D3E\]\/10 flex items-center gap-2 shadow-sm">/g;

if (regexTarget2.test(c)) {
    c = c.replace(regexTarget2, `<div 
                            onClick={handleShowAllItems}
                            className="bg-[#0F3D3E]/5 hover:bg-[#0F3D3E]/10 cursor-pointer transition-colors px-4 py-2.5 rounded-xl border border-[#0F3D3E]/20 flex items-center gap-2 shadow-sm">`);
    console.log("HTML updated.");
} else {
    console.error("Could not find HTML div with regex 2.");
}

fs.writeFileSync('components/ItemMasterAssignment.tsx', c, 'utf8');
