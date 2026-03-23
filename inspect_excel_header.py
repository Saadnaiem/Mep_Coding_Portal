import pandas as pd

try:
    df = pd.read_excel('Active Onhand.xlsx', nrows=5)
    print("Columns:")
    for col in df.columns:
        print(f"'{col}' - {df[col].dtype}")
    print("\nFirst row sample:")
    print(df.iloc[0].to_dict())
except Exception as e:
    print(f"Error: {e}")
