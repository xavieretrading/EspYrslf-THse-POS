import json

with open("scratch_branch30_products.json", "r", encoding="utf-8") as f:
    products = json.load(f)

print(f"Total products in branch 30: {len(products)}")

# Let's see all non-sellable (supplies) and sellable beverages/snacks/teas
supplies = [p for p in products if p.get("is_sellable") == 0]
print(f"Supplies (non-sellable) count: {len(supplies)}")
for p in supplies:
    print(f"SUPPLY: id={p['id']}, name='{p['name']}', stock={p['stock']}, unit='{p.get('unit')}', cost={p.get('cost')}, price={p.get('price')}")

print("\n--- SELLABLE RETAIL (Drinks, Snacks, Dilmah Tea) ---")
retail = [p for p in products if p.get("is_sellable") == 1 and p.get("category_id") in [77, 85, 88, 39, 66, 67]]
for p in retail:
    print(f"RETAIL: id={p['id']}, name='{p['name']}', stock={p['stock']}, unit='{p.get('unit')}', cost={p.get('cost')}, price={p.get('price')}")
