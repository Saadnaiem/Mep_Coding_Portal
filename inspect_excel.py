
import pandas as pd
import json
import os

files = [
    "IMF (Final 3-12-2025).xlsx",
    "MEP Coding Form 4.1.2026.xlsx"
]

results = {}

for f in files:
    try:
        if os.path.exists(f):
            print(f"Reading {f}...")
            df = pd.read_excel(f)
            print(f"Columns in {f}: {list(df.columns)}")
            print(f"First 5 rows of {f}:")
            print(df.head().to_string())
            results[f] = "Success"
        else:
            print(f"File {f} not found.")
    except Exception as e:
        print(f"Error reading {f}: {e}")

