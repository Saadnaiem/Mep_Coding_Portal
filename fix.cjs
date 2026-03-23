const fs = require('fs');
let code = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');
const start = code.indexOf('// Trigger Edge Function Email');
const end = code.indexOf('} catch (e: any)');
if (start > -1 && end > -1) {
  const replacement = '// Trigger Edge Function Email\n' +
    '            await sendEmailNotification({\n' +
    '                trigger_type: \'CONTENT_ASSIGNED\',\n' +
    '                recipient_email: vendorEmail,\n' +
    '                recipient_name: profiles.full_name || \'Vendor\',\n' +
    '                dynamic_data: {\n' +
    '                    assigned_count: payloads.length,\n' +
    '                    item_titles: selectedItemDetails.map(i => i.item_description).join(\', \')\n' +
    '                }\n' +
    '            });\n\n' +
    '            alert(Successfully assigned  items to .\\n\\nAn email notification has been sent to the vendor containing their new assignment details.);\n' +
    '            setIsAssignModalOpen(false);\n' +
    '            setSelectedItems([]);\n' +
    '            setVendorEmail(\'\');\n\n        ';
  code = code.substring(0, start) + replacement + code.substring(end);
  fs.writeFileSync('components/ItemMasterAssignment.tsx', code);
  console.log('Fixed');
}
