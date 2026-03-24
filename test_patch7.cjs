const fs = require('fs');
let c = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

c = c.replace(
    "const fetchItems = async (page = currentPage) => {",
    "const fetchItems = async (page = currentPage, overrides?: { dateFrom?: string, dateTo?: string }) => {\n        const effDateFrom = overrides && overrides.dateFrom !== undefined ? overrides.dateFrom : dateFrom;\n        const effDateTo = overrides && overrides.dateTo !== undefined ? overrides.dateTo : dateTo;"
);

// We only want to replace inside `fetchItems`. Let's just do a specific index-based slice or exact regex.
c = c.replace(
    "if (dateFrom) {\r\n            query = query.gte('created_at', new Date(dateFrom).toISOString());\r\n        }",
    "if (effDateFrom) {\r\n            query = query.gte('created_at', new Date(effDateFrom).toISOString());\r\n        }"
);
c = c.replace(
    "if (dateFrom) {\n            query = query.gte('created_at', new Date(dateFrom).toISOString());\n        }",
    "if (effDateFrom) {\n            query = query.gte('created_at', new Date(effDateFrom).toISOString());\n        }"
);

c = c.replace(
    "if (dateFrom) newCountQuery = newCountQuery.gte('created_at', new Date(dateFrom) > new Date('2026-03-21T00:00:00Z') ? new Date(dateFrom).toISOString() : '2026-03-21T00:00:00Z');",
    "if (effDateFrom) newCountQuery = newCountQuery.gte('created_at', new Date(effDateFrom) > new Date('2026-03-21T00:00:00Z') ? new Date(effDateFrom).toISOString() : '2026-03-21T00:00:00Z');"
);

c = c.replace(
    "if (dateTo) {\r\n            // Include the whole day by setting time to 23:59:59\r\n            const toDate = new Date(dateTo);\r\n            toDate.setHours(23, 59, 59, 999);\r\n            query = query.lte('created_at', toDate.toISOString());\r\n        }",
    "if (effDateTo) {\r\n            // Include the whole day by setting time to 23:59:59\r\n            const toDate = new Date(effDateTo);\r\n            toDate.setHours(23, 59, 59, 999);\r\n            query = query.lte('created_at', toDate.toISOString());\r\n        }"
);
c = c.replace(
    "if (dateTo) {\n            // Include the whole day by setting time to 23:59:59\n            const toDate = new Date(dateTo);\n            toDate.setHours(23, 59, 59, 999);\n            query = query.lte('created_at', toDate.toISOString());\n        }",
    "if (effDateTo) {\n            // Include the whole day by setting time to 23:59:59\n            const toDate = new Date(effDateTo);\n            toDate.setHours(23, 59, 59, 999);\n            query = query.lte('created_at', toDate.toISOString());\n        }"
);

c = c.replace(
    "if (dateTo) {\r\n                const toD = new Date(dateTo);\r\n                toD.setHours(23, 59, 59, 999);\r\n                newCountQuery = newCountQuery.lte('created_at', toD.toISOString());\r\n            }",
    "if (effDateTo) {\r\n                const toD = new Date(effDateTo);\r\n                toD.setHours(23, 59, 59, 999);\r\n                newCountQuery = newCountQuery.lte('created_at', toD.toISOString());\r\n            }"
);
c = c.replace(
    "if (dateTo) {\n                const toD = new Date(dateTo);\n                toD.setHours(23, 59, 59, 999);\n                newCountQuery = newCountQuery.lte('created_at', toD.toISOString());\n            }",
    "if (effDateTo) {\n                const toD = new Date(effDateTo);\n                toD.setHours(23, 59, 59, 999);\n                newCountQuery = newCountQuery.lte('created_at', toD.toISOString());\n            }"
);

// Add the handler
const snpi = `    const handleShowNewItems = () => {
        setDateFrom('2026-03-21');
        setDateTo('');
        setCurrentPage(1);
        fetchItems(1, { dateFrom: '2026-03-21', dateTo: '' });
    };`;

c = c.replace(`    const handleFilter = () => {\r\n        setCurrentPage(1);\r\n        fetchItems(1);\r\n    };\r\n\r\n`, `    const handleFilter = () => {\r\n        setCurrentPage(1);\r\n        fetchItems(1);\r\n    };\r\n\r\n` + snpi + `\r\n\r\n`);
c = c.replace(`    const handleFilter = () => {\n        setCurrentPage(1);\n        fetchItems(1);\n    };\n\n`, `    const handleFilter = () => {\n        setCurrentPage(1);\n        fetchItems(1);\n    };\n\n` + snpi + `\n\n`);

// Update badge div
const rBadge = `<div 
                            onClick={handleShowNewItems}
                            className="bg-emerald-50 hover:bg-emerald-100 cursor-pointer px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-2 shadow-sm transition-colors animate-in fade-in">
                            <span className="text-emerald-800 font-bold text-sm tracking-wide">New Items Added</span>
                            <span className="bg-emerald-500 text-white font-black px-3 py-1 rounded-full text-sm shadow-inner min-w-[2.5rem] text-center">{newItemsCount.toLocaleString()}</span>
                        </div>`;

c = c.replace(/\<div className="bg-emerald-50 px-4 py\.2\.5(.*?)\n(.*?)New Items Added(.*?)\n(.*?)<\/div>/s, rBadge);

fs.writeFileSync('components/ItemMasterAssignment.tsx', c, 'utf8');
