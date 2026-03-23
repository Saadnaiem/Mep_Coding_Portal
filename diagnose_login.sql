-- Diagnostic script to check why login might be failing

-- 1. Check if there are auth users without a corresponding profile
SELECT au.id, au.email, au.raw_user_meta_data
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 2. Verify RLS policies on profiles
SELECT polname, polcmd, polroles, polread
FROM pg_policy
JOIN pg_class ON pg_class.oid = pg_policy.polrelid
WHERE relname = 'profiles';

-- 3. Verify trigger exists for auto-creating profiles
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;
