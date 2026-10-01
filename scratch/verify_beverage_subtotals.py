import sys, openpyxl

sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook(r'c:\Users\Philippines Freight\MainSystems\POS\recordsExcel\Espresso_Yourself_Full_Inventory_and_Coffee_Sales_Audit.xlsx', data_only=False)
ws = wb['☕ Beverage Sales & Variance']

print(f"Sheet '{ws.title}' has {ws.max_row} rows and {ws.max_column} columns.")

# Print subtotals
for r in range(1, ws.max_row + 1):
    val_a = str(ws.cell(r, 1).value or '')
    if "Subtotal" in val_a or "GRAND TOTAL" in val_a:
        sales_f = ws.cell(r, 8).value
        rev_f = ws.cell(r, 9).value
        print(f"Row {r:2d}: {val_a:<45} | Sales: {str(sales_f):<25} | Rev: {str(rev_f)}")
