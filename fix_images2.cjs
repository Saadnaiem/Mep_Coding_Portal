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
        content = content.replaceAll("const suffix = idx === 0 ? '' : \_\\;", "const suffix = idx === 0 ? '' : \#\\;");
        content = content.replaceAll("const suffix = i === 0 ? '' : \_\\;", "const suffix = i === 0 ? '' : \#\\;");
        fs.writeFileSync(file, content);
    }
}
