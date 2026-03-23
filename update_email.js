const fs = require('fs');
let code = fs.readFileSync('supabase/functions/send-email-notification/index.ts', 'utf8');

// Update type
code = code.replace(
  /'VENDOR_SUBMITTED' \| 'STEP_APPROVED'/,
  "'VENDOR_SUBMITTED' | 'MODIFICATION_SUBMITTED' | 'MODIFICATION_DECISION' | 'STEP_APPROVED'"
);

// Add cases
const modificationCases = \
      case 'MODIFICATION_SUBMITTED':
        subject = \\\Action Required: Modification Request Submitted\\\;
        htmlContent = \\\
          <div style="font-family: Arial, sans-serif; color: #0F3D3E; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #C5A065;">New Modification Request</h2>
            <p>Dear \\\,</p>
            <p>A new modification request has been submitted by <strong>\\\</strong> and awaits your review.</p>
            <h3>Summary:</h3>
            <ul>
              <li><strong>Total Products:</strong> \\\</li>
              <li><strong>Products Names:</strong> \\\</li>
            </ul>
            <ul>
              <li><strong>Total Brands:</strong> \\\</li>
              <li><strong>Brands Names:</strong> \\\</li>
            </ul>
            <p>Please log in to the portal to review the items and take the necessary action.</p>
            <a href="\\\" style="display: inline-block; background-color: #0F3D3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Open Portal</a>
          </div>
        \\\;
        break;

      case 'MODIFICATION_DECISION':
        subject = \\\Update on Your Modification Request\\\;
        htmlContent = \\\
          <div style="font-family: Arial, sans-serif; color: #0F3D3E; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #C5A065;">Status: \\\</h2>
            <p>Dear \\\,</p>
            <p>An admin has taken action on your modification request.</p>
            <h3>Summary of Reviewed Items:</h3>
            <ul>
              <li><strong>Total Products:</strong> \\\</li>
              <li><strong>Products Names:</strong> \\\</li>
            </ul>
            <ul>
              <li><strong>Total Brands:</strong> \\\</li>
              <li><strong>Brands Names:</strong> \\\</li>
            </ul>
            <p>Please log in to the portal for more details.</p>
            <a href="\\\" style="display: inline-block; background-color: #0F3D3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Open Portal</a>
          </div>
        \\\;
        break;
\;

if (!code.includes('MODIFICATION_SUBMITTED')) {
  code = code.replace(/case 'VENDOR_SUBMITTED':/, modificationCases + "\n      case 'VENDOR_SUBMITTED':");
  fs.writeFileSync('supabase/functions/send-email-notification/index.ts', code, 'utf8');
  console.log('Updated index.ts cases');
} else {
  console.log('Already updated');
}
