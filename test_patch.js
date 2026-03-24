const fs = require('fs');

let ap = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

const targetStr1 = ".gte('created_at', '2026-03-22T00:00:00Z');";
const replaceStr1 = ".gte('created_at', '2026-03-21T00:00:00Z');";

const targetStr2 = "? new Date(dateFrom).toISOString() : '2026-03-22T00:00:00Z');";
const replaceStr2 = "? new Date(dateFrom).toISOString() : '2026-03-21T00:00:00Z');";

const targetStr3 = "new Date(dateFrom) > new Date('2026-03-22T00:00:00Z')";
const replaceStr3 = "new Date(dateFrom) > new Date('2026-03-21T00:00:00Z')";

ap = ap.replace(targetStr1, replaceStr1);
ap = ap.replace(targetStr2, replaceStr2);
ap = ap.replace(targetStr3, replaceStr3);

fs.writeFileSync('components/ItemMasterAssignment.tsx', ap, 'utf8');
console.log('ItemMasterAssignment Updated!');
