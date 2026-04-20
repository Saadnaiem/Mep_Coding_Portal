import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  trigger_type: 'VENDOR_SUBMITTED' | 'MODIFICATION_SUBMITTED' | 'STEP_APPROVED' | 'VENDOR_STEP_APPROVED' | 'REVISION_REQUIRED' | 'FINAL_APPROVAL' | 'REJECTED' | 'CONTENT_ASSIGNED' | 'CONTENT_UPDATED' | 'CONTENT_DECISION';
  recipient_email: string;
  recipient_name: string;
  request_id?: string;
  dynamic_data?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: EmailRequest = await req.json();
    const { trigger_type, recipient_email, recipient_name, request_id, dynamic_data } = payload;

    if (!recipient_email || !trigger_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let subject = "";
    let htmlContent = "";
    const portalUrl = Deno.env.get("PORTAL_URL") || "https://your-portal-url.com";

    // Template logic based on Trigger Type
    switch (trigger_type) {
      case 'VENDOR_SUBMITTED':
      case 'STEP_APPROVED':
        subject = `Action Required: New Product Request Submitted (${request_id})`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #0F3D3E; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0F3D3E; padding: 20px; text-align: center;">
              <h2 style="color: #C5A065; margin: 0; font-size: 24px;">Action Required</h2>
            </div>
            
            <div style="padding: 24px;">
              <p style="font-size: 16px; margin-top: 0;">Dear <strong>Dr. ${recipient_name}</strong>,</p>
              ${dynamic_data?.is_resubmission 
                ? `<p>The vendor has submitted corrections for the product listing request (<strong>${request_id}</strong>) and it is now ready for your review.</p>`
                : `<p>A product listing request (<strong>${request_id}</strong>) requires your attention and is waiting for your review.</p>`
              }
              
              <div style="background-color: #F9FAFB; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #C5A065;">
                <h3 style="color: #0F3D3E; margin-top: 0; font-size: 16px; text-transform: uppercase;">Request Overview</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 4px 0; color: #4B5563; width: 120px;">Request ID:</td><td style="font-weight: bold;">${request_id}</td></tr>
                  <tr><td style="padding: 4px 0; color: #4B5563;">Category:</td><td style="font-weight: bold;">${dynamic_data?.category || 'N/A'}</td></tr>
                  <tr><td style="padding: 4px 0; color: #4B5563;">Priority:</td><td style="font-weight: bold; color: #D97706;">${dynamic_data?.priority || 'Normal Protocol'}</td></tr>
                </table>
              </div>

              <div style="background-color: #F9FAFB; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0F3D3E;">
                <h3 style="color: #0F3D3E; margin-top: 0; font-size: 16px; text-transform: uppercase;">Vendor Details</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 4px 0; color: #4B5563; width: 120px;">Vendor Name:</td><td style="font-weight: bold;">${dynamic_data?.vendor_name || 'N/A'}</td></tr>
                  <tr><td style="padding: 4px 0; color: #4B5563;">Contact Person:</td><td>${dynamic_data?.contact_person || 'N/A'}</td></tr>
                  <tr><td style="padding: 4px 0; color: #4B5563;">Mobile:</td><td>${dynamic_data?.mobile || '-'}</td></tr>
                  <tr><td style="padding: 4px 0; color: #4B5563;">Email:</td><td><a href="mailto:${dynamic_data?.vendor_email || ''}" style="color: #2563EB;">${dynamic_data?.vendor_email || 'N/A'}</a></td></tr>
                </table>
              </div>

              <div style="background-color: #F9FAFB; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #C5A065;">
                <h3 style="color: #0F3D3E; margin-top: 0; font-size: 16px; text-transform: uppercase;">Product Summary</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 4px 0; color: #4B5563; width: 120px;">Total Products:</td><td style="font-weight: bold;">${dynamic_data?.total_products || '0'}</td></tr>
                  <tr><td style="padding: 4px 0; color: #4B5563;">Total Brands:</td><td style="font-weight: bold;">${dynamic_data?.total_brands || '0'}</td></tr>
                  <tr><td style="padding: 4px 0; color: #4B5563; vertical-align: top;">Brand Names:</td><td style="line-height: 1.4;">${dynamic_data?.brand_names || 'N/A'}</td></tr>
                </table>
              </div>
            </div>
            <div style="background-color: #F3F4F6; padding: 12px; text-align: center; font-size: 12px; color: #6B7280;">
              This is an automated message from the Alhabib Vendor Portal.
            </div>
          </div>
        `;
        break;

      case 'VENDOR_STEP_APPROVED':
        subject = `Update on Product Request ${request_id}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #0F3D3E; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #C5A065;">Request Progress Update</h2>
            <p>Dear ${recipient_name},</p>
            <p>We would like to inform you that your product listing request (<strong>${request_id}</strong>) has been approved by the <strong>${dynamic_data?.step_passed || 'Reviewer'}</strong>.</p>
            <p>It has now been forwarded to the next step for further review (<strong>${dynamic_data?.next_step || 'the next committee'}</strong>).</p>
            <p>You can check the live status of your request anytime in the portal.</p>
          </div>
        `;
        break;

      case 'REVISION_REQUIRED':
        subject = `Action Required: Revision Requested for ${request_id}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #0F3D3E; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #C5A065;">Revision Requested</h2>
            <p>Dear ${recipient_name},</p>
            <p>The ${dynamic_data?.approver_title || ''} has requested a revision on your recent product submission (<strong>${request_id}</strong>).</p>
            <p><strong>Note:</strong> ${dynamic_data?.comment || 'Please check the portal for details on what needs to be changed.'}</p>
            <p>Kindly login to the portal, apply the requested changes, and resubmit.</p>
          </div>
        `;
        break;

      case 'REJECTED':
        subject = `Update on Product Request ${request_id}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #0F3D3E; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #C5A065;">Request Update</h2>
            <p>Dear ${recipient_name},</p>
            <p>Unfortunately, some or all items in your product submission (<strong>${request_id}</strong>) have been rejected.</p>
            ${dynamic_data?.comment ? `<p><strong>Reason:</strong> ${dynamic_data.comment}</p>` : ''}
            <p>Please log in to the portal for more details.</p>
          </div>
        `;
        break;

      case 'FINAL_APPROVAL':
        subject = `Congratulations! Products Approved (${request_id})`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #0F3D3E; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #C5A065;">Products Successfully Approved!</h2>
            <p>Dear ${recipient_name},</p>
            <p>We are pleased to inform you that your product submission <strong>${request_id}</strong> has passed all approvals.</p>
            <p>The approved products are now proceeding to our ERP system for final processing.</p>
            <p>Thank you for partnering with us.</p>
          </div>
        `;
        break;

      case 'CONTENT_ASSIGNED':
        subject = `Content Update Required: New Modifications Assigned`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #0F3D3E; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #C5A065;">Content Modification Assigned</h2>
            <p>Dear ${recipient_name},</p>
              <p>Our E-commerce team has assigned existing products content modification tasks to your account.</p>
              <p>Please log in to the portal to provide the requested missing information.</p>
            </div>
          `;
          break;

        case 'CONTENT_UPDATED':
        subject = "Modifications Submitted for Review";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #0F3D3E; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #C5A065;">Content Update Submitted</h2>
            <p>Dear ${recipient_name},</p>
            <p>The vendor has completed the requested content modifications and submitted them for your review.</p>
            <p>Please launch the E-commerce admin view to accept or decline the changes.</p>
          </div>
        `;
        break;
        
      case 'CONTENT_DECISION':
        subject = `Decision Made on Content Updates`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #0F3D3E; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #C5A065;">Content Update Review Complete</h2>
            <p>Dear ${recipient_name},</p>
            <p>The E-commerce team has finished reviewing your submitted changes.</p>
            <p><strong>Status:</strong> ${dynamic_data?.decision === 'approved' ? 'Approved' : 'Rejected'}</p>
            ${dynamic_data?.comment ? `<p><strong>Feedback:</strong> ${dynamic_data.comment}</p>` : ''}
            <p>Please check the portal for further actions if any are rejected.</p>
          </div>
        `;
        break;

      case 'MODIFICATION_SUBMITTED':
        subject = `Vendor Modification Submitted: Pending Review`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #0F3D3E; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #C5A065;">Modifications Submitted</h2>
            <p>Dear ${recipient_name},</p>
            <p>A vendor has submitted <strong>${dynamic_data?.total_products || '0'}</strong> product modifications for your review.</p>
            <p><strong>Brands & Items:</strong> ${dynamic_data?.brandDetails || 'N/A'}</p>
            <p>Please log in to the portal to review the items and take the necessary action.</p>
          </div>
        `;
        break;

      default:
        subject = "Notification from Alhabib Portal";
        htmlContent = 
        `<div style="font-family: Arial, sans-serif; color: #0F3D3E; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #C5A065;">Content Update Review Complete</h2>
                  <p>Dear ${recipient_name},</p>
                  <p>We would like to inform you that the modification you submitted has been reviewed by the E-Commerce Admin.</p>
                  <p>Kindly login to the portal and check the status of your request.</p>
                  <p><strong>Thank you for your cooperation.</strong></p>`;
    }

    const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Acme <onboarding@resend.dev>"; // Replace with your domain if verified

    // Call Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [recipient_email],
        subject: subject,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API Error:", data);
      return new Response(JSON.stringify({ error: "Failed to send email", details: data, debugKey: RESEND_API_KEY ? "EXISTS" : "MISSING", debugEmail: FROM_EMAIL }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, message: `Email sent to ${recipient_email}`, resend_data: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

