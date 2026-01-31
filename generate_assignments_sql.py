import csv
import uuid

# CSV Input File
csv_file = 'category assignment.csv'
# SQL Output File
sql_file = 'seed_assignments_from_csv.sql'

def escape_sql(val):
    return val.replace("'", "''")

sql_statements = [
    "-- Generated from category assignment.csv",
    "-- Assumes users already exist in auth.users. Does NOT create new users.",
    "DO $$",
    "DECLARE",
    "  target_user_id uuid;",
    "BEGIN",
    "  -- Clear existing assignments to avoid conflicts",
    "  DELETE FROM public.category_assignments;",
    ""
]

processed_emails = set()

try:
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            division = row['Division Name'].strip()
            email = row['Manager Email'].strip()
            name = row['Manager Name'].strip()
            
            # 1. Update Profile (Only once per email)
            if email not in processed_emails:
                sql_statements.append(f"""
  -- Update Profile for: {name} ({email})
  SELECT id INTO target_user_id FROM auth.users WHERE email = '{email}';
  
  IF target_user_id IS NOT NULL THEN
     INSERT INTO public.profiles (id, email, full_name, role, department, active)
     VALUES (target_user_id, '{email}', '{escape_sql(name)}', 'category_manager', 'Category Management', true)
     ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = 'category_manager';
  ELSE
     RAISE NOTICE 'User % not found in auth.users. Cannot create profile.', '{email}';
  END IF;
""")
                processed_emails.add(email)
            
            # 2. Assign Division
            sql_statements.append(f"""
  -- Assign {division} to {email}
  SELECT id INTO target_user_id FROM auth.users WHERE email = '{email}';
  
  IF target_user_id IS NOT NULL THEN
      INSERT INTO public.category_assignments (division_name, category_manager_id)
      VALUES ('{escape_sql(division)}', target_user_id)
      ON CONFLICT (division_name, category_manager_id) DO NOTHING;
  END IF;
""")

    sql_statements.append("END $$;")

    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_statements))
        
    print(f"Successfully generated {sql_file}")

except Exception as e:
    print(f"Error: {e}")
