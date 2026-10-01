import json, sys

sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/beverage_menu_sales.json", "r", encoding="utf-8") as f:
    data = json.load(f)

grouped = data["grouped"]

if "Matcha Series" in grouped:
    print(f"\n==========================================")
    print(f"CATEGORY: Matcha Series ({len(grouped['Matcha Series'])} drinks)")
    print(f"==========================================")
    for p in grouped["Matcha Series"]:
        cur_stock = p["stock"]
        actual_sales = p.get("actual_sales_order_items", 0)
        print(f"ID:{p['id']:<4} | {p['name']:<35} | Stock: {cur_stock:<6} | Sales from Orders: {actual_sales:<4} | Price: ₱{p['price']}")
else:
    print("Matcha Series not in grouped keys:", grouped.keys())
