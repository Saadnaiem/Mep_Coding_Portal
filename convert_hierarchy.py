
import pandas as pd
import json

df = pd.read_excel("IMF (Final 3-12-2025).xlsx")
df = df.fillna('')

hierarchy = []

def find_or_create(parent_list, name):
    for node in parent_list:
        if node['name'] == name:
            return node
    node = {'name': name}
    parent_list.append(node)
    return node

for index, row in df.iterrows():
    division = str(row['DIVISION']).strip()
    department = str(row['DEPARTMENT']).strip()
    category = str(row['CATEGORY']).strip()
    sub_category = str(row['SUB-CATEGORY']).strip()
    class_name = str(row['CLASS']).strip()

    if not division: continue

    div_node = find_or_create(hierarchy, division)
    
    if department:
        if 'children' not in div_node: div_node['children'] = []
        dept_node = find_or_create(div_node['children'], department)
        
        if category:
            if 'children' not in dept_node: dept_node['children'] = []
            cat_node = find_or_create(dept_node['children'], category)
            
            if sub_category:
                if 'children' not in cat_node: cat_node['children'] = []
                sub_node = find_or_create(cat_node['children'], sub_category)
                
                if class_name:
                    if 'children' not in sub_node: sub_node['children'] = []
                    find_or_create(sub_node['children'], class_name)


print(f"Writing services/hierarchyData.ts...")
with open("services/hierarchyData.ts", "w", encoding="utf-8") as f:
    f.write("import { HierarchyNode } from '../types';\n\n")
    f.write("export const PRODUCT_HIERARCHY: HierarchyNode[] = ")
    f.write(json.dumps(hierarchy, indent=2))
    f.write(";\n")
print("Done.")

