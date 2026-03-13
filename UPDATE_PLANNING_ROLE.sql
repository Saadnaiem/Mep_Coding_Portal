-- 1. Drop the constraint to allow updating roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Update the role in workflow_steps
UPDATE public.workflow_steps 
SET 
  role_required = 'planning_executive_director',
  step_name = 'Planning Executive Director Approval'
WHERE role_required = 'planning_director';

-- 3. Update the profile for the Planning Director
-- We strictly target the old placeholder or the specific role to migrate it
UPDATE public.profiles
SET 
  role = 'planning_executive_director',
  full_name = 'Ahmed Al Sharif',
  job_title = 'Planning Executive Director',
  email = 'ahmed.m.alsharif@drsulaimanalhabib.com'
WHERE role = 'planning_director' OR email = 'planning.director@drsulaimanalhabib.com';

-- 4. Re-add the constraint with the new role included
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
    'category_manager', 
    'purchasing_manager', 
    'assistant_purchasing_director', 
    'planning_executive_director', -- New Role
    'commercial_business_development_executive_director', 
    'exec_director', 
    'general_director', 
    'planning_erp_creation', 
    'super_admin', 
    'vendor',
    'e_commerce_admin',
    'admin'
));
