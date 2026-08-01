-- SQL Script: Seed Sample Ingredients & Recipes (BOM)
-- Run this in your Supabase SQL Editor to test the recipe deduction engine

-- 1. Insert raw ingredients (is_sellable = 0, hidden from POS checkout)
INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable)
SELECT 
    b.id as branch_id, 
    c.id as category_id,
    'Paper Cups' as name,
    0.0 as price,
    2.5 as cost,
    500 as stock,
    1 as is_active,
    0 as is_sellable -- Hidden from POS
FROM public.branches_espresso b, public.categories_espresso c
WHERE c.name = 'Hot Coffee' OR c.name = 'Beverages'
LIMIT 1;

INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable)
SELECT 
    b.id as branch_id, 
    c.id as category_id,
    'Refined Sugar (grams)' as name,
    0.0 as price,
    0.05 as cost,
    10000 as stock,
    1 as is_active,
    0 as is_sellable -- Hidden from POS
FROM public.branches_espresso b, public.categories_espresso c
WHERE c.name = 'Hot Coffee' OR c.name = 'Beverages'
LIMIT 1;

-- 2. Link them to the 'Mango Coconut Coffee' sellable menu item
INSERT INTO public.product_recipes (product_id, ingredient_id, quantity)
SELECT 
    p1.id as product_id,
    p2.id as ingredient_id,
    1.0 as quantity -- 1 cup used per coffee order
FROM public.products_espresso p1, public.products_espresso p2
WHERE p1.name = 'Mango Coconut Coffee' AND p2.name = 'Paper Cups'
ON CONFLICT (product_id, ingredient_id) DO NOTHING;

INSERT INTO public.product_recipes (product_id, ingredient_id, quantity)
SELECT 
    p1.id as product_id,
    p2.id as ingredient_id,
    20.0 as quantity -- 20 grams of sugar used per coffee order
FROM public.products_espresso p1, public.products_espresso p2
WHERE p1.name = 'Mango Coconut Coffee' AND p2.name = 'Refined Sugar (grams)'
ON CONFLICT (product_id, ingredient_id) DO NOTHING;
