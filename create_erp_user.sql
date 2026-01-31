-- Create ERP Specialist User (for Step 7)
-- Run this in Supabase SQL Editor

SELECT public.create_new_employee(
    'erp.specialist@drsulaimanalhabib.com',     -- Email
    'Welcome123!',                              -- Password
    'Mona ERP Specialist',                      -- Full Name
    'planning_erp_creation'                     -- Role (Must match MOCK_STEPS)
);

-- Note: 'planning_erp_creation' is the role required for "ERP Code Issuance" step.
