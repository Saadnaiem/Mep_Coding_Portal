-- Fix Assignments for mohamed.almogy@drsulaimanalhabib.com
-- Assigns him as Category Manager for WELLNESS division so he can see tasks.

DO $$
DECLARE
  target_user_id uuid;
  user_email text := 'mohamed.almogy@drsulaimanalhabib.com';
BEGIN
  -- 1. Get User ID from Auth
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;

  IF target_user_id IS NULL THEN
      RAISE NOTICE 'User % not found in auth.users. Please ensure they differ signed up / created.', user_email;
  ELSE
      -- 2. Ensure Profile Exists & is Category Manager
      INSERT INTO public.profiles (id, email, full_name, role, department, active)
      VALUES (target_user_id, user_email, 'Mohamed Almogy', 'category_manager', 'Category Management', true)
      ON CONFLICT (id) DO UPDATE SET
          role = 'category_manager',
          department = 'Category Management',
          active = true;

      -- 3. Clear existing assignments for this user to avoid duplicates if re-running
      DELETE FROM public.category_assignments WHERE category_manager_id = target_user_id;

      -- 4. Assign Major Divisions
      -- Assign ONLY WELLNESS as requested for Task Inbox filtering
      INSERT INTO public.category_assignments (division_name, category_manager_id) VALUES 
      ('WELLNESS', target_user_id);

      RAISE NOTICE 'Successfully updated assignments for %', user_email;
  END IF;
END $$;
