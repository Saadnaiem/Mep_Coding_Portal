const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let text = fs.readFileSync(file, 'utf8');

text = text.replace(/let images = \[\];/, 'let customImages = [];');
text = text.replace(/images = item\.image_urls;/g, 'customImages = item.image_urls;');
text = text.replace(/try \{ images = JSON\.parse\(item\.image_urls\); \} catch\(e\)\{\}/, 'try { customImages = JSON.parse(item.image_urls); } catch(e){}');
text = text.replace(/images\.forEach\(\(img: string, idx: number\) => \{/, 'customImages.forEach((img: string, idx: number) => {');

fs.writeFileSync(file, text);
