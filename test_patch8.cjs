const fs = require('fs');
let c = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

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

c = c.replace(tBadge, rBadge);

// Unix newlines fallback
const tBadge2 = `<div className="bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-sm animate-in fade-in">\n                            <span className="text-emerald-800 font-bold text-sm tracking-wide">New Items Added</span>\n                            <span className="bg-emerald-500 text-white font-black px-3 py-1 rounded-full text-sm shadow-inner min-w-[2.5rem] text-center">{newItemsCount.toLocaleString()}</span>\n                        </div>`;
c = c.replace(tBadge2, rBadge);

const tBadge3 = `<div className="bg-emerald-50 px-4 py-2.5\r\nrounded-xl border border-emerald-100 flex items-center gap-2 shadow-sm\r\nanimate-in fade-in">\r\n                               <span className="text-emerald-800 font-bold\r\ntext-sm tracking-wide">New Items Added</span>\r\n                               <span className="bg-emerald-500 text-white\r\nfont-black px-3 py-1 rounded-full text-sm shadow-inner min-w-[2.5rem]\r\ntext-center">{newItemsCount.toLocaleString()}</span>\r\n                           </div>`;
c = c.replace(tBadge3, rBadge);

fs.writeFileSync('components/ItemMasterAssignment.tsx', c, 'utf8');
