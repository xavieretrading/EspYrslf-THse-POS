import json
import sys
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')

with open("scratch_branch30_products.json", "r", encoding="utf-8") as f:
    products = json.load(f)

print("Branch 30 items with 'cup' or '16oz' or '8oz' or 'plastic' or 'paper':")
for p in products:
    n = p["name"].lower()
    if any(k in n for k in ["cup", "16oz", "8oz", "plastic", "paper", "packaging"]):
        print(f"  {p['id']}: {p['name']} | stock: {p['stock']} | unit: {p.get('unit')}")

wb = openpyxl.load_workbook("Espresso_Branch_Inventory_Template.xlsx")
print("\nExcel template items matching cups/packaging/cups:")
s = wb["📋 Master Inventory Count"]
for r in range(1, s.max_row + 1):
    v = str(s.cell(r, 2).value or "").lower()
    if any(k in v for k in ["cup", "16oz", "8oz", "plastic", "paper", "straw", "lid", "stirrer", "pkg", "packaging"]):
        print(f"  Row {r}: {s.cell(r, 1).value} | {s.cell(r, 2).value} | UOM: {s.cell(r, 3).value} | Cost: {s.cell(r, 4).value} | Stock: {s.cell(r, 5).value}")
