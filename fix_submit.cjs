const fs = require('fs');
let code = fs.readFileSync('components/ExistingProductModification.tsx', 'utf8');

const startStr = 'const handleFinalSubmit = async () => {';
const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf('loadHistory();', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const pre = code.substring(0, startIdx);
    // Find the closing brace precisely
    const functionEndIdx = code.indexOf('};', endIdx) + 2;
    const post = code.substring(functionEndIdx);
    
    const replacement = `const handleFinalSubmit = async () => {
        if (manifest.length === 0) {
            alert("No products in manifest to submit.");
            return;
        }

        setIsLoading(true);
        let successCount = 0;

        for (const item of manifest) {
            let success;
            if (item.id) {
                const { id, created_at, ...updates } = item;
                success = await db.updateExistingModification(id, updates);       
            } else {
                const { created_at, ...insertData } = item;
                success = await db.createExistingModification(insertData);        
            }
            if (success) successCount++;
        }

        setIsLoading(false);

        if (successCount === manifest.length) {
            // Trigger Email to E-Commerce Admin
            try {
                const employees = await db.fetchEmployeesByRole("e_commerce_admin");
                const adminEmails = employees.map(e => e.email).filter(Boolean);
                const admins = await db.fetchEmployeesByRole("super_admin");
                const superAdminEmails = admins.map(e => e.email).filter(Boolean);
                const allAdminEmails = Array.from(new Set([...adminEmails, ...superAdminEmails]));
                
                const uniqueBrands = Array.from(new Set(manifest.map(m => m.brand).filter(Boolean))).join(", ") || "N/A";
                
                for (const email of allAdminEmails) {
                    await sendEmailNotification({
                        trigger_type: "MODIFICATION_SUBMITTED",
                        recipient_email: email,
                        recipient_name: "Admin",
                        request_id: "MOD-" + Date.now().toString().slice(-6),
                        dynamic_data: {
                            total_products: manifest.length.toString(),
                            brands: uniqueBrands
                        }
                    });
                }
                
                alert(\`Successfully submitted \${successCount} products for modification review.\\n\\nEmail notification will be sent immediately to the E-Commerce Admin.\`);
            } catch (err) {
                console.error("Failed to send email notification", err);
                alert(\`Successfully submitted \${successCount} products for modification review.\`);
            }

            setManifest([]);
            setFormData({});
        } else {
            alert(\`Submitted \${successCount} out of \${manifest.length}. Some requests failed.\`);
        }
        loadHistory();
    };`;
    
    fs.writeFileSync('components/ExistingProductModification.tsx', pre + replacement + post, 'utf8');
    console.log('Update success!');
} else {
    console.log('Indices not found', startIdx, endIdx);
}
