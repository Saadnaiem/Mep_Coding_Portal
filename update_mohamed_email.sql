-- Update email from mohamed.almogy@drsulaimanalhabib.com to mohamed.elmogy@drsulaimanalhabib.com
-- Preserving ID, Roles, and Assignments

DO $$
DECLARE
  old_email text := 'mohamed.almogy@drsulaimanalhabib.com';
  new_email text := 'mohamed.elmogy@drsulaimanalhabib.com';
  target_user_id uuid;
BEGIN
  -- Find the user by OLD email
  SELECT id INTO target_user_id FROM auth.users WHERE email = old_email;

  IF target_user_id IS NOT NULL THEN
      -- 1. Update auth.users
      UPDATE auth.users 
      SET email = new_email, 
          updated_at = now()
      WHERE id = target_user_id;

      -- 2. Update public.profiles
      -- Also correcting the name spelling to match the new email if desired, though user emphasized same roles.
      -- Assuming "Elmogy" is the preferred spelling now.
      UPDATE public.profiles 
      SET email = new_email,
          full_name = 'Mohamed Elmogy' 
      WHERE id = target_user_id;

      RAISE NOTICE 'Successfully updated email from % to % for User ID: %', old_email, new_email, target_user_id;
  ELSE
      RAISE NOTICE 'User with email % not found. Checking if % already exists...', old_email, new_email;
      
      SELECT id INTO target_user_id FROM auth.users WHERE email = new_email;
      
      IF target_user_id IS NOT NULL THEN
           RAISE NOTICE 'Target email % already exists. Updating profile name just in case.', new_email;
           UPDATE public.profiles SET full_name = 'Mohamed Elmogy' WHERE id = target_user_id;
      ELSE
           RAISE NOTICE 'No user found with either email.';
      END IF;
  END IF;
END $$;
