const fs = require('fs');

let db = fs.readFileSync('services/database.ts', 'utf8');

// Replace the misaligned bracket
db = db.replace("      return data || [];\r\n  }\r\n}\r\n\r\n\r\n\r\n  // --- Item Master Sync ---", "      return data || [];\r\n  }\r\n\r\n  // --- Item Master Sync ---");

// Check Unix style line endings as well just in case
db = db.replace("      return data || [];\n  }\n}\n\n\n\n  // --- Item Master Sync ---", "      return data || [];\n  }\n\n  // --- Item Master Sync ---");

db = db.replace("    return true;\r\n  }\r\n\r\nexport const db", "    return true;\r\n  }\r\n}\r\n\r\nexport const db");

db = db.replace("    return true;\n  }\n\nexport const db", "    return true;\n  }\n}\n\nexport const db");

fs.writeFileSync('services/database.ts', db, 'utf8');
console.log('Database.ts Updated!');
