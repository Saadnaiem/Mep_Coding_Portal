const fs = require('fs');
let ap = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

const tHandlers = `    const handleFilter = () => {
        setCurrentPage(1);
        fetchItems(1);
    };`;

const rHandlers = `    const handleFilter = () => {
        setCurrentPage(1);
        fetchItems(1);
    };

    const handleShowNewItems = () => {
        setDateFrom('2026-03-21');
        setDateTo('');
        setCurrentPage(1);
        fetchItems(1, { dateFrom: '2026-03-21', dateTo: '' });
    };`;
ap = ap.replace(tHandlers, rHandlers);

const tBadge = `<div className="bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-sm animate-in fade-in">
                            <span className="text-emerald-800 font-bold text-sm tracking-wide">New Items Added</span>
                            <span className="bg-emerald-500 text-white font-black px-3 py-1 rounded-full text-sm shadow-inner min-w-[2.5rem] text-center">{newItemsCount.toLocaleString()}</span>
                        </div>`;

const rBadge = `<div 
                            onClick={handleShowNewItems}
                            className="bg-emerald-50 hover:bg-emerald-100 cursor-pointer px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-2 shadow-sm transition-colors animate-in fade-in">
                            <span className="text-emerald-800 font-bold text-sm tracking-wide">New Items Added</span>
                            <span className="bg-emerald-500 text-white font-black px-3 py-1 rounded-full text-sm shadow-inner min-w-[2.5rem] text-center">{newItemsCount.toLocaleString()}</span>
                        </div>`;

ap = ap.replace(/\<div className="bg-emerald-50 px-4 py\.2\.5(.*?)\n(.*?)New Items Added(.*?)\n(.*?)<\/div>/s, rBadge);

fs.writeFileSync('components/ItemMasterAssignment.tsx', ap, 'utf8');
console.log('ItemMasterAssignment updated step 2!', ap.includes('handleShowNewItems'));
