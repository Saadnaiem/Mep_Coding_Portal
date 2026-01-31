-- FIX LOGIN FOR Ahmad Abdelaziz
-- Run this in Supabase SQL Editor

-- 1. Reset Password to 'Welcome123!'
-- Note: This requires the pgcrypto extension (usually enabled by default in Supabase)
UPDATE auth.users
SET encrypted_password = crypt('Welcome123!', gen_salt('bf'))
WHERE email = 'ahmad.abdelaziz@drsulaimanalhabib.com';

-- 2. Ensure Role is Correct in Profiles
UPDATE public.profiles
SET 
    role = 'category_manager', 
    user_type = 'employee',
    full_name = 'Ahmad Abdelaziz'
WHERE email = 'ahmad.abdelaziz@drsulaimanalhabib.com';

-- 3. Ensure User Metadata is Syncronized (Optional but good practice)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    jsonb_set(raw_user_meta_data, '{role}', '"category_manager"'),
    '{full_name}', '"Ahmad Abdelaziz"'
)
WHERE email = 'ahmad.abdelaziz@drsulaimanalhabib.com';
