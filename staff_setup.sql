-- STEP 1: Create the User in Supabase Dashboard -> Authentication -> Users.
-- STEP 2: Copy the "User UID" for the new user.
-- STEP 3: Run the appropriate command below (replace 'USER_UID_HERE' with the actual ID).

-- Example: Set up a Category Manager
UPDATE public.profiles 
SET 
  role = 'category_manager', 
  full_name = 'Saad Category Manager',
  department = 'Pharma',
  job_title = 'Category Manager'
WHERE WHERE email = 'purchasing.manager@drsulaimanalhabib.com';
-- OR use email if unique: WHERE email = 'saad.catman@drsulaimanalhabib.com';

-- Example: Set up a Purchasing Manager
UPDATE public.profiles 
SET 
  role = 'purchasing_manager', 
  full_name = 'Tariq Purchasing', 
  department = 'Purchasing',
  job_title = 'Purchasing Manager'
WHERE email = 'purchasing.manager@drsulaimanalhabib.com';

-- Example: Set up Assistant Purchasing Director
UPDATE public.profiles 
SET 
  role = 'assistant_purchasing_director', 
  full_name = 'Layla Asst Dir',
  department = 'Purchasing',
  job_title = 'Assistant Purchasing Director'
WHERE email = 'asst.director@drsulaimanalhabib.com';

-- Example: Set up Planning Director
UPDATE public.profiles 
SET 
  role = 'planning_director', 
  full_name = 'Omar Planner',
  department = 'Planning',
  job_title = 'Planning Director'
WHERE email = 'planning.director@drsulaimanalhabib.com';

-- Example: Set up Commercial Executive Director
UPDATE public.profiles 
SET 
  role = 'commercial_executive_director', 
  full_name = 'Khalid Executive',
  department = 'Commercial',
  job_title = 'Commercial Executive Director'
WHERE email = 'commercial.exec@drsulaimanalhabib.com';

-- Example: Set up General Manager
UPDATE public.profiles 
SET 
  role = 'general_manager', 
  full_name = 'Saeed General',
  department = 'Management',
  job_title = 'General Manager'
WHERE email = 'general.director@drsulaimanalhabib.com';

-- Example: Set up ERP Team
UPDATE public.profiles 
SET 
  role = 'erp_team', 
  full_name = 'Mona ERP',
  department = 'IT',
  job_title = 'ERP Specialist'
WHERE email = 'erp.specialist@drsulaimanalhabib.com';

-- CHECK ALL PROFILES
SELECT * FROM public.profiles;
