const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let text = fs.readFileSync(file, 'utf8');

text = text.replace(/history\.filter\(item => item\.status !== 'pending_vendor'\)\.forEach\(item => \{/, 
  "history.filter(item => item.status !== 'pending_vendor').forEach(item => {\n" + 
  "             // Safe parse images\n" + 
  "             let images = [];\n" + 
  "             if (Array.isArray(item.image_urls)) {\n" + 
  "                 images = item.image_urls;\n" + 
  "             } else if (typeof item.image_urls === 'string') {\n" + 
  "                 try { images = JSON.parse(item.image_urls); } catch(e){}\n" + 
  "             }\n"
);

text = text.replace('const images = item.image_urls || [];', '');

// Also ensure every field doesn't pass undefined/null into array which excelJS can choke on sometimes in some versions
text = text.replace(/const fullRowData = \[\.\.\.row, \.\.\.imageSlots, \.\.\.meta\];/,
    "const fullRowData = [...row.map(val => (val === null || val === undefined) ? '' : String(val)), ...imageSlots, ...meta];"
);

fs.writeFileSync(file, text);
