-- Fix permission issues for Category Managers and other staff
-- This script adds Row Level Security (RLS) policies to allow employees to view products.

-- 1. Ensure RLS is enabled on the products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if it exists to avoid errors (optional)
DROP POLICY IF EXISTS "Employees View All Products" ON public.products;
DROP POLICY IF EXISTS "Vendors View Own Products" ON public.products;

-- 3. Create Policy: Allow Valid Employees to view ALL products
-- This checks if the current user has a profile with a role that is NOT 'vendor'
CREATE POLICY "Employees View All Products"
ON public.products
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role != 'vendor'
  )
);

-- 4. Create Policy: Allow Vendors to view THEIR OWN products
-- This checks if the product belongs to a request owned by the current vendor
CREATE POLICY "Vendors View Own Products"
ON public.products
FOR SELECT
USING (
  request_id IN (
    SELECT id FROM public.product_requests 
    WHERE vendor_id = auth.uid() 
       OR created_by = auth.uid()
  )
);

-- 5. Repeat for Requests table if needed
CREATE POLICY "Employees View All Requests"
ON public.product_requests
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role != 'vendor'
  )
);
