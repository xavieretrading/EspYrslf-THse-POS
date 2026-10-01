import json, sys

sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/beverage_menu_sales.json", "r", encoding="utf-8") as f:
    data = json.load(f)

grouped = data["grouped"]
cats_order = ["Hot Coffee", "Iced & Blended", "Soda Based", "Fruit Teas", "Matcha Series", "Frappe", "TEA"]

total_beverages = 0
for cat in cats_order:
    prods = grouped.get(cat, [])
    total_beverages += len(prods)
    print(f"\n--- {cat} ({len(prods)} drinks) ---")
    for p in prods:
        cur_stock = p["stock"]
        # If stock <= 100: Dilmah tea, beginning is 100
        # If stock > 1000 and <= 9999: beginning is 9999
        # If stock > 9999: beginning is 10000
        # If stock < 1000: beginning is 999
        beg = 9999
        if cur_stock <= 100:
            beg = 100
        elif cur_stock > 9999:
            beg = 10000
        elif cur_stock < 999:
            beg = 999
        
        sales_variance = beg - cur_stock
        print(f"[{p['id']}] {p['name']:<35} | Price: ₱{p['price']:<4} | Beg: {beg:<5} | Now: {cur_stock:<5} | Sales: {sales_variance:<3} | Rev: ₱{sales_variance * p['price']:<6}")

print(f"\nTotal beverage menu items across 7 categories: {total_beverages}")
