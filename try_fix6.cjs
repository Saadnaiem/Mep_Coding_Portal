const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("saveAs(new Blob([buffer]), \Assigned_Updates_\.xlsx\);\n      };", "saveAs(new Blob([buffer]), \Assigned_Updates_\.xlsx\);\n}catch(e){console.log(e)}\n      };");

content = content.replace("saveAs(new Blob([buffer]), \My_Existing_Product_Mods_\.xlsx\);\n      };", "saveAs(new Blob([buffer]), \My_Existing_Product_Mods_\.xlsx\);\n}catch(e){console.log(e)}\n     };");

fs.writeFileSync(file, content);
