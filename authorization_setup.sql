-- 1. Workflow Steps Table
-- Defines the sequence and the role required for each step (The "7 Approval Persons")
create table public.workflow_steps (
  step_number int primary key,
  step_name text not null,
  role_required text not null, -- Must match roles in profiles table
  sla_hours int default 24,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed Workflow Steps (The 7 Steps)
insert into public.workflow_steps (step_number, step_name, role_required, sla_hours) values
  (1, 'Category Manager Approval', 'category_manager', 24),
  (2, 'Purchasing Manager Approval', 'purchasing_manager', 24),
  (3, 'Assistant Purchasing Director Approval', 'assistant_purchasing_director', 48),
  (4, 'Planning Director Approval', 'planning_director', 24),
  (5, 'Commercial and BD Exec Director', 'commercial_executive_director', 48),
  (6, 'General Director Approval', 'general_manager', 48),
  (7, 'ERP Code Issuance', 'erp_team', 24);

-- 2. Staff Profiles for Approval Roles
-- Creating placeholder users for each of the 6 other roles so they can log in and approve.
-- (Category Managers are already handled via category_assignments and seed_data.sql)

INSERT INTO public.profiles (id, email, full_name, role, job_title, department) VALUES 
  -- Step 2: Purchasing Manager
  ('e-pm-01', 'purchasing.manager@drsulaimanalhabib.com', 'Tariq Al-Purchasing', 'purchasing_manager', 'Purchasing Manager', 'Purchasing'),
  
  -- Step 3: Assistant Purchasing Director
  ('e-apd-01', 'asst.director@drsulaimanalhabib.com', 'Layla Director', 'assistant_purchasing_director', 'Assistant Purchasing Director', 'Purchasing'),
  
  -- Step 4: Planning Director
  ('e-pd-01', 'planning.director@drsulaimanalhabib.com', 'Omar Planner', 'planning_director', 'Planning Director', 'Planning'),
  
  -- Step 5: Commercial & BD Executive Director
  ('e-cbd-01', 'commercial.exec@drsulaimanalhabib.com', 'Khalid Executive', 'commercial_executive_director', 'Executive Director', 'Commercial'),
  
  -- Step 6: General Director
  ('e-gm-01', 'general.director@drsulaimanalhabib.com', 'Saeed General', 'general_manager', 'General Director', 'Management'),
  
  -- Step 7: ERP Team
  ('e-erp-01', 'erp.specialist@drsulaimanalhabib.com', 'Mona ERP', 'erp_team', 'ERP Specialist', 'IT')
ON CONFLICT (email) DO NOTHING;

-- 3. Authorization Function (Simulating the Logic)
-- This query demonstrates how the app checks if a user is authorized for a specific request.
/*
  SELECT exists (
    SELECT 1 
    FROM workflow_steps ws
    JOIN profiles p ON p.role = ws.role_required
    LEFT JOIN category_assignments ca ON ca.category_manager_id = p.id
    WHERE 
      ws.step_number = [CURRENT_REQUEST_STEP]
      AND p.id = [CURRENT_USER_ID]
      -- If it's step 1 (CM), enforce category check
      AND (ws.role_required != 'category_manager' OR ca.division_name = [REQUEST_CATEGORY])
  );
*/
