import json

with open("scratch_branch30_products.json", "r", encoding="utf-8") as f:
    products = json.load(f)

with open("scratch_categories.json", "r", encoding="utf-8") as f:
    categories = json.load(f)

cat_map = {c["id"]: c["name"] for c in categories}

by_cat = {}
for p in products:
    cname = cat_map.get(p.get("category_id"), f"Unknown ({p.get('category_id')})")
    by_cat.setdefault(cname, []).append(p)

for cname, prods in sorted(by_cat.items()):
    print(f"=== {cname} ({len(prods)} items) ===")
    for p in prods:
        print(f"  [{p['id']}] {p['name']} | Stock: {p['stock']} | Unit: {p.get('unit')} | Sellable: {p.get('is_sellable')} | Price: {p['price']} | Cost: {p['cost']}")
