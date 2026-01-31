-- Assign EXISTING Category Managers to Divisions based on Name
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  ahmed_id uuid;
  saad_id uuid;
  mohamed_id uuid;
BEGIN
  -- 1. Look up IDs by name (using ILIKE for case insensitive partial matching)
  -- We select the ID from profiles table
  SELECT id INTO ahmed_id FROM public.profiles WHERE full_name ILIKE '%Ahmed Barakat%' LIMIT 1;
  SELECT id INTO saad_id FROM public.profiles WHERE full_name ILIKE '%Saad Naiem%' LIMIT 1;
  SELECT id INTO mohamed_id FROM public.profiles WHERE full_name ILIKE '%Mohamed El Mogy%' LIMIT 1;

  -- 2. Clear existing assignments for these divisions to avoid duplicates
  DELETE FROM public.category_assignments 
  WHERE division_name IN ('BEAUTY', 'MOM AND BABY', 'PERSONAL CARE', 'WELLNESS');

  -- 3. Insert Assignments if users were found

  -- Ahmed Barakat -> Beauty
  IF ahmed_id IS NOT NULL THEN
    INSERT INTO public.category_assignments (division_name, category_manager_id) VALUES ('BEAUTY', ahmed_id);
    RAISE NOTICE 'Assigned Ahmed Barakat to BEAUTY';
  ELSE
    RAISE NOTICE 'User Ahmed Barakat not found in profiles';
  END IF;

  -- Saad Naiem -> Mom and Baby, Personal Care
  IF saad_id IS NOT NULL THEN
    INSERT INTO public.category_assignments (division_name, category_manager_id) VALUES ('MOM AND BABY', saad_id);
    INSERT INTO public.category_assignments (division_name, category_manager_id) VALUES ('PERSONAL CARE', saad_id);
     RAISE NOTICE 'Assigned Saad Naiem to MOM AND BABY and PERSONAL CARE';
  ELSE
    RAISE NOTICE 'User Saad Naiem not found in profiles';
  END IF;

  -- Mohamed El Mogy -> Wellness
  IF mohamed_id IS NOT NULL THEN
    INSERT INTO public.category_assignments (division_name, category_manager_id) VALUES ('WELLNESS', mohamed_id);
    RAISE NOTICE 'Assigned Mohamed El Mogy to WELLNESS';
  ELSE
    RAISE NOTICE 'User Mohamed El Mogy not found in profiles';
  END IF;

END $$;
