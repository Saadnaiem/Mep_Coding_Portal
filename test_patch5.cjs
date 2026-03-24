const fs = require('fs');
let ap = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

const snpi = `    const handleShowNewItems = () => {
        setDateFrom('2026-03-21');
        setDateTo('');
        setCurrentPage(1);
        fetchItems(1, { dateFrom: '2026-03-21', dateTo: '' });
    };`;

while (ap.includes(snpi)) {
    ap = ap.replace(snpi, "");
}
ap = ap.replace(`    const handleFilter = () => {\r\n        setCurrentPage(1);\r\n        fetchItems(1);\r\n    };\r\n\r\n`, `    const handleFilter = () => {\r\n        setCurrentPage(1);\r\n        fetchItems(1);\r\n    };\r\n\r\n` + snpi + `\r\n\r\n`);
ap = ap.replace(`    const handleFilter = () => {\n        setCurrentPage(1);\n        fetchItems(1);\n    };\n\n`, `    const handleFilter = () => {\n        setCurrentPage(1);\n        fetchItems(1);\n    };\n\n` + snpi + `\n\n`);

fs.writeFileSync('components/ItemMasterAssignment.tsx', ap, 'utf8');
console.log('ItemMasterAssignment updated step 5!');
