-- FIX FOR "EMAIL NOT CONFIRMED" ERROR
-- Run this script in your Supabase SQL Editor to create a helper function 
-- that creates users with auto-confirmed emails.

-- 1. Enable pgcrypto for password hashing
create extension if not exists "pgcrypto";

-- 2. Create the function
create or replace function create_new_employee(
    email text,
    password text,
    full_name text,
    role text
) returns jsonb
language plpgsql
security definer -- Runs with High Privileges (postgres) to write to auth.users
set search_path = public -- Secure search path
as $$
declare
  new_id uuid := gen_random_uuid();
  encrypted_pw text;
begin
  -- Hash the password safely
  encrypted_pw := crypt(password, gen_salt('bf'));
  
  -- Insert directly into auth.users 
  -- We set 'email_confirmed_at' to now() to skip email verification
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
      updated_at,
      confirmation_token,
      recovery_token
  ) values (
      '00000000-0000-0000-0000-000000000000', -- Default instance_id
      new_id,
      'authenticated',
      'authenticated',
      email,
      encrypted_pw,
      now(), -- Auto-Confirm: This is the key fix
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', full_name, 'role', role, 'force_password_change', true),
      now(),
      now(),
      '',
      ''
  );
  
  -- Note: The existing trigger 'handle_new_user' on auth.users should automatically
  -- create the corresponding record in public.profiles.
  
  return jsonb_build_object('id', new_id, 'email', email);
end;
$$;