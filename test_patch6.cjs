const fs = require('fs');
let content = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

// Replace signature
content = content.replace("const fetchItems = async (page = currentPage) => {", 
"const fetchItems = async (page = currentPage, overrides?: { dateFrom?: string, dateTo?: string }) => {\n        const effDateFrom = overrides && overrides.dateFrom !== undefined ? overrides.dateFrom : dateFrom;\n        const effDateTo = overrides && overrides.dateTo !== undefined ? overrides.dateTo : dateTo;");

// Replace the date vars in the body of fetchItems
content = content.replace(/if \(dateFrom\) \{/g, "if (effDateFrom) {");
content = content.replace(/new Date\(dateFrom\)/g, "new Date(effDateFrom)");

content = content.replace(/if \(dateTo\) \{/g, "if (effDateTo) {");
content = content.replace(/new Date\(dateTo\)/g, "new Date(effDateTo)");

// Ensure we don't accidentally replace the outer effects or UI parts, 
// actually the above RegExp hit all `dateFrom` in the file.
// Let me revert and do something safer.
