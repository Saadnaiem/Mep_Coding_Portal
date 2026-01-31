-- UPDATED: Fix Missing User Type Column
-- Run this in Supabase SQL Editor

-- 1. Ensure Profiles table has all expected columns
-- Depending on your schema drift, 'user_type' might be missing.
alter table public.profiles 
add column if not exists user_type text default 'employee';

-- 2. Update the RPC function to populate user_type
create or replace function public.create_new_employee(
    email text,
    password text,
    full_name text,
    role text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  new_id uuid;
  encrypted_pw text;
begin
  -- Check for existing user
  if exists (select 1 from auth.users where auth.users.email = create_new_employee.email) then
      raise exception 'User with this email already exists';
  end if;

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
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', full_name, 'role', role, 'force_password_change', true),
      now(),
      now()
  );

  -- Explicitly create profile to ensure all required fields are set
  insert into public.profiles (id, email, full_name, role, user_type, active)
  values (new_id, email, full_name, role, 'employee', true);
  
  return jsonb_build_object('id', new_id, 'email', email);
end;
$$;

-- 3. Grant Permissions again
GRANT EXECUTE ON FUNCTION public.create_new_employee(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_new_employee(text, text, text, text) TO service_role;
