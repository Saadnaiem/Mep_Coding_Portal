-- SQL Migration to add missing product fields
-- Run this in Supabase SQL Editor

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS erp_item_code text,
ADD COLUMN IF NOT EXISTS item_group text,
ADD COLUMN IF NOT EXISTS buyer text,
ADD COLUMN IF NOT EXISTS category_manager text,
ADD COLUMN IF NOT EXISTS primary_warehouse text,
ADD COLUMN IF NOT EXISTS inner_pack_size text,
ADD COLUMN IF NOT EXISTS lead_time text,
ADD COLUMN IF NOT EXISTS currency text,
ADD COLUMN IF NOT EXISTS vendor_system_code text,
ADD COLUMN IF NOT EXISTS rtv_allowed boolean,
ADD COLUMN IF NOT EXISTS site_name text,
ADD COLUMN IF NOT EXISTS site_no text,
ADD COLUMN IF NOT EXISTS moh_discount_percentage numeric,
ADD COLUMN IF NOT EXISTS invoice_extra_discount numeric,
ADD COLUMN IF NOT EXISTS vendor_name text;

-- Add comments for clarity
COMMENT ON COLUMN public.products.erp_item_code IS 'Internal Item Code assigned by ERP Team';
COMMENT ON COLUMN public.products.item_group IS 'Item Group classification';
