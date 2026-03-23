const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("saveAs(new Blob([buffer]), \My_Existing_Product_Mods_\.xlsx\);\n      };\n\n      const handleChange = (field:", "saveAs(new Blob([buffer]), \My_Existing_Product_Mods_\.xlsx\);\n}catch(e){console.error('EXPORT HISTORY ERR:', e); alert('Error exporting: ' + e.message);}\n    };\n\n    const handleChange = (field:");

content = content.replace("saveAs(new Blob([buffer]), \Assigned_Updates_\.xlsx\);\n      };\n\n      const handleImportAssigned = async (e: React.ChangeEvent<HTMLInputElement>) => {", "saveAs(new Blob([buffer]), \Assigned_Updates_\.xlsx\);\n}catch(e){console.error('EXPORT ASSIGNED ERR:', e); alert('Error exporting: ' + e.message);}\n    };\n\n    const handleImportAssigned = async (e: React.ChangeEvent<HTMLInputElement>) => {");

fs.writeFileSync(file, content);
