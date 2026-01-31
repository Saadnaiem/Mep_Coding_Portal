import pandas as pd
import os

files = [
    "MEP Coding Form.xlsx"
]

for f in files:
    if os.path.exists(f):
        print(f"--- Inspecting {f} ---")
        try:
            # excessive printing to find hidden sheets
            xl = pd.ExcelFile(f)
            print("Sheet names:", xl.sheet_names)
            
            for sheet in xl.sheet_names:
                print(f"\nSheet: {sheet}")
                df = pd.read_excel(f, sheet_name=sheet, nrows=20)
                print(df.to_string())
        except Exception as e:
            print(f"Error reading {f}: {e}")
