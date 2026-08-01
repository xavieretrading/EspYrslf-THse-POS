-- SQL Script to Populate Laundry Categories and Services (Products)
-- You can run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Remove existing laundry products and categories to start fresh
DELETE FROM public.products_espresso WHERE category_id IN (
    SELECT id FROM public.categories_espresso WHERE division = 'laundry'
);
DELETE FROM public.categories_espresso WHERE division = 'laundry';

-- 2. Insert new categories
INSERT INTO public.categories_espresso (name, division) VALUES
('Everyday Wear (Wash, Dry & Fold)', 'laundry'),
('Pressing & Ironing', 'laundry'),
('Everyday Wear (Wash only)', 'laundry'),
('Dry Clean ( Minimum of 2weeks and Maximum of 1month)', 'laundry');

-- 3. Insert Everyday Wear (Wash, Dry & Fold) products
-- Note: Minimum billing rate is 7kg. Prices are per kg.
INSERT INTO public.products_espresso (name, category_id, cost, price, stock, is_active) VALUES
('Regular Clothes (5+2 FREE) /kg', (SELECT id FROM public.categories_espresso WHERE name = 'Everyday Wear (Wash, Dry & Fold)' LIMIT 1), 10.00, 49.00, 9999, 1),
('Towels & Bedsheets (5+2 FREE) /kg', (SELECT id FROM public.categories_espresso WHERE name = 'Everyday Wear (Wash, Dry & Fold)' LIMIT 1), 20.00, 99.00, 9999, 1),
('Undergarments / Delicate Load /kg', (SELECT id FROM public.categories_espresso WHERE name = 'Everyday Wear (Wash, Dry & Fold)' LIMIT 1), 20.00, 99.00, 9999, 1),
('Curtains /kilo', (SELECT id FROM public.categories_espresso WHERE name = 'Everyday Wear (Wash, Dry & Fold)' LIMIT 1), 20.00, 99.00, 9999, 1),
('Comforter /kilo', (SELECT id FROM public.categories_espresso WHERE name = 'Everyday Wear (Wash, Dry & Fold)' LIMIT 1), 40.00, 179.00, 9999, 1);

-- 4. Insert Pressing & Ironing products
INSERT INTO public.products_espresso (name, category_id, cost, price, stock, is_active) VALUES
('Pants / Trousers (Ironing)', (SELECT id FROM public.categories_espresso WHERE name = 'Pressing & Ironing' LIMIT 1), 15.00, 69.00, 9999, 1),
('Polo / Button-Up Shirt (Ironing)', (SELECT id FROM public.categories_espresso WHERE name = 'Pressing & Ironing' LIMIT 1), 15.00, 69.00, 9999, 1),
('Barong / Formal Shirt (Ironing)', (SELECT id FROM public.categories_espresso WHERE name = 'Pressing & Ironing' LIMIT 1), 30.00, 149.00, 9999, 1),
('Dress (Ironing)', (SELECT id FROM public.categories_espresso WHERE name = 'Pressing & Ironing' LIMIT 1), 30.00, 149.00, 9999, 1);

-- 5. Insert Everyday Wear (Wash only) products
INSERT INTO public.products_espresso (name, category_id, cost, price, stock, is_active) VALUES
('Everyday Wear (Wash Only)', (SELECT id FROM public.categories_espresso WHERE name = 'Everyday Wear (Wash only)' LIMIT 1), 10.00, 50.00, 9999, 1);

-- 6. Insert Dry Clean products (Minimum of 2 weeks and Maximum of 1 month)
INSERT INTO public.products_espresso (name, category_id, cost, price, stock, is_active) VALUES
('Gown (Dry Clean)', (SELECT id FROM public.categories_espresso WHERE name = 'Dry Clean ( Minimum of 2weeks and Maximum of 1month)' LIMIT 1), 300.00, 1499.00, 9999, 1),
('Suits (Dry Clean)', (SELECT id FROM public.categories_espresso WHERE name = 'Dry Clean ( Minimum of 2weeks and Maximum of 1month)' LIMIT 1), 200.00, 999.00, 9999, 1),
('Shoes (Dry Clean)', (SELECT id FROM public.categories_espresso WHERE name = 'Dry Clean ( Minimum of 2weeks and Maximum of 1month)' LIMIT 1), 60.00, 299.00, 9999, 1),
('Stuff Toys - Small (Dry Clean)', (SELECT id FROM public.categories_espresso WHERE name = 'Dry Clean ( Minimum of 2weeks and Maximum of 1month)' LIMIT 1), 40.00, 199.00, 9999, 1),
('Stuff Toys - Medium (Dry Clean)', (SELECT id FROM public.categories_espresso WHERE name = 'Dry Clean ( Minimum of 2weeks and Maximum of 1month)' LIMIT 1), 100.00, 499.00, 9999, 1),
('Stuff Toys - Large (Dry Clean)', (SELECT id FROM public.categories_espresso WHERE name = 'Dry Clean ( Minimum of 2weeks and Maximum of 1month)' LIMIT 1), 300.00, 1499.00, 9999, 1),
('Stuff Toys - Xra Large (Dry Clean)', (SELECT id FROM public.categories_espresso WHERE name = 'Dry Clean ( Minimum of 2weeks and Maximum of 1month)' LIMIT 1), 1000.00, 4999.00, 9999, 1);
