const fs = require('fs');
let text = fs.readFileSync('components/ExistingProductModification.tsx', 'utf8');

text = text.replace(/<thead className="text-white">([\s\S]*?)<\/thead>/g, (match) => {
    let replaced = match.replace('text-white', 'text-[#107c41] font-bold');
    replaced = replaced.replaceAll('bg-[#107c41]', 'bg-white');
    return replaced;
});

fs.writeFileSync('components/ExistingProductModification.tsx', text);
console.log("Replaced using Regex!");
