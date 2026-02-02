-- Add New Vendor Registration Fees to vendors table
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS new_vendor_registration_fees text;

-- Add Product Listing Fees to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS product_listing_fees text;
