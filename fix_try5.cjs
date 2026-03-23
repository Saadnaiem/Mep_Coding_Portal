const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("saveAs(new Blob([buffer]), \Assigned_Updates_\.xlsx\);\n      };", "saveAs(new Blob([buffer]), \Assigned_Updates_\.xlsx\);\n} catch(err) { console.error('Export Error:', err); alert('Export failed! Please check console.'); }\n      };");

fs.writeFileSync(file, content);
