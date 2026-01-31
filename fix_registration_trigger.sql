-- Update the trigger function to capture contact details during registration
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_vendor boolean;
  user_role text;
  user_company text;
  v_type text;
  v_contact_name text;
  v_mobile text;
begin
  -- Extract metadata safely
  user_role := coalesce(new.raw_user_meta_data->>'role', 'vendor');
  user_company := new.raw_user_meta_data->>'company_name';
  v_type := coalesce(new.raw_user_meta_data->>'vendor_type', 'new');
  v_contact_name := new.raw_user_meta_data->>'contact_person_name';
  v_mobile := new.raw_user_meta_data->>'mobile_number';
  
  is_vendor := (user_role = 'vendor');

  -- Insert into profiles
  insert into public.profiles (id, email, full_name, role, company_name)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    user_role,
    user_company
  )
  on conflict (id) do update
  set 
    full_name = excluded.full_name,
    role = excluded.role,
    company_name = excluded.company_name;

  -- If it is a vendor, ensure a vendor record exists
  if is_vendor and user_company is not null then
      -- Check if vendor record already exists for this contact person
      if not exists (select 1 from public.vendors where contact_person_id = new.id) then
        insert into public.vendors (
            company_name, 
            contact_person_id, 
            vendor_type,
            contact_person_name,
            mobile_number,
            email_address
        )
        values (
            user_company, 
            new.id, 
            v_type,
            v_contact_name,
            v_mobile,
            new.email
        );
      end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;
