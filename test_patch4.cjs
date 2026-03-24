const fs = require('fs');
let ap = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

ap = ap.replace(/    const handleShowNewItems = \(\) \=\> \{\n        setDateFrom\(\'2026\-03\-21\'\);\n        setDateTo\(\'\'\);\n        setCurrentPage\(1\);\n        fetchItems\(1\, \{ dateFrom: \'2026\-03\-21\', dateTo: \'\' \}\);\n    \};\n\n    const handleShowNewItems = \(\) \=\> \{\n        setDateFrom\(\'2026\-03\-21\'\);\n        setDateTo\(\'\'\);\n        setCurrentPage\(1\);\n        fetchItems\(1\, \{ dateFrom: \'2026\-03\-21\', dateTo: \'\' \}\);\n    \};\n/g, 
`    const handleShowNewItems = () => {
        setDateFrom('2026-03-21');
        setDateTo('');
        setCurrentPage(1);
        fetchItems(1, { dateFrom: '2026-03-21', dateTo: '' });
    };\n`);

fs.writeFileSync('components/ItemMasterAssignment.tsx', ap, 'utf8');
console.log('ItemMasterAssignment updated step 4!');
