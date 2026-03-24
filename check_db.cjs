const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://brgjfnbmlelpqjlubcnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZ2pmbmJtbGVscHFqbHViY25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODc5NTcsImV4cCI6MjA4NTI2Mzk1N30.GLCOVf5mnTem9wB3DJKbbXUUNNgGXt0waR6ZCLqhyJI'
);

async function check() {
  const { data: request, error: reqErr } = await supabase
    .from('product_requests')
    .select('*')
    .eq('request_number', 'HPL-2026-03-015')
    .single();

  if (reqErr) { console.error('Req error:', reqErr); return; }
  console.log('Request:', request);

  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .eq('request_id', request.id);

  if (prodErr) { console.error('Prod error:', prodErr); return; }
  console.log('Products:', products.map(p => ({
    id: p.id,
    product_name: p.product_name,
    status: p.status,
    erp_item_code: p.erp_item_code
  })));

  for (let p of products) {
    if (p.status !== 'approved') continue;
    const { data: im, error: imErr } = await supabase
        .from('item_master')
        .select('*')
        .eq('erp_item_code', p.erp_item_code || `TEMP-${p.id}`);
    
    if (imErr) { console.error('IM error for product:', p.product_name, imErr); continue; }
    console.log(`Item Master for ${p.product_name}:`, im.map(i => ({ erp_item_code: i.erp_item_code, item_description: i.item_description })));
  }
}

check();
