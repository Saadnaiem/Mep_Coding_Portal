-- Fix for "new row violates row-level security policy" error during Admin Assignment

-- Add INSERT policy for Admins (admin, super_admin, e_commerce_admin)
CREATE POLICY "Admins insert all existing mods" ON public.existing_product_modifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'e_commerce_admin')
        )
    );
