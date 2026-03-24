const fs = require('fs');
let ap = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

ap = ap.replace(/const handleFilter \= \(\) \=\> \{\s+setCurrentPage\(1\);\s+fetchItems\(1\);\s+\};/, `const handleFilter = () => {\n        setCurrentPage(1);\n        fetchItems(1);\n    };\n\n    const handleShowNewItems = () => {\n        setDateFrom('2026-03-21');\n        setDateTo('');\n        setCurrentPage(1);\n        fetchItems(1, { dateFrom: '2026-03-21', dateTo: '' });\n    };`);

ap = ap.replace(/<div className=\"bg\-emerald\-50 px\-4 py\-2\.5 rounded\-xl border border\-emerald\-100 flex items\-center gap\-2 shadow\-sm animate\-in fade\-in\">(\s+)<span className=\"text\-emerald\-800 font\-bold text\-sm tracking\-wide\">New Items Added<\/span>(\s+)<span className=\"bg\-emerald\-500 text\-white font\-black px\-3 py\-1 rounded\-full text\-sm shadow\-inner min\-w-\[2\.5rem\] text\-center\">\{newItemsCount\.toLocaleString\(\)\}<\/span>(\s+)<\/div>/g, 
`<div 
                            onClick={handleShowNewItems}
                            className="bg-emerald-50 hover:bg-emerald-100 cursor-pointer px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-2 shadow-sm transition-colors animate-in fade-in">
                            <span className="text-emerald-800 font-bold text-sm tracking-wide">New Items Added</span>
                            <span className="bg-emerald-500 text-white font-black px-3 py-1 rounded-full text-sm shadow-inner min-w-[2.5rem] text-center">{newItemsCount.toLocaleString()}</span>
                        </div>`);

fs.writeFileSync('components/ItemMasterAssignment.tsx', ap, 'utf8');
console.log('ItemMasterAssignment updated step 3!', ap.includes('handleShowNewItems'));
