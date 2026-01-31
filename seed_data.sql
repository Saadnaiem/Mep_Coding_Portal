-- Seed Data for Category Managers and Assignments
-- Run this after setting up the tables in database.sql

-- 1. Insert/Ensure Profiles exist for the Category Managers
-- Note: In a real Supabase setup, 'id' comes from auth.users. 
-- For this seed, we are inserting dummy UUIDs or assuming they will be linked later.
-- We use ON CONFLICT to avoid duplicates if run multiple times.

INSERT INTO public.profiles (id, email, full_name, role, job_title, department)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'saad.abdulaah@drsulaimanalhabib.com', 'Saad Naiem Ali', 'category_manager', 'Category Manager', 'Pharma'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'ahmed.barakat@drsulaimanalhabib.com', 'Ahmed Ibrahim Barakat', 'category_manager', 'Category Manager', 'Pharma')
ON CONFLICT (email) DO NOTHING;

-- 2. Assign Divisions to Category Managers
-- We use a subquery to look up the ID by email to ensure referential integrity.

INSERT INTO public.category_assignments (division_name, category_manager_id)
VALUES 
  ('MOM AND BABY', (SELECT id FROM public.profiles WHERE email = 'saad.abdulaah@drsulaimanalhabib.com')),
  ('PERSONAL CARE', (SELECT id FROM public.profiles WHERE email = 'saad.abdulaah@drsulaimanalhabib.com')),
  ('WELLNESS', (SELECT id FROM public.profiles WHERE email = 'saad.abdulaah@drsulaimanalhabib.com')),
  ('BEAUTY', (SELECT id FROM public.profiles WHERE email = 'ahmed.barakat@drsulaimanalhabib.com'))
ON CONFLICT (division_name, category_manager_id) DO NOTHING;

-- Note: All 4 divisions are now assigned.
