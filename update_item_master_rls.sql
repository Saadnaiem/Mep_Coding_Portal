-- Enable RLS on the item_master table
ALTER TABLE public.item_master ENABLE ROW LEVEL SECURITY;

-- Drop previous open policies if they exist (to be safe)
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.item_master;
DROP POLICY IF EXISTS "Anyone can view item master" ON public.item_master;
DROP POLICY IF EXISTS "Staff can modify item master" ON public.item_master;
DROP POLICY IF EXISTS "Staff can update item master" ON public.item_master;
DROP POLICY IF EXISTS "Staff can insert item master" ON public.item_master;
DROP POLICY IF EXISTS "Staff can delete item master" ON public.item_master;

-- Allow EVERYONE (including vendors) to read from item_master so the search works
CREATE POLICY "Anyone can view item master"
ON public.item_master
FOR SELECT
TO authenticated
USING (true);

-- Allow STAFF (anyone who is not a vendor) to INSERT
CREATE POLICY "Staff can insert item master"
ON public.item_master
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role != 'vendor')
);

-- Allow STAFF (anyone who is not a vendor) to UPDATE
CREATE POLICY "Staff can update item master"
ON public.item_master
FOR UPDATE
TO authenticated
USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role != 'vendor')
);

-- Allow STAFF (anyone who is not a vendor) to DELETE
CREATE POLICY "Staff can delete item master"
ON public.item_master
FOR DELETE
TO authenticated
USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role != 'vendor')
);
