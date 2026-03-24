const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');

const regex = /\/\/ FIX: Prevent flash of old data by clearing state before async load[\s\r\n]*setProducts\(\[\]\);[\s\r\n]*setEditableProducts\(\[\]\);[\s\r\n]*setActions\(\[\]\);/s;

const rEffect = `// FIX: Immediately filter existing products to show correct data synchronously while fetching updates
      setProducts(prev => prev.filter(p => p.request_id === selectedRequestId));
      setEditableProducts(prev => prev.filter(p => p.request_id === selectedRequestId));
      setActions(prev => prev.filter(a => a.request_id === selectedRequestId));`;

if (regex.test(c)) {
    c = c.replace(regex, rEffect);
    console.log("Successfully patched App.tsx");
} else {
    console.log("Could not find text.");
}

fs.writeFileSync('App.tsx', c, 'utf8');
