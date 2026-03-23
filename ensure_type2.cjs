const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/saveAs\(new Blob\(\[buffer\]\), \Assigned_Updates_\$\\{new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\\}\.xlsx\\);/, "const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });\n        saveAs(blob, \Assigned_Updates_\.xlsx\);");

content = content.replace(/saveAs\(new Blob\(\[buffer\]\), \My_Existing_Product_Mods_\$\\{new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\\}\.xlsx\\);/, "const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });\n        saveAs(blob, \My_Existing_Product_Mods_\.xlsx\);");

fs.writeFileSync(file, content);
