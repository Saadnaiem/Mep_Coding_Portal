-- CONFIRM ALL USERS SCRIPT
-- Run this in Supabase SQL Editor to fix any users stuck in "Email Not Confirmed" state

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- Also ensure they have a profile while we are at it
INSERT INTO public.profiles (id, email, full_name, role, user_type, active)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name', 
    raw_user_meta_data->>'role', 
    'employee', 
    true
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
