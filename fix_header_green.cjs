const fs = require('fs');
let text = fs.readFileSync('components/ExistingProductModification.tsx', 'utf8');

const regex = /<thead className="text-\\[#107c41\\]\s*font-bold">([\s\S]*?)<\/thead>/g;

text = text.replace(regex, (match) => {
    let replaced = match.replace('text-[#107c41] font-bold', 'text-white');
    replaced = replaced.replaceAll('bg-white', 'bg-[#107c41]');
    return replaced;
});

fs.writeFileSync('components/ExistingProductModification.tsx', text);
console.log("Replaced table headers to match button color!");
