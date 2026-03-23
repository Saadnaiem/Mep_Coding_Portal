const fs = require('fs');
const file = 'App.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetIndex = content.indexOf('const employees = await db.fetchEmployeesByRole(\\n            currentStepDef.role_required,\\n          );');

const oldBlock = \        if (currentStepDef) {
          const employees = await db.fetchEmployeesByRole(
            currentStepDef.role_required,
          );
          for (const emp of employees) {
            if (emp.email) {
              try {
                await sendEmailNotification({
                  trigger_type: "VENDOR_SUBMITTED",
                  recipient_email: emp.email,
                  recipient_name: emp.full_name || emp.role,
                  request_id: currentRequest!.request_number,
                  dynamic_data: { is_resubmission: true },
                });
              } catch (emailErr) {
                console.error("Failed to send email", emailErr);
              }
            }
          }
        }\;

const newBlock = \        if (currentStepDef) {
          try {
            let targetEmployees: any[] = [];
            const actionLogs = await db.fetchActions(currentRequest!.id);
            const returnedLogs = actionLogs
              .filter((l) => l.action === "return")
              .sort(
                (a, b) =>
                  new Date(b.action_at).getTime() -
                  new Date(a.action_at).getTime()
              );

            if (returnedLogs.length > 0 && returnedLogs[0].actor_id) {
              const targetProfile = await db.fetchProfile(
                returnedLogs[0].actor_id
              );
              if (targetProfile) {
                targetEmployees = [targetProfile];
              }
            }

            if (targetEmployees.length === 0) {
              targetEmployees = await db.fetchEmployeesByRole(
                currentStepDef.role_required
              );
            }

            const total_products = editableProducts.length;
            const uniqueBrands = Array.from(
              new Set(editableProducts.map((p) => p.brand).filter(Boolean))
            );
            const brands = uniqueBrands.join(", ");
            const categoryName =
              currentRequest?.category ||
              (editableProducts[0] && editableProducts[0].category) ||
              "N/A";

            for (const emp of targetEmployees) {
              if (emp.email) {
                try {
                  await sendEmailNotification({
                    trigger_type: "VENDOR_SUBMITTED",
                    recipient_email: emp.email,
                    recipient_name: emp.full_name || emp.role,
                    request_id: currentRequest!.request_number,
                    dynamic_data: {
                      is_resubmission: true,
                      category: categoryName,
                      priority:
                        currentRequest?.priority === "urgent"
                          ? "Urgent"
                          : "Normal Protocol",
                      vendor_name: currentVendor?.company_name || "N/A",
                      contact_person: currentVendor?.contact_person || "N/A",
                      mobile: currentVendor?.mobile_number || "-",
                      vendor_email: currentVendor?.email_address || "",
                      total_products: total_products.toString(),
                      total_brands: uniqueBrands.length.toString(),
                      brand_names: brands,
                    },
                  });
                } catch (emailErr) {
                  console.error("Failed to send email", emailErr);
                }
              }
            }
          } catch (err) {
            console.error("Error sending resubmit emails", err);
          }
        }\;
        
        let replaced = content.replace(oldBlock, newBlock);
        fs.writeFileSync(file, replaced);
