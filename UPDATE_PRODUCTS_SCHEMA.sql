
-- UPDATE PRODUCTS TABLE SCHEMA TO MATCH FRONTEND FIELDS

-- 1. Logistics
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS storage_condition text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pack_size text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS case_count numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS inner_pack_size text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_order_qty numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lead_time text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS primary_warehouse text;

-- 2. Indicators (Boolean)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lot_indicator boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rtv_allowed boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS taxable boolean DEFAULT true;

-- 3. Commercial / MEP
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS purchasing_status text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS moh_discount_percentage numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS invoice_extra_discount numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency text DEFAULT 'SAR';

-- 4. Codes & Refs
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS item_code text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vendor_system_code text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS item_group text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vendor_no text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS buyer text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_manager text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS site_name text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS site_no text;

-- 5. Descriptions
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS item_description text; -- English desc if different from name

-- Check constraints / defaults if needed
-- (None critical for now, getting the columns in is priority)
