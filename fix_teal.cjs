const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let text = fs.readFileSync(file, 'utf8');

// The card header
text = text.replace(/className="border-t-4 border-t-red-500"\\s*headerClassName="bg-\\[#107c41\\]"/g, 'className="border-t-4 border-t-red-500" headerClassName="bg-[#0F3D3E] text-white"');

// The table header
text = text.replace(/<thead className="text-\\[#107c41\\]\\s*font-bold">([\\s\\S]*?)<\\/thead>/g, (match, p1) => {
    let replaced = match.replace(/text-\\[#107c41\\]/g, 'text-white bg-[#0F3D3E]');
    replaced = replaced.replace(/border-\\[#107c41\\]/g, 'border-[#0F3D3E]');
    replaced = replaced.replace(/bg-white/g, 'bg-[#0F3D3E]');
    return replaced;
});

fs.writeFileSync(file, text);
console.log('done');
