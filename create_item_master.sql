-- Create the item_master table to store product hierarchy and details from ERP
CREATE TABLE IF NOT EXISTS public.item_master (
    erp_item_code TEXT PRIMARY KEY,
    item_description TEXT,
    division TEXT,
    department TEXT,
    category TEXT,
    sub_category TEXT,
    class_name TEXT,
    brand TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Comments
COMMENT ON TABLE public.item_master IS 'Master list of items with full hierarchy for E-Commerce assignments';
