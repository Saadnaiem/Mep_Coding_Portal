ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update existing products to have 'pending' status if null
UPDATE public.products SET status = 'pending' WHERE status IS NULL;
