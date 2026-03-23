const fs = require('fs');
let code = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');
const start = code.indexOf('// Trigger Edge Function Email');
const end = code.indexOf('} catch (e: any)');
if (start > -1 && end > -1) {
  const replacement = \// Trigger Edge Function Email
            await sendEmailNotification({
                trigger_type: 'CONTENT_ASSIGNED',
                recipient_email: vendorEmail,
                recipient_name: profiles.full_name || 'Vendor',
                dynamic_data: {
                    assigned_count: payloads.length,
                    item_titles: selectedItemDetails.map(i => i.item_description).join(', ')
                }
            });

            alert(\\\Successfully assigned \ items to \.\\\\n\\\\nAn email notification has been sent to the vendor containing their new assignment details.\\\\);
            setIsAssignModalOpen(false);
            setSelectedItems([]);
            setVendorEmail('');

        \;
  code = code.substring(0, start) + replacement + code.substring(end);
  fs.writeFileSync('components/ItemMasterAssignment.tsx', code);
  console.log('Fixed');
}