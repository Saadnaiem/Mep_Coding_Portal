-- Generated from category assignment.csv
-- Assumes users already exist in auth.users. Does NOT create new users.
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Clear existing assignments to avoid conflicts
  DELETE FROM public.category_assignments;


  -- Update Profile for: Saad Naiem Ali (saad.abdulaah@drsulaimanalhabib.com)
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'saad.abdulaah@drsulaimanalhabib.com';
  
  IF target_user_id IS NOT NULL THEN
     INSERT INTO public.profiles (id, email, full_name, role, department, active)
     VALUES (target_user_id, 'saad.abdulaah@drsulaimanalhabib.com', 'Saad Naiem Ali', 'category_manager', 'Category Management', true)
     ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = 'category_manager';
  ELSE
     RAISE NOTICE 'User % not found in auth.users. Cannot create profile.', 'saad.abdulaah@drsulaimanalhabib.com';
  END IF;


  -- Assign MOM AND BABY to saad.abdulaah@drsulaimanalhabib.com
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'saad.abdulaah@drsulaimanalhabib.com';
  
  IF target_user_id IS NOT NULL THEN
      INSERT INTO public.category_assignments (division_name, category_manager_id)
      VALUES ('MOM AND BABY', target_user_id)
      ON CONFLICT (division_name, category_manager_id) DO NOTHING;
  END IF;


  -- Update Profile for: Ahmed Ibrahim Barakat (ahmed.barakat@drsulaimanalhabib.com)
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'ahmed.barakat@drsulaimanalhabib.com';
  
  IF target_user_id IS NOT NULL THEN
     INSERT INTO public.profiles (id, email, full_name, role, department, active)
     VALUES (target_user_id, 'ahmed.barakat@drsulaimanalhabib.com', 'Ahmed Ibrahim Barakat', 'category_manager', 'Category Management', true)
     ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = 'category_manager';
  ELSE
     RAISE NOTICE 'User % not found in auth.users. Cannot create profile.', 'ahmed.barakat@drsulaimanalhabib.com';
  END IF;


  -- Assign BEAUTY to ahmed.barakat@drsulaimanalhabib.com
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'ahmed.barakat@drsulaimanalhabib.com';
  
  IF target_user_id IS NOT NULL THEN
      INSERT INTO public.category_assignments (division_name, category_manager_id)
      VALUES ('BEAUTY', target_user_id)
      ON CONFLICT (division_name, category_manager_id) DO NOTHING;
  END IF;


  -- Assign PERSONAL CARE to saad.abdulaah@drsulaimanalhabib.com
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'saad.abdulaah@drsulaimanalhabib.com';
  
  IF target_user_id IS NOT NULL THEN
      INSERT INTO public.category_assignments (division_name, category_manager_id)
      VALUES ('PERSONAL CARE', target_user_id)
      ON CONFLICT (division_name, category_manager_id) DO NOTHING;
  END IF;


  -- Assign WELLNESS to saad.abdulaah@drsulaimanalhabib.com
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'saad.abdulaah@drsulaimanalhabib.com';
  
  IF target_user_id IS NOT NULL THEN
      INSERT INTO public.category_assignments (division_name, category_manager_id)
      VALUES ('WELLNESS', target_user_id)
      ON CONFLICT (division_name, category_manager_id) DO NOTHING;
  END IF;

END $$;