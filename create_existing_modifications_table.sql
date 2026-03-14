-- Create table for Existing Product Modifications
CREATE TABLE IF NOT EXISTS public.existing_product_modifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    vendor_id UUID REFERENCES public.vendors(id),
    
    -- Core Identifiers
    sku_gtin TEXT NOT NULL, -- ERP / SKU
    product_name_en TEXT,
    product_name_ar TEXT,
    brand_en TEXT,
    brand_ar TEXT,
    
    -- E-commerce Content
    short_description_en TEXT,
    short_description_ar TEXT,
    storage_en TEXT,
    storage_ar TEXT,
    composition_en TEXT,
    composition_ar TEXT,
    indication_en TEXT,
    indication_ar TEXT,
    how_to_use_en TEXT,
    how_to_use_ar TEXT,
    side_effects_en TEXT,
    side_effects_ar TEXT,
    
    -- Classification A (Columns 17-19)
    category TEXT,
    "group" TEXT,
    subgroup TEXT,
    
    -- Filters
    tags_filters TEXT,
    suggested_filters TEXT,
    
    -- Classification B (POP Hierarchy)
    division TEXT,
    department TEXT,
    category_pop TEXT,
    sub_category_pop TEXT,
    class_name TEXT,
    
    -- Images
    image_urls JSONB DEFAULT '[]'::JSONB,
    
    -- Status
    status TEXT DEFAULT 'submitted'
);

-- Enable RLS
ALTER TABLE public.existing_product_modifications ENABLE ROW LEVEL SECURITY;

-- Policies

-- Vendor: View Own
DROP POLICY IF EXISTS "Vendors view own existing mods" ON public.existing_product_modifications;
CREATE POLICY "Vendors view own existing mods" ON public.existing_product_modifications
    FOR SELECT USING (
        vendor_id IN (
            SELECT id FROM public.vendors WHERE contact_person_id = auth.uid() OR id = auth.uid()
        )
    );

-- Vendor: Insert Own
DROP POLICY IF EXISTS "Vendors insert own existing mods" ON public.existing_product_modifications;
CREATE POLICY "Vendors insert own existing mods" ON public.existing_product_modifications
    FOR INSERT WITH CHECK (
        vendor_id IN (
            SELECT id FROM public.vendors WHERE contact_person_id = auth.uid() OR id = auth.uid()
        )
    );

-- Admin: View All
DROP POLICY IF EXISTS "Admins view all existing mods" ON public.existing_product_modifications;
CREATE POLICY "Admins view all existing mods" ON public.existing_product_modifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'e_commerce_admin')
        )
    );
