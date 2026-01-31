-- Add item_sub_group column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS item_sub_group TEXT;

-- Verify the column was added (optional, for manual check)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products';
