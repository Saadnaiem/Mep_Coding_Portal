const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const handleExportAssigned = async \(\) => \{ try \{ try \{\s*try\{\s*/g, "const handleExportAssigned = async () => {\n  try {\n");
content = content.replace(/const handleExportHistory = async \(\) => \{ try \{ try \{\s*try\{\s*/g, "const handleExportHistory = async () => {\n  try {\n");

fs.writeFileSync(file, content);
