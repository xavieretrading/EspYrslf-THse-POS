import json, sys

sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/beverage_menu_sales.json", "r", encoding="utf-8") as f:
    data = json.load(f)

grouped = data["grouped"]

for cat_name, prods in grouped.items():
    print(f"\n==========================================")
    print(f"CATEGORY: {cat_name} ({len(prods)} drinks)")
    print(f"==========================================")
    for p in prods:
        cur_stock = p["stock"]
        actual_sales = p.get("actual_sales_order_items", 0)
        # Check initial baseline
        # If current stock is around 9900-10000:
        # initial was likely 10000 or 9999
        print(f"ID:{p['id']:<4} | {p['name']:<35} | Stock: {cur_stock:<6} | Sales from Orders: {actual_sales:<4} | Price: ₱{p['price']}")
