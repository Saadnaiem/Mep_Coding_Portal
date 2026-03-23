const fs = require('fs');
let code = fs.readFileSync('components/ExistingModificationsReport.tsx', 'utf8');
const match = code.match(/if\s*\(vendorEmail\)\s*\{[\s\S]*?dynamic_data:[\s\S]*?\}\s*\);\s*\}/);
console.log(match ? "Matched" : "No match");
