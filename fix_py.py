
with open("components/ItemMasterAssignment.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import re
content = re.sub(r"alert\(Successfully assigned[\s\S]*?details\.\);", "alert(`Successfully assigned ${payloads.length} items to ${vendorEmail}.\\n\\nAn email notification has been sent to the vendor containing their new assignment details.`);", content)

with open("components/ItemMasterAssignment.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done in python script!")

