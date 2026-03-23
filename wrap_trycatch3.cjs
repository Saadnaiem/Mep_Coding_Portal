const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const handleExportHistory = async \(\) => \{/g, "const handleExportHistory = async () => {\ntry {");
content = content.replace(/saveAs\(new Blob\(\[buffer\]\), \My_Existing_Product_Mods_\$\\{new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\\}\.xlsx\\);\s*\};/g, "saveAs(new Blob([buffer]), \My_Existing_Product_Mods_\.xlsx\);\n} catch(err) { console.error(err); alert('Export failed. Check console.'); }\n      };");

content = content.replace(/const handleExportAssigned = async \(\) => \{/g, "const handleExportAssigned = async () => {\ntry {");
content = content.replace(/saveAs\(new Blob\(\[buffer\]\), \Assigned_Updates_\$\\{new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\\}\.xlsx\\);\s*\};/g, "saveAs(new Blob([buffer]), \Assigned_Updates_\.xlsx\);\n} catch(err) { console.error(err); alert('Export failed. Check console.'); }\n      };");

fs.writeFileSync(file, content);
