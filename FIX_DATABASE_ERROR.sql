
-- Run this script in your Supabase SQL Editor to fix the "Database error saving new user"

-- 1. Ensure the 'vendor_type' column exists in the vendors table
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS vendor_type text CHECK (vendor_type IN ('new', 'existing')) DEFAULT 'new';

-- 2. Ensure 'contact_person_id' exists (it should, but just in case)
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS contact_person_id uuid REFERENCES auth.users(id);

-- 3. Ensure 'company_name' exists in profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_name text;

-- 4. Re-apply the trigger to be sure it's correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_vendor boolean;
  user_role text;
  user_company text;
  v_type text;
BEGIN
  -- Extract metadata
  user_role := coalesce(new.raw_user_meta_data->>'role', 'vendor');
  user_company := new.raw_user_meta_data->>'company_name';
  v_type := coalesce(new.raw_user_meta_data->>'vendor_type', 'new');
  is_vendor := (user_role = 'vendor');

  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name, role, company_name)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    user_role,
    user_company
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = excluded.full_name,
    role = excluded.role,
    company_name = excluded.company_name;

  -- Create vendor record if it doesn't exist
  IF is_vendor AND user_company IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.vendors WHERE contact_person_id = new.id) THEN
        INSERT INTO public.vendors (company_name, contact_person_id, vendor_type)
        VALUES (user_company, new.id, v_type);
      END IF;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
