import pandas as pd
import os

file_path = "Active Onhand.xlsx"

if os.path.exists(file_path):
    try:
        # Read the first few rows to inspect structure
        print(f"--- Reading {file_path} ---")
        
        # Method 1: standard read to see if headers are picked up correctly
        df = pd.read_excel(file_path, nrows=20)
        print(f"\n[Attempt 1] Columns detected: {list(df.columns)}")
        print("\nFirst 20 rows:")
        print(df.head(20).to_string())
        
        # Method 2: read without header to see raw top rows in case header is offset
        print("\n\n--- Raw top 5 rows (header=None) ---")
        df_raw = pd.read_excel(file_path, nrows=5, header=None)
        print(df_raw.to_string())
        
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
else:
    print(f"File not found: {os.path.abspath(file_path)}")
