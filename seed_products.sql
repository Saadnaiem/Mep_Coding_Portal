-- SEED DATA FOR PRODUCTS
-- Use this script to verify that Products appear in the dashboard.

-- 1. Create a Dummy Vendor (if not exists)
INSERT INTO public.vendors (id, company_name, cr_number, vat_number, status)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'Test Vendor Co', '1010101010', '300000000000003', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. Create a Dummy Request (submitted by the vendor)
-- Matches a category 'MOM AND BABY' so Saad (Category Manager) can see it.
INSERT INTO public.product_requests (
  id, 
  request_number, 
  request_type, 
  vendor_id, 
  current_step, 
  status, 
  priority, 
  category, 
  notes, 
  last_action_at, 
  created_at
)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'REQ-2026-001', 'new_products', 'a0000000-0000-0000-0000-000000000001', 1, 'in_review', 'normal', 'MOM AND BABY', 'Initial test request', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Dummy Products linked to the Request
INSERT INTO public.products (
  request_id,
  brand,
  product_name,
  product_name_ar,
  division,
  department,
  category,
  sub_category,
  class_name,
  uom,
  price_cost,
  price_retail,
  barcode,
  manufacturer,
  country_of_origin
)
VALUES 
  (
    'b0000000-0000-0000-0000-000000000001', 
    'Pampers', 
    'Pampers Premium Protection Size 1', 
    'بامبرز حماية متميزة مقاس 1',
    'MOM AND BABY', 
    'BABY CARE', 
    'DIAPERS', 
    'DISPOSABLE DIAPERS', 
    'NEWBORN',
    'Pack', 
    45.00, 
    55.00,
    '1234567890123',
    'Procter & Gamble',
    'Saudi Arabia'
  ),
  (
    'b0000000-0000-0000-0000-000000000001', 
    'Johnson''s', 
    'Johnson''s Baby Shampoo 500ml', 
    'شامبو جونسون للأطفال 500 مل',
    'MOM AND BABY', 
    'BABY CARE', 
    'BATHTIME', 
    'SHAMPOO', 
    'REGULAR',
    'Bottle', 
    18.00, 
    24.00,
    '9876543210987',
    'Johnson & Johnson',
    'UAE'
  );
