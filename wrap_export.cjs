const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const buffer = await workbook\.xlsx\.writeBuffer\(\);\s*saveAs\(new Blob\(\[buffer\]\),/g, "try { const buffer = await workbook.xlsx.writeBuffer(); saveAs(new Blob([buffer]),");

content = content.replace(/Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\}\\.xlsx\\);\s*\}\;/g, "Date().toISOString().split('T')[0]}\.xlsx\); } catch(err) { console.error('Excel Export Error:', err); alert('Failed to export. Please check console for errors.'); } };");

fs.writeFileSync(file, content);
