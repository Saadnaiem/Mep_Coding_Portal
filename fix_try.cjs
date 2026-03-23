const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("const handleExportAssigned = async () => { try { try {\n  try{\n          const workbook = new ExcelJS.Workbook();", "const handleExportAssigned = async () => {\ntry {\nconst workbook = new ExcelJS.Workbook();");

content = content.replace("split('T')[0]}\.xlsx\);\n    };", "split('T')[0]}\.xlsx\);\n} catch(err) { console.error('Export Error:', err); alert('Export failed! Please check console.'); }\n    };");


content = content.replace("const handleExportHistory = async () => { try { try {\ntry{\n          const workbook = new ExcelJS.Workbook();", "const handleExportHistory = async () => {\ntry {\nconst workbook = new ExcelJS.Workbook();");

fs.writeFileSync(file, content);
