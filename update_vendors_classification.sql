
-- Add vendor_type to vendors table
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS vendor_type text CHECK (vendor_type IN ('new', 'existing')) DEFAULT 'new';

-- Update existing seed vendor to 'existing' for testing (optional, or 'new' to see the page)
-- Let's keep it 'new' (default) so we can see the output immediately.
