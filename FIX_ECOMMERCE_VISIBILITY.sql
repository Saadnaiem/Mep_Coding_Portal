-- FIX E-COMMERCE VISIBILITY AND WORKFLOW STEPS

-- 1. Drop the constraint to allow updating roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Validate and Update Step 7 role to match Typescript ('planning_erp_creation')
--    The initial setup might have used 'erp_team'. 
UPDATE public.workflow_steps
SET role_required = 'planning_erp_creation'
WHERE step_number = 7;

-- 3. Add Step 8 (E-Commerce Approval)
--    This is CRITICAL. If this step is missing, requests cannot move to step 8, 
--    and E-Commerce Admin will never see them.
INSERT INTO public.workflow_steps (step_number, step_name, role_required, sla_hours)
VALUES (8, 'E_Commerce Approval', 'e_commerce_admin', 24)
ON CONFLICT (step_number) DO UPDATE
SET role_required = 'e_commerce_admin', step_name = 'E_Commerce Approval';

-- 4. Update any existing users with role 'erp_team' to 'planning_erp_creation'
UPDATE public.profiles
SET role = 'planning_erp_creation'
WHERE role = 'erp_team';

-- 5. Re-add the constraint with ALL correct roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
    'category_manager', 
    'purchasing_manager', 
    'assistant_purchasing_director', 
    'planning_executive_director', 
    'commercial_business_development_executive_director', 
    'exec_director', 
    'general_director', 
    'planning_erp_creation', 
    'super_admin', 
    'vendor',
    'e_commerce_admin',
    'admin'
));

-- 6. Optional: Fix any requests stuck at step 7 that should be at step 8
--    If any requests were 'approved_pending_ecommerce' but failed to update current_step due to FK error,
--    they might still be at step 7. However, the app logic updates status AND step together.
--    If update failed, status probably didn't change either.
--    We can't automatically know which ones are "stuck" unless we check history.
--    But users can now retry the approval action.
