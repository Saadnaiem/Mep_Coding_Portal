const fs = require('fs');
let file = 'components/ExistingProductModification.tsx';
let text = fs.readFileSync(file, 'utf8');

// replace literal backtick-n that was accidentally added
text = text.replace(/
/g, '');
text = text.replace(/\\
/g, ''); // just in case

fs.writeFileSync(file, text);
