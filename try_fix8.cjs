const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("split('T')[0]}.xlsx\);\n      };", "split('T')[0]}.xlsx\);\n}catch(e){console.log('e')}\n      };");
content = content.replace("split('T')[0]}.xlsx\\);\n      };", "split('T')[0]}.xlsx\\);\n}catch(e){console.log('e')}\n      };");
fs.writeFileSync(file, content);
