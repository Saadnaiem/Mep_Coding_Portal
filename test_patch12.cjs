const fs = require('fs');
let c = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

c = c.replace(`    const handleShowAllItems = () => {
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
        fetchItems(1, { dateFrom: '', dateTo: '' });
    };

    const handleShowAllItems = () => {
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
        fetchItems(1, { dateFrom: '', dateTo: '' });
    };`, `    const handleShowAllItems = () => {
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
        fetchItems(1, { dateFrom: '', dateTo: '' });
    };`);

// Also do unix version just in case
c = c.replace(`    const handleShowAllItems = () => {\r
        setDateFrom('');\r
        setDateTo('');\r
        setCurrentPage(1);\r
        fetchItems(1, { dateFrom: '', dateTo: '' });\r
    };\r
\r
    const handleShowAllItems = () => {\r
        setDateFrom('');\r
        setDateTo('');\r
        setCurrentPage(1);\r
        fetchItems(1, { dateFrom: '', dateTo: '' });\r
    };`, `    const handleShowAllItems = () => {\r
        setDateFrom('');\r
        setDateTo('');\r
        setCurrentPage(1);\r
        fetchItems(1, { dateFrom: '', dateTo: '' });\r
    };`);

// More robust regex removal of duplicates
c = c.replace(/(const handleShowAllItems = \(\) => {[\s\S]*?};\s*)(?=const handleShowAllItems = \(\) => {)/, '');


fs.writeFileSync('components/ItemMasterAssignment.tsx', c, 'utf8');
