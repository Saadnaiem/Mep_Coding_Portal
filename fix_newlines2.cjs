const fs = require('fs'); let file = 'components/ExistingProductModification.tsx'; let text = fs.readFileSync(file, 'utf8'); text = text.split('`n').join(''); fs.writeFileSync(file, text);
