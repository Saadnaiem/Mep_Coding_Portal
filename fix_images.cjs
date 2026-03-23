const fs = require('fs');
const files = [
    'components/EcommerceExport.tsx',
    'components/ExistingModificationsReport.tsx',
    'components/ExistingProductModification.tsx',
    'components/Reports.tsx'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/const suffix = idx === 0 \? '' \: \_\\\$\{idx \+ 1\}\;/g, "const suffix = idx === 0 ? '' : \#\\;");
        content = content.replace(/const suffix = i === 0 \? '' \: \_\\\$\{i \+ 1\}\;/g, "const suffix = i === 0 ? '' : \#\\;");
        fs.writeFileSync(file, content);
    }
}
