const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("const handleExportHistory = async () => {", "const handleExportHistory = async () => { try {");
content = content.replace("Date().toISOString().split('T')[0]}\.xlsx\);\n      };", "Date().toISOString().split('T')[0]}\.xlsx\); } catch(e) { console.error('Export Error:', e); alert('Export failed! Please check console.'); }\n      };");

content = content.replace("const handleExportAssigned = async () => {", "const handleExportAssigned = async () => { try {");
content = content.replace("Date().toISOString().split('T')[0]}\.xlsx\);\n      };", "Date().toISOString().split('T')[0]}\.xlsx\); } catch(e) { console.error('Export Error:', e); alert('Export failed! Please check console.'); }\n      };");

fs.writeFileSync(file, content);
