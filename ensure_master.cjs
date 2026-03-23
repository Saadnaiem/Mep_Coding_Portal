const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const rowData: any = \{\};\n\s*fileFields\.forEach\(f => \{/g, "const rowData: any = {};\n              fileFields.forEach(f => {\n                  if (f.key === 'division') rowData[f.key] = (item as any)[f.key] || masterInfo?.division || '';\n                  else if (f.key === 'department') rowData[f.key] = (item as any)[f.key] || masterInfo?.department || '';\n                  else if (f.key === 'class_name') rowData[f.key] = (item as any)[f.key] || masterInfo?.class_name || '';\n                  else if (f.key === 'category_pop') rowData[f.key] = (item as any)[f.key] || masterInfo?.category || '';\n                  else if (f.key === 'sub_category_pop') rowData[f.key] = (item as any)[f.key] || masterInfo?.sub_category || '';\n                  else rowData[f.key] = (item as any)[f.key] || '';\n              });\n//");

fs.writeFileSync(file, content);
