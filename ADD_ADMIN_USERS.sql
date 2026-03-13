-- INSTRUCTIONS:
-- 1. Create the users in Supabase Auth (Authentication -> Users -> Invite User) if they don't exist.
-- 2. Run this script to assign their Roles and Titles.

-- Update Hisam J. Calbi
UPDATE public.profiles
SET 
  role = 'admin',
  full_name = 'Hisam J. Calbi',
  job_title = 'Purchasing Assistant',
  department = 'Purchasing'
WHERE email = 'hisam.calbi@hmg.local';

-- Update Maram Al Hamdan
UPDATE public.profiles
SET 
  role = 'admin',
  full_name = 'Maram Al Hamdan',
  job_title = 'MEP Planning Secretary',
  department = 'Planning'
WHERE email = 'maram.alhmdan@drsulaimanalhabib.com';

-- Optional: Verify the update
SELECT email, role, job_title, full_name FROM public.profiles WHERE role = 'admin';
