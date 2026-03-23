const fs = require('fs');
let code = fs.readFileSync('components/ExistingModificationsReport.tsx', 'utf8');

const replacement = "        if (vendorEmail) {\n" +
"            await sendEmailNotification({\n" +
"                 trigger_type: 'MODIFICATION_DECISION',\n" +
"                 recipient_email: vendorEmail,\n" +
"                 recipient_name: vendorName,\n" +
"                 dynamic_data: {\n" +
"                      status_label: status === 'approved' ? 'Approved' : 'Revision Required',\n" +
"                      total_products: '1',\n" +
"                      product_names: selectedItem.name_en,\n" +
"                      total_brands: '1',\n" +
"                      brands: selectedItem.brand_en || 'N/A',\n" +
"                      sku_gtin: selectedItem.sku_gtin,\n" +
"                      rejection_reason: nextReason || ''\n" +
"                 }\n" +
"            });\n" +
"        }";

const regex = /if\s*\(vendorEmail\)\s*\{[\s\S]*?dynamic_data:[\s\S]*?\}\s*\);\s*\}/;
code = code.replace(regex, replacement);
fs.writeFileSync('components/ExistingModificationsReport.tsx', code, 'utf8');
