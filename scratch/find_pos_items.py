import json

with open("scratch_branch30_products.json", "r", encoding="utf-8") as f:
    products = json.load(f)

with open("scratch_categories.json", "r", encoding="utf-8") as f:
    categories = json.load(f)

cat_map = {c["id"]: c["name"] for c in categories}

print("=== ALL BRANCH 30 ITEMS (categorized) ===")
for p in products:
    cname = cat_map.get(p.get("category_id"), "No Category")
    # print supplies or retail products
    print(f"ID:{p['id']:<4} | Cat: {cname:<20} | Name: {p['name']:<35} | Stock: {p['stock']:<10} | Unit: {str(p.get('unit')):<10} | Sellable: {p.get('is_sellable')}")
