const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let text = fs.readFileSync(file, 'utf8');

text = text.replace(/history\.filter\(item => item\.status !== 'pending_vendor'\)\.forEach\(item => {/, history.filter(item => item.status !== 'pending_vendor').forEach(item => {
             // Safe parse images
             let images = [];
             if (Array.isArray(item.image_urls)) {
                 images = item.image_urls;
             } else if (typeof item.image_urls === 'string') {
                 try { images = JSON.parse(item.image_urls); } catch(e){}
             });

text = text.replace(/const images = item\.image_urls \|\| \[\];/, '');
fs.writeFileSync(file, text);
console.log('done');
