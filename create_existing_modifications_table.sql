-- Drop table if exists to ensure clean slate
DROP TABLE IF EXISTS public.existing_product_modifications CASCADE;

CREATE TABLE public.existing_product_modifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    vendor_id UUID REFERENCES public.vendors(id),
    
    -- Request Type & Status
    type TEXT DEFAULT 'vendor_initiated' CHECK (type IN ('vendor_initiated', 'admin_assigned')),
    status TEXT DEFAULT 'pending_vendor', -- pending_vendor, submitted, approved, rejected, etc.

    -- Hierarchy Snapshot (Populated from Item Master)
    division TEXT,
    department TEXT,
    category TEXT,
    sub_category TEXT,
    class_name TEXT,
    brand TEXT,

    -- Columns from E-Commerce Template
    sku_gtin TEXT NOT NULL,
    name_en TEXT, -- 'NAME/ DESCRIPTION_US'
    name_ar TEXT, -- 'NAME/ DESCRIPTION_AR'
    brand_en TEXT, -- 'BRAND Name_US'
    brand_ar TEXT, -- 'BRAND Name_AR'
    short_description_en TEXT, -- 'SHORT DESCRIPTION_US'
    short_description_ar TEXT, -- 'SHORT DESCRIPTION_AR'
    storage_en TEXT, -- 'STORAGE_US'
    storage_ar TEXT, -- 'STORAGE_AR'
    composition_en TEXT, -- 'COMPOSITION_US'
    composition_ar TEXT, -- 'COMPOSITION_AR'
    indication_en TEXT, -- 'INDICATION_US'
    indication_ar TEXT, -- 'INDICATION_AR'
    how_to_use_en TEXT, -- 'HOW_TO_USE_US'
    how_to_use_ar TEXT, -- 'HOW_TO_USE_AR'
    possible_side_effects_en TEXT, -- 'POSSIBLE_SIDE_EFFECTS/WARNINGS_US'
    possible_side_effects_ar TEXT, -- 'POSSIBLE_SIDE_EFFECTS/WARNINGS_AR'
    
    -- Classification from Template (to avoid collision with Hierarchy Snapshot)
    template_category TEXT, -- 'Category'
    template_group TEXT, -- 'Group'
    template_subgroup TEXT, -- 'Subgroup'
    
    -- Filters
    tags_filters TEXT, -- 'Tags/Filters...'
    suggested_filters TEXT, -- 'Suggested Filters in BEAUTY'

    -- Additional fields
    image_urls JSONB DEFAULT '[]'::JSONB,
    rejection_reason TEXT
);

-- Enable RLS
ALTER TABLE public.existing_product_modifications ENABLE ROW LEVEL SECURITY;

-- Policies

-- Vendor: View Own
CREATE POLICY "Vendors view own existing mods" ON public.existing_product_modifications
    FOR SELECT USING (
        vendor_id IN (
            SELECT id FROM public.vendors WHERE contact_person_id = auth.uid() OR id = auth.uid()
        )
    );

-- Vendor: Insert Own
CREATE POLICY "Vendors insert own existing mods" ON public.existing_product_modifications
    FOR INSERT WITH CHECK (
        vendor_id IN (
            SELECT id FROM public.vendors WHERE contact_person_id = auth.uid() OR id = auth.uid()
        )
    );

-- Vendor: Update Own
CREATE POLICY "Vendors update own existing mods" ON public.existing_product_modifications
    FOR UPDATE USING (
        vendor_id IN (
            SELECT id FROM public.vendors WHERE contact_person_id = auth.uid() OR id = auth.uid()
        )
    );

-- Admin: View All
CREATE POLICY "Admins view all existing mods" ON public.existing_product_modifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'e_commerce_admin')
        )
    );

-- Admin: Insert All
CREATE POLICY "Admins insert all existing mods" ON public.existing_product_modifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'e_commerce_admin')
        )
    );

-- Admin: Update All
CREATE POLICY "Admins update all existing mods" ON public.existing_product_modifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'e_commerce_admin')
        )
    );
