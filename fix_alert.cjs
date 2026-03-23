const fs = require('fs');
let code = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

const sIdx = code.indexOf('          // Trigger Edge Function Email');
const eIdx = code.indexOf('      } catch (e: any)');

if (sIdx > -1 && eIdx > -1) {
  const correct = \            // Trigger Edge Function Email
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

   const result = code.substring(0, sIdx) + correct + code.substring(eIdx);
   fs.writeFileSync('components/ItemMasterAssignment.tsx', result);
   console.log('Fixed correctly');
}

