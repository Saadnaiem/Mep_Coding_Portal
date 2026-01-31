
-- FIX RLS POLICIES FOR PRODUCTS VISIBILITY

-- 1. Enable RLS on products if not already
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (optional, but safer for a fix script)
DROP POLICY IF EXISTS "products_policy_all" ON public.products;
DROP POLICY IF EXISTS "Vendors can view their own products" ON public.products;
DROP POLICY IF EXISTS "Employees can view all products" ON public.products;

-- 3. Create a comprehensive policy
-- This allows:
-- - Vendors to View/Insert/Update/Delete products if they own the linked Request.
-- - Employees (non-vendors) to View/Update products.

CREATE POLICY "products_access_policy" ON public.products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.product_requests pr
    WHERE pr.id = products.request_id
    AND (
      -- 1. User is the Vendor (owner of the request)
      pr.vendor_id = auth.uid() 
      OR 
      -- 2. User is the Creator (just in case)
      pr.created_by = auth.uid()
      OR
      -- 3. User is an Employee (Role is NOT vendor)
      auth.uid() IN (SELECT id FROM public.profiles WHERE role != 'vendor')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.product_requests pr
    WHERE pr.id = products.request_id
    AND (
      -- 1. User is the Vendor
      pr.vendor_id = auth.uid() 
      OR 
      pr.created_by = auth.uid()
      OR
      -- 2. User is an Employee
      auth.uid() IN (SELECT id FROM public.profiles WHERE role != 'vendor')
    )
  )
);

-- 4. Also Ensure Requests are visible!
-- If the user can't see the Request, the logic above (referencing product_requests) might fail 
-- if RLS on product_requests prevents "SELECT 1". 
-- (Actually, RLS inside a policy definition usually runs with elevated privileges or against the table directly, 
-- but it's good practice to ensure Request RLS is open too).

ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_policy_all" ON public.product_requests;

CREATE POLICY "requests_access_policy" ON public.product_requests
FOR ALL
USING (
    -- Vendor owns the request
    vendor_id = auth.uid() 
    OR 
    created_by = auth.uid()
    OR
    -- Or User is an Employee
    auth.uid() IN (SELECT id FROM public.profiles WHERE role != 'vendor')
);

