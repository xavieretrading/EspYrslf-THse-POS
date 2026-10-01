import sys, os
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"C:\Users\Philippines Freight\MainSystems\POS\recordsExcel\InventoryEspresso\Espresso-Beginning Stocks (5).xlsx"
wb = openpyxl.load_workbook(file_path, data_only=True)

# Let's inspect all items in each sheet and build a lookup
sheet_aug8 = wb["Inventory - August 8"]
sheet_aug13 = wb["Additional - August 13"]
sheet_aug24 = wb["Additional - August 24"]
sheet_sep2 = wb["Sept 2-2026"]
sheet_sep3 = wb["Sept 3-2026"]

print("--- AUGUST 8 (BEGINNING) ITEMS ---")
for r in range(4, sheet_aug8.max_row + 1):
    qty = sheet_aug8.cell(r, 1).value
    uom = sheet_aug8.cell(r, 2).value
    desc = sheet_aug8.cell(r, 3).value
    price = sheet_aug8.cell(r, 4).value
    if desc and qty is not None:
        print(f"Aug 8: {qty} {uom} | {desc} | @{price}")

print("\n--- AUGUST 13 (ADDITIONAL 1) ITEMS ---")
for r in range(3, sheet_aug13.max_row + 1):
    qty = sheet_aug13.cell(r, 1).value
    uom = sheet_aug13.cell(r, 2).value
    desc = sheet_aug13.cell(r, 3).value
    price = sheet_aug13.cell(r, 4).value
    if desc and qty is not None:
        print(f"Aug 13: {qty} {uom} | {desc} | @{price}")

print("\n--- AUGUST 24 (ADDITIONAL 2) ITEMS ---")
for r in range(2, sheet_aug24.max_row + 1):
    dt = sheet_aug24.cell(r, 1).value
    desc = sheet_aug24.cell(r, 2).value
    qty = sheet_aug24.cell(r, 3).value
    uom = sheet_aug24.cell(r, 4).value
    cost = sheet_aug24.cell(r, 5).value
    if desc and qty is not None:
        print(f"Aug 24: {qty} {uom} | {desc} | @{cost}")

print("\n--- SEPT 2 (ADDITIONAL 3) ITEMS ---")
for r in range(2, sheet_sep2.max_row + 1):
    desc = sheet_sep2.cell(r, 2).value
    qty = sheet_sep2.cell(r, 3).value
    uom = sheet_sep2.cell(r, 4).value
    if desc and qty is not None:
        print(f"Sept 2: {qty} {uom} | {desc}")

print("\n--- SEPT 3 (ADDITIONAL 4) ITEMS ---")
for r in range(2, sheet_sep3.max_row + 1):
    desc = sheet_sep3.cell(r, 2).value
    qty = sheet_sep3.cell(r, 3).value
    uom = sheet_sep3.cell(r, 4).value
    if desc and qty is not None:
        print(f"Sept 3: {qty} {uom} | {desc}")
