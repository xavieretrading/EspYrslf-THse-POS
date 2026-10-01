# Update save paths in add_beverage_sales_tab.py
with open("scratch/add_beverage_sales_tab.py", "r", encoding="utf-8") as f:
    code = f.read()

old_save_code = """# Save updated workbook
wb.save(excel_path)
wb.save(workspace_copy_path)
print(f"Successfully added Beverage Sales tab to {excel_path}")
print(f"Successfully added Beverage Sales tab to {workspace_copy_path}")

# Try updating the original file if user closed it
orig_path = os.path.join(rec_dir, "Espresso_Yourself_Physical_vs_POS_Inventory_Audit.xlsx")
try:
    wb.save(orig_path)
    print(f"Successfully updated original file: {orig_path}")
except PermissionError:
    print(f"Original file {orig_path} is still locked in Excel.")"""

new_save_code = """# Save updated workbook to dedicated new file and attempt updates
new_full_path = os.path.join(rec_dir, "Espresso_Yourself_Full_Inventory_and_Coffee_Sales_Audit.xlsx")
new_full_workspace = os.path.join(workspace_dir, "Espresso_Yourself_Full_Inventory_and_Coffee_Sales_Audit.xlsx")

wb.save(new_full_path)
wb.save(new_full_workspace)
print(f"Successfully generated: {new_full_path}")
print(f"Successfully mirrored: {new_full_workspace}")

# Attempt to update the other files if not locked
for p in [excel_path, workspace_copy_path, os.path.join(rec_dir, "Espresso_Yourself_Physical_vs_POS_Inventory_Audit.xlsx")]:
    try:
        wb.save(p)
        print(f"Also updated: {p}")
    except PermissionError:
        print(f"File {p} currently locked by Excel.")
"""

code = code.replace(old_save_code, new_save_code)
with open("scratch/add_beverage_sales_tab.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Updated save paths in add_beverage_sales_tab.py")
