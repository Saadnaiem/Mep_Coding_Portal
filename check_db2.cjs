const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://brgjfnbmlelpqjlubcnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZ2pmbmJtbGVscHFqbHViY25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODc5NTcsImV4cCI6MjA4NTI2Mzk1N30.GLCOVf5mnTem9wB3DJKbbXUUNNgGXt0waR6ZCLqhyJI'
);

async function fixIssues() {
  console.log("Logging in...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'ahmad.abdelaziz@drsulaimanalhabib.com',
    password: 'Welcome123!'
  });

  if (authErr) {
    console.error("Login failed:", authErr.message);
    return;
  }
  
  console.log("Logged in. Querying request HPL-2026-03-015...");
  const { data: request, error: reqErr } = await supabase
    .from('product_requests')
    .select('*')
    .eq('request_number', 'HPL-2026-03-015')
    .single();

  if (reqErr) { console.error('Req error:', reqErr); return; }
  console.log('Request Status:', request.status);

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .eq('request_id', request.id);

  if (prodErr) { console.error('Prod error:', prodErr); return; }
  
  const approvedProducts = products.filter(p => p.status === 'approved');
  console.log(`Found ${approvedProducts.length} approved products.`);

  const itemsToInsert = approvedProducts.map(p => ({
    erp_item_code: p.erp_item_code || ('TEMP-' + p.id),
    item_description: p.item_description || p.product_name,
    division: p.division,
    department: p.department,
    category: p.category,
    sub_category: p.sub_category,
    class_name: p.class_name,
    brand: p.brand,
    status: 'active'
  }));

  console.log("Preparing to insert items to item_master...", itemsToInsert);
  
  const { error: insErr } = await supabase
    .from('item_master')
    .upsert(itemsToInsert, { onConflict: 'erp_item_code' });

  if (insErr) {
    console.error("Insert failed:", insErr);
  } else {
    console.log("Successfully inserted/upserted items to item_master.");
  }
}

fixIssues();
