const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://brgjfnbmlelpqjlubcnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZ2pmbmJtbGVscHFqbHViY25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODc5NTcsImV4cCI6MjA4NTI2Mzk1N30.GLCOVf5mnTem9wB3DJKbbXUUNNgGXt0waR6ZCLqhyJI'
);

// MOCK_STEPS corresponding roughly to what's in the app:
const MOCK_STEPS = [
  { step_number: 1, role_required: 'admin' },
  { step_number: 2, role_required: 'category_manager' },
  { step_number: 3, role_required: 'ecommerce' }
];

const ROLE_LABELS = {
  admin: 'Admin',
  category_manager: 'Category Manager',
  ecommerce: 'E-Commerce'
};

async function check() {
  const { data: request, error: reqErr } = await supabase
    .from('product_requests')
    .select('*, vendor:vendors(*)')
    .eq('request_number', 'HPL-2026-03-020')
    .single();

  if (reqErr) { 
    console.error('Req error:', reqErr); 
    return; 
  }
  
  console.log('--- REQUEST INFORMATION ---');
  console.log(`Request Number: ${request.request_number}`);
  console.log(`Request Status: ${request.status}`);
  console.log(`Current Step: ${request.current_step}`);

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .eq('request_id', request.id);

  if (prodErr) { 
    console.error('Prod error:', prodErr); 
    return; 
  }

  console.log('\n--- PRODUCTS INFORMATION ---');
  products.forEach(p => {
    console.log(`\nProduct Code/Name: ${p.product_name} (${p.erp_item_code || 'No ERP Code'})`);
    console.log(`Product DB Status: ${p.status}`);
    
    // Simulate getWaitingStatus logic
    let displayedStatus = 'Unknown';
    if (p.status === 'rejected' || request.status === 'rejected') {
        displayedStatus = 'Rejected (Red)';
    } else if (request.status === 'completed') {
        displayedStatus = 'Completed & Sync to Item Master (Green)';
    } else if (request.status === 'approved_pending_erp') {
        displayedStatus = 'Waiting for ERP Code (Purple)';
    } else if (request.status === 'approved_pending_ecommerce' || request.status === 'partially_approved') {
        displayedStatus = 'Approved / Pending Master Sync (Teal)';
    } else if (request.status === 'in_review' && request.current_step) {
        // Mock fallback role for unknown step
        displayedStatus = `Waiting: UserRole (Amber)`;
    } else {
        displayedStatus = request.status;
    }
    
    console.log(`Frontend Display Status: ${displayedStatus}`);
  });
}

check();