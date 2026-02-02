-- Remove the old check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new check constraint including 'e_commerce_admin'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
    'category_manager', 
    'purchasing_manager', 
    'assistant_purchasing_director', 
    'planning_director', 
    'commercial_business_development_executive_director', 
    'exec_director', 
    'general_director', 
    'planning_erp_creation', 
    'super_admin', 
    'vendor',
    'e_commerce_admin'
));
