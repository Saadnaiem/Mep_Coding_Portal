const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("split('T')[0]}\.xlsx\);\n    };", "split('T')[0]}\.xlsx\);\n} catch(err) { console.error('Export Error:', err); alert('Export failed! Please check console.'); }\n    };");

fs.writeFileSync(file, content);
