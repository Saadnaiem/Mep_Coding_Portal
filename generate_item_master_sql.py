import pandas as pd
import json

# Configuration
EXCEL_FILE = "Active Onhand.xlsx"
SQL_FILE = "seed_item_master.sql"
BATCH_SIZE = 1000

def generate_sql():
    print(f"Reading {EXCEL_FILE}...")
    try:
        df = pd.read_excel(EXCEL_FILE)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    print(f"Found {len(df)} rows. Generating SQL...")

    with open(SQL_FILE, 'w', encoding='utf-8') as f:
        f.write("-- Seed Item Master Data\n")
        f.write("BEGIN;\n\n")

        # Clean column names (strip whitespace)
        df.columns = df.columns.str.strip()
        
        # Verify columns exist
        required_cols = ['Item Code', 'Item Description', 'NEW DIVISION', 'NEW DEPARTMENT', 'NEW CATEGORY', 'NEW SUB-CATEGORY', 'NEW CLASS', 'BRAND']
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            print(f"Error: Missing columns {missing}")
            print(f"Available columns: {df.columns.tolist()}")
            return

        values_buffer = []
        
        for index, row in df.iterrows():
            # Extract and Clean Data
            erp_code = str(row['Item Code']).strip()
            # Skip if code is empty or 'nan'
            if not erp_code or erp_code.lower() == 'nan':
                continue
                
            desc = str(row['Item Description']).replace("'", "''") if pd.notna(row['Item Description']) else ''
            division = str(row['NEW DIVISION']).replace("'", "''") if pd.notna(row['NEW DIVISION']) else ''
            dept = str(row['NEW DEPARTMENT']).replace("'", "''") if pd.notna(row['NEW DEPARTMENT']) else ''
            cat = str(row['NEW CATEGORY']).replace("'", "''") if pd.notna(row['NEW CATEGORY']) else ''
            sub_cat = str(row['NEW SUB-CATEGORY']).replace("'", "''") if pd.notna(row['NEW SUB-CATEGORY']) else ''
            cl = str(row['NEW CLASS']).replace("'", "''") if pd.notna(row['NEW CLASS']) else ''
            brand = str(row['BRAND']).replace("'", "''") if pd.notna(row['BRAND']) else ''

            # Construct Value Tuple
            val = f"('{erp_code}', '{desc}', '{division}', '{dept}', '{cat}', '{sub_cat}', '{cl}', '{brand}')"
            values_buffer.append(val)

            # Write Batch
            if len(values_buffer) >= BATCH_SIZE:
                stmt = f"INSERT INTO public.item_master (erp_item_code, item_description, division, department, category, sub_category, class_name, brand) VALUES {','.join(values_buffer)} ON CONFLICT (erp_item_code) DO UPDATE SET item_description = EXCLUDED.item_description, division = EXCLUDED.division, department = EXCLUDED.department, category = EXCLUDED.category, sub_category = EXCLUDED.sub_category, class_name = EXCLUDED.class_name, brand = EXCLUDED.brand;\n"
                f.write(stmt)
                values_buffer = []

        # Write remaining
        if values_buffer:
             stmt = f"INSERT INTO public.item_master (erp_item_code, item_description, division, department, category, sub_category, class_name, brand) VALUES {','.join(values_buffer)} ON CONFLICT (erp_item_code) DO UPDATE SET item_description = EXCLUDED.item_description, division = EXCLUDED.division, department = EXCLUDED.department, category = EXCLUDED.category, sub_category = EXCLUDED.sub_category, class_name = EXCLUDED.class_name, brand = EXCLUDED.brand;\n"
             f.write(stmt)

        f.write("\nCOMMIT;\n")
    
    print(f"Successfully generated {SQL_FILE}")

if __name__ == "__main__":
    generate_sql()
