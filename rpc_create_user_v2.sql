-- UPDATED FIX with Permissions and Search Path
-- Run this ENTIRE script in Supabase SQL Editor

-- 1. Enable pgcrypto
create extension if not exists "pgcrypto" with schema extensions;

-- 2. Grant usage on schema if needed (usually default, but good to be safe)
grant usage on schema public to postgres, anon, authenticated, service_role;

-- 3. Create the function with corrected Search Path and Permissions
create or replace function public.create_new_employee(
    email text,
    password text,
    full_name text,
    role text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions, auth -- Include extensions for pgcrypto, auth for users
as $$
declare
  new_id uuid;
  encrypted_pw text;
begin
  -- Check if user already exists to avoid unique constraint violation error being vague
  if exists (select 1 from auth.users where auth.users.email = create_new_employee.email) then
      raise exception 'User with this email already exists';
  end if;

  -- Hash password
  new_id := gen_random_uuid();
  encrypted_pw := crypt(password, gen_salt('bf'));
  
  -- Insert user
  insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
  ) values (
      '00000000-0000-0000-0000-000000000000',
      new_id,
      'authenticated',
      'authenticated',
      email,
      encrypted_pw,
      now(), -- Auto confirm
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', full_name, 'role', role, 'force_password_change', true),
      now(),
      now()
  );
  
  return jsonb_build_object('id', new_id, 'email', email);
end;
$$;

-- 4. CRITICAL: Grant permission to call this function
GRANT EXECUTE ON FUNCTION public.create_new_employee(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_new_employee(text, text, text, text) TO service_role;
