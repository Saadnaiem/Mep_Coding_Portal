const fs = require('fs');
let text = fs.readFileSync('components/ExistingProductModification.tsx', 'utf8');

const oldHeader = <thead className="text-white">\n                                          <tr>\n                                              <th className="p-3 border-b border-[#107c41] bg-white">SKU / GTIN</th>\n                                              <th className="p-3 border-b border-[#107c41] bg-white">English Name</th>\n                                              <th className="p-3 border-b border-[#107c41] bg-white">Brand</th>\n                                              <th className="p-3 border-b border-[#107c41] bg-white text-right">Action</th>;

const newHeader = <thead className="text-[#107c41] font-bold">\n                                          <tr>\n                                              <th className="p-3 border-b border-[#107c41] bg-white">SKU / GTIN</th>\n                                              <th className="p-3 border-b border-[#107c41] bg-white">English Name</th>\n                                              <th className="p-3 border-b border-[#107c41] bg-white">Brand</th>\n                                              <th className="p-3 border-b border-[#107c41] bg-white text-right">Action</th>;

text = text.replace(oldHeader, newHeader);
fs.writeFileSync('components/ExistingProductModification.tsx', text);
console.log("Replaced!");
