# Modify save section in generate_audit_excel_v2.py
import re

with open("scratch/generate_audit_excel_v2.py", "r", encoding="utf-8") as f:
    code = f.read()

# Replace save logic at the end
old_save = """# Save workbook to both locations
wb.save(excel_output_path)
wb.save(workspace_copy_path)
print(f"Successfully generated: {excel_output_path}")
print(f"Successfully mirrored: {workspace_copy_path}")"""

new_save = """# Save workbook with fallback if file is open in Excel
updated_excel_path = os.path.join(rec_dir, "Espresso_Yourself_Inventory_Audit_with_Beginning_Stocks.xlsx")
updated_workspace_path = os.path.join(workspace_dir, "Espresso_Yourself_Inventory_Audit_with_Beginning_Stocks.xlsx")

# Always save the dedicated updated file
wb.save(updated_excel_path)
wb.save(updated_workspace_path)
print(f"Successfully generated: {updated_excel_path}")
print(f"Successfully mirrored: {updated_workspace_path}")

# Try saving to the original filename if user closed Excel
try:
    wb.save(excel_output_path)
    print(f"Successfully updated original: {excel_output_path}")
except PermissionError:
    print(f"Note: {excel_output_path} is currently open in Excel. Saved updated version to {updated_excel_path}")

try:
    wb.save(workspace_copy_path)
    print(f"Successfully updated original mirror: {workspace_copy_path}")
except PermissionError:
    pass
"""

code = code.replace(old_save, new_save)
with open("scratch/generate_audit_excel_v2.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Updated save logic in script")
