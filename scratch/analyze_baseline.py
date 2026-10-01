import json, sys

sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/beverage_menu_sales.json", "r", encoding="utf-8") as f:
    data = json.load(f)

targetProducts = data["targetProducts"]

print("Analyzing stock vs actual order_items sales:")
for p in targetProducts:
    stock = p["stock"]
    actual_orders = p["actual_sales_order_items"]
    # Check if (10000 - stock) or (9999 - stock) matches actual_orders
    delta_10k = 10000 - stock
    delta_9999 = 9999 - stock
    if actual_orders > 0 or stock < 9999:
        print(f"ID:{p['id']:<4} | {p['name']:<32} | Stock:{stock:<6} | Orders:{actual_orders:<3} | 10k-stock:{delta_10k:<3} | 9999-stock:{delta_9999:<3}")
