-- =========================================================================
-- SQL SEEDING SCRIPT FOR ESPRESSO YOURSELF MENU AND RECIPES (BRANCH 30)
-- Run this query in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- =========================================================================

DO $$
DECLARE
    -- Category IDs
    cat_hot BIGINT; cat_iced BIGINT; cat_soda BIGINT; cat_tea BIGINT; cat_matcha BIGINT;

    -- Ingredient IDs
    beans_id BIGINT; milk_id BIGINT; chocolate_id BIGINT; condense_id BIGINT;
    guava_id BIGINT; mango_id BIGINT; pomegranate_id BIGINT; lychee_id BIGINT;
    macadamia_id BIGINT; irish_id BIGINT; vanilla_id BIGINT; sprite_id BIGINT;
    butterscotch_id BIGINT; caramel_id BIGINT; jasmine_id BIGINT; black_id BIGINT;
    matcha_id BIGINT; biscoff_id BIGINT; cream_id BIGINT; sugar_id BIGINT;

    -- Loop Reference
    prod_id BIGINT;
BEGIN

    -- 1. Create/Retrieve Categories for Branch 30
    SELECT id INTO cat_hot FROM public.categories_espresso WHERE branch_id = 30 AND name = 'Hot Coffee';
    IF cat_hot IS NULL THEN
        INSERT INTO public.categories_espresso (name, branch_id, division, is_active) VALUES ('Hot Coffee', 30, 'coffee', 1) RETURNING id INTO cat_hot;
    END IF;

    SELECT id INTO cat_iced FROM public.categories_espresso WHERE branch_id = 30 AND name = 'Iced & Blended';
    IF cat_iced IS NULL THEN
        INSERT INTO public.categories_espresso (name, branch_id, division, is_active) VALUES ('Iced & Blended', 30, 'coffee', 1) RETURNING id INTO cat_iced;
    END IF;

    SELECT id INTO cat_soda FROM public.categories_espresso WHERE branch_id = 30 AND name = 'Soda Based';
    IF cat_soda IS NULL THEN
        INSERT INTO public.categories_espresso (name, branch_id, division, is_active) VALUES ('Soda Based', 30, 'coffee', 1) RETURNING id INTO cat_soda;
    END IF;

    SELECT id INTO cat_tea FROM public.categories_espresso WHERE branch_id = 30 AND name = 'Fruit Teas';
    IF cat_tea IS NULL THEN
        INSERT INTO public.categories_espresso (name, branch_id, division, is_active) VALUES ('Fruit Teas', 30, 'coffee', 1) RETURNING id INTO cat_tea;
    END IF;

    SELECT id INTO cat_matcha FROM public.categories_espresso WHERE branch_id = 30 AND name = 'Matcha Series';
    IF cat_matcha IS NULL THEN
        INSERT INTO public.categories_espresso (name, branch_id, division, is_active) VALUES ('Matcha Series', 30, 'coffee', 1) RETURNING id INTO cat_matcha;
    END IF;

    -- 2. Create/Retrieve Raw Ingredients (is_sellable = 0) for Branch 30
    SELECT id INTO beans_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Concept Blend 1';
    IF beans_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Concept Blend 1', 980, 0, 10, 1, 0, 'pack') RETURNING id INTO beans_id;
    END IF;

    SELECT id INTO milk_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Arla Full Cream Milk 1L';
    IF milk_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Arla Full Cream Milk 1L', 99, 0, 10, 1, 0, 'pack') RETURNING id INTO milk_id;
    END IF;

    SELECT id INTO chocolate_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Easy Dark Chocolate 1KL';
    IF chocolate_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Easy Dark Chocolate 1KL', 396, 0, 10, 1, 0, 'pack') RETURNING id INTO chocolate_id;
    END IF;

    SELECT id INTO condense_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Doreen Condense Milk 390G';
    IF condense_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Doreen Condense Milk 390G', 44, 0, 10, 1, 0, 'can') RETURNING id INTO condense_id;
    END IF;

    SELECT id INTO guava_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Shott Pink Guava 1L';
    IF guava_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Shott Pink Guava 1L', 890, 0, 10, 1, 0, 'bot') RETURNING id INTO guava_id;
    END IF;

    SELECT id INTO mango_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Shott Mango 1L';
    IF mango_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Shott Mango 1L', 890, 0, 10, 1, 0, 'bot') RETURNING id INTO mango_id;
    END IF;

    SELECT id INTO pomegranate_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Shott Pomegranate 1L';
    IF pomegranate_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Shott Pomegranate 1L', 890, 0, 10, 1, 0, 'bot') RETURNING id INTO pomegranate_id;
    END IF;

    SELECT id INTO lychee_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Shott Lychee 1L';
    IF lychee_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Shott Lychee 1L', 690, 0, 10, 1, 0, 'bot') RETURNING id INTO lychee_id;
    END IF;

    SELECT id INTO macadamia_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Shott Macadamia 1L';
    IF macadamia_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Shott Macadamia 1L', 690, 0, 10, 1, 0, 'bot') RETURNING id INTO macadamia_id;
    END IF;

    SELECT id INTO irish_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Shott Irish Cream 1L';
    IF irish_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Shott Irish Cream 1L', 690, 0, 10, 1, 0, 'bot') RETURNING id INTO irish_id;
    END IF;

    SELECT id INTO vanilla_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Shott Vanilla 1L';
    IF vanilla_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Shott Vanilla 1L', 690, 0, 10, 1, 0, 'bot') RETURNING id INTO vanilla_id;
    END IF;

    SELECT id INTO butterscotch_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Shott Butterscotch 1L';
    IF butterscotch_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Shott Butterscotch 1L', 690, 0, 10, 1, 0, 'bot') RETURNING id INTO butterscotch_id;
    END IF;

    SELECT id INTO caramel_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Shott Caramel 1L';
    IF caramel_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Shott Caramel 1L', 690, 0, 10, 1, 0, 'bot') RETURNING id INTO caramel_id;
    END IF;

    SELECT id INTO sprite_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Sprite 1.5L';
    IF sprite_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Sprite 1.5L', 69.5, 0, 10, 1, 0, 'bot') RETURNING id INTO sprite_id;
    END IF;

    SELECT id INTO jasmine_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Jasmine Tea Leaves 1kg';
    IF jasmine_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Jasmine Tea Leaves 1kg', 400, 0, 10, 1, 0, 'pack') RETURNING id INTO jasmine_id;
    END IF;

    SELECT id INTO black_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Black Tea Leaves 1kg';
    IF black_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Black Tea Leaves 1kg', 400, 0, 10, 1, 0, 'pack') RETURNING id INTO black_id;
    END IF;

    SELECT id INTO matcha_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Matcha Powder 1kg';
    IF matcha_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Matcha Powder 1kg', 1200, 0, 10, 1, 0, 'pack') RETURNING id INTO matcha_id;
    END IF;

    SELECT id INTO biscoff_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Biscoff Spread 400g';
    IF biscoff_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Biscoff Spread 400g', 350, 0, 10, 1, 0, 'jar') RETURNING id INTO biscoff_id;
    END IF;

    SELECT id INTO cream_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Whipping Cream 1L';
    IF cream_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'Whipping Cream 1L', 250, 0, 10, 1, 0, 'bot') RETURNING id INTO cream_id;
    END IF;

    SELECT id INTO sugar_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'White Sugar 1kg';
    IF sugar_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, name, price, cost, stock, is_active, is_sellable, unit) 
        VALUES (30, 'White Sugar 1kg', 80, 0, 10, 1, 0, 'pack') RETURNING id INTO sugar_id;
    END IF;

    -- 3. Create Sellable Products (with accurate recipe gross costs!) and their Recipe Mappings
    -- Product: Iced Americano (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Americano (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Americano (Large)', 149, 22.64, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 22.64 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 30);

    -- Product: Iced Matcha Latte (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Matcha Latte (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_matcha, 'Iced Matcha Latte (Large)', 149, 33.79, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 33.79 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, matcha_id, 4);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);

    -- Product: Hot Americano (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Americano (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Americano (Large)', 149, 26.78, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 26.78 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 30);

    -- Product: Iced Matcha Seasalt (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Matcha Seasalt (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_matcha, 'Iced Matcha Seasalt (Large)', 149, 39.79, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 39.79 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, matcha_id, 4);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, cream_id, 30);

    -- Product: Iced Spanish Latte (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Spanish Latte (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Spanish Latte (Large)', 149, 40.96, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 40.96 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 5);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, condense_id, 40);

    -- Product: Iced Latte (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Latte (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Latte (Large)', 149, 45.01, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 45.01 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 150);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);

    -- Product: Iced White Chocolate Matcha (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced White Chocolate Matcha (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_matcha, 'Iced White Chocolate Matcha (Large)', 149, 61.39, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 61.39 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, matcha_id, 4);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, chocolate_id, 40);

    -- Product: Iced Dirty Matcha (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Dirty Matcha (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_matcha, 'Iced Dirty Matcha (Large)', 149, 51.43, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 51.43 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, matcha_id, 4);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);

    -- Product: Hot Spanish Latte (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Spanish Latte (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Spanish Latte (Large)', 149, 41.44, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 41.44 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 150);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 5);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, condense_id, 40);

    -- Product: Iced Cappuccino (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Cappuccino (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Cappuccino (Large)', 149, 55.90, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 55.90 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);

    -- Product: Iced Lychee (16 oz)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Lychee (16 oz)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_soda, 'Iced Lychee (16 oz)', 129, 32.66, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 129, cost = 32.66 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sprite_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 5);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, lychee_id, 30);

    -- Product: Iced Mocha (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Mocha (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Mocha (Large)', 149, 58.87, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 58.87 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, chocolate_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);

    -- Product: Iced White Chocolate Latte (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced White Chocolate Latte (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced White Chocolate Latte (Large)', 149, 70.63, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 70.63 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, chocolate_id, 40);

    -- Product: Iced Pink Guava (16 oz)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Pink Guava (16 oz)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_soda, 'Iced Pink Guava (16 oz)', 129, 38.66, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 129, cost = 38.66 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sprite_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 5);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, guava_id, 30);

    -- Product: Iced Mango (16 oz)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Mango (16 oz)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_soda, 'Iced Mango (16 oz)', 129, 38.66, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 129, cost = 38.66 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sprite_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 5);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, mango_id, 30);

    -- Product: Iced Pomegranate (16 oz)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Pomegranate (16 oz)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_soda, 'Iced Pomegranate (16 oz)', 129, 38.66, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 129, cost = 38.66 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sprite_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 5);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, pomegranate_id, 30);

    -- Product: Iced Lychee Tea (16 oz)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Lychee Tea (16 oz)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_tea, 'Iced Lychee Tea (16 oz)', 129, 47.80, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 129, cost = 47.80 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, jasmine_id, 6);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, lychee_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);

    -- Product: Hot Cappuccino (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Cappuccino (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Cappuccino (Large)', 149, 59.35, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 59.35 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);

    -- Product: Hot White Chocolate Latte (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot White Chocolate Latte (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot White Chocolate Latte (Large)', 149, 71.11, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 71.11 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 150);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, chocolate_id, 40);

    -- Product: Iced Americano (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Americano (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Americano (Small)', 105, 18.56, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 18.56 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);

    -- Product: Hot Jasmine Tea (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Jasmine Tea (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_tea, 'Hot Jasmine Tea (Small)', 99, 14.06, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 99, cost = 14.06 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, jasmine_id, 6);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 10);

    -- Product: Hot Black Tea (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Black Tea (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_tea, 'Hot Black Tea (Small)', 99, 10.78, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 99, cost = 10.78 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, black_id, 6);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 10);

    -- Product: Hot Americano (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Americano (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Americano (Small)', 105, 17.06, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 17.06 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);

    -- Product: Hot Mocha (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Mocha (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Mocha (Large)', 149, 62.72, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 62.72 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, chocolate_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 184);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);

    -- Product: Iced Pink Guava & Pomegranate Tea (16 oz)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Pink Guava & Pomegranate Tea (16 oz)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_tea, 'Iced Pink Guava & Pomegranate Tea (16 oz)', 129, 48.28, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 129, cost = 48.28 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, jasmine_id, 6);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, guava_id, 20);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, pomegranate_id, 20);

    -- Product: Iced Butterscotch (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Butterscotch (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Butterscotch (Large)', 149, 64.05, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 64.05 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 5);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, butterscotch_id, 40);

    -- Product: Iced Matcha Latte (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Matcha Latte (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_matcha, 'Iced Matcha Latte (Small)', 105, 25.15, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 25.15 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, matcha_id, 2.8);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 28);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 91);

    -- Product: Hot Latte (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Latte (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Latte (Large)', 149, 64.30, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 64.30 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 360);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);

    -- Product: Iced Macadamia Latte (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Macadamia Latte (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Macadamia Latte (Large)', 149, 65.93, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 65.93 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 15);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, macadamia_id, 40);

    -- Product: Iced French Vanilla (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced French Vanilla (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced French Vanilla (Large)', 149, 68.75, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 68.75 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 30);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, vanilla_id, 40);

    -- Product: Iced Pink Guava & Pomegranate (16 oz)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Pink Guava & Pomegranate (16 oz)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_soda, 'Iced Pink Guava & Pomegranate (16 oz)', 129, 46.16, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 129, cost = 46.16 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sprite_id, 120);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, guava_id, 20);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, pomegranate_id, 20);

    -- Product: Iced Pink Guava Tea (16 oz)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Pink Guava Tea (16 oz)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_tea, 'Iced Pink Guava Tea (16 oz)', 129, 55.80, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 129, cost = 55.80 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, jasmine_id, 6);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, guava_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);

    -- Product: Iced Mango Tea (16 oz)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Mango Tea (16 oz)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_tea, 'Iced Mango Tea (16 oz)', 129, 55.80, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 129, cost = 55.80 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, jasmine_id, 6);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, mango_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);

    -- Product: Iced Pomegranate Tea (16 oz)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Pomegranate Tea (16 oz)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_tea, 'Iced Pomegranate Tea (16 oz)', 129, 55.80, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 129, cost = 55.80 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, jasmine_id, 6);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, pomegranate_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);

    -- Product: Iced Caramel Macchiato (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Caramel Macchiato (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Caramel Macchiato (Large)', 149, 70.63, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 70.63 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, caramel_id, 40);

    -- Product: Iced Biscoff Matcha (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Biscoff Matcha (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_matcha, 'Iced Biscoff Matcha (Large)', 149, 69.39, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 69.39 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, matcha_id, 4);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, biscoff_id, 50);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 130);

    -- Product: Hot Butterscotch (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Butterscotch (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Butterscotch (Large)', 149, 64.53, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 64.53 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 150);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 5);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, butterscotch_id, 40);

    -- Product: Iced Matcha Seasalt (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Matcha Seasalt (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_matcha, 'Iced Matcha Seasalt (Small)', 105, 29.35, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 29.35 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, matcha_id, 2.8);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 28);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 91);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, cream_id, 21);

    -- Product: Hot Macadamia Latte (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Macadamia Latte (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Macadamia Latte (Large)', 149, 66.41, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 66.41 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 150);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 15);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, macadamia_id, 40);

    -- Product: Hot French Vanilla (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot French Vanilla (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot French Vanilla (Large)', 149, 69.23, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 69.23 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 150);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 30);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, vanilla_id, 40);

    -- Product: Hot Caramel Macchiato (Large)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Caramel Macchiato (Large)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Caramel Macchiato (Large)', 149, 71.11, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 149, cost = 71.11 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 18);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 150);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 40);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, caramel_id, 40);

    -- Product: Iced Dirty Matcha (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Dirty Matcha (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_matcha, 'Iced Dirty Matcha (Small)', 105, 37.50, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 37.50 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, matcha_id, 2.8);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 28);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 91);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);

    -- Product: Iced White Chocolate Matcha (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced White Chocolate Matcha (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_matcha, 'Iced White Chocolate Matcha (Small)', 105, 44.47, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 44.47 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, matcha_id, 2.8);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 28);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 91);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, chocolate_id, 28);

    -- Product: Iced Mocha (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Mocha (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Mocha (Small)', 105, 35.59, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 35.59 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, chocolate_id, 20);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 92);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);

    -- Product: Iced Latte (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Latte (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Latte (Small)', 105, 36.38, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 36.38 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);

    -- Product: Hot Mocha (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Mocha (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Mocha (Small)', 105, 34.09, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 34.09 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, chocolate_id, 20);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 92);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);

    -- Product: Hot Latte (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Latte (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Latte (Small)', 105, 34.88, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 34.88 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);

    -- Product: Iced Spanish Latte (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Spanish Latte (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Spanish Latte (Small)', 105, 36.94, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 36.94 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 5);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, condense_id, 30);

    -- Product: Hot Spanish Latte (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Spanish Latte (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Spanish Latte (Small)', 105, 35.44, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 35.44 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 5);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, condense_id, 30);

    -- Product: Iced Cappuccino (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Cappuccino (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Cappuccino (Small)', 105, 43.31, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 43.31 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 150);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 100);

    -- Product: Hot Cappuccino (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Cappuccino (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Cappuccino (Small)', 105, 41.81, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 41.81 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 150);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 100);

    -- Product: Iced White Chocolate Latte (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced White Chocolate Latte (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced White Chocolate Latte (Small)', 105, 57.08, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 57.08 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, chocolate_id, 30);

    -- Product: Hot White Chocolate Latte (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot White Chocolate Latte (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot White Chocolate Latte (Small)', 105, 55.58, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 55.58 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, chocolate_id, 30);

    -- Product: Iced Biscoff Matcha (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Biscoff Matcha (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_matcha, 'Iced Biscoff Matcha (Small)', 105, 50.08, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 50.08 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, matcha_id, 2.8);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, biscoff_id, 35);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 91);

    -- Product: Iced Butterscotch (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Butterscotch (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Butterscotch (Small)', 105, 54.26, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 54.26 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 5);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, butterscotch_id, 30);

    -- Product: Iced Macadamia Latte (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Macadamia Latte (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Macadamia Latte (Small)', 105, 57.08, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 57.08 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, macadamia_id, 30);

    -- Product: Iced French Vanilla (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced French Vanilla (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced French Vanilla (Small)', 105, 57.08, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 57.08 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, vanilla_id, 30);

    -- Product: Hot Butterscotch (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Butterscotch (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Butterscotch (Small)', 105, 52.76, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 52.76 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 5);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, butterscotch_id, 30);

    -- Product: Iced Caramel Macchiato (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Iced Caramel Macchiato (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_iced, 'Iced Caramel Macchiato (Small)', 105, 58.96, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 58.96 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 30);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, caramel_id, 30);

    -- Product: Hot Macadamia Latte (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Macadamia Latte (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Macadamia Latte (Small)', 105, 55.58, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 55.58 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, macadamia_id, 30);

    -- Product: Hot French Vanilla (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot French Vanilla (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot French Vanilla (Small)', 105, 55.58, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 55.58 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 20);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, vanilla_id, 30);

    -- Product: Hot Caramel Macchiato (Small)
    SELECT id INTO prod_id FROM public.products_espresso WHERE branch_id = 30 AND name = 'Hot Caramel Macchiato (Small)';
    IF prod_id IS NULL THEN
        INSERT INTO public.products_espresso (branch_id, category_id, name, price, cost, stock, is_active, is_sellable, unit)
        VALUES (30, cat_hot, 'Hot Caramel Macchiato (Small)', 105, 57.46, 9999, 1, 1, 'cups') RETURNING id INTO prod_id;
    ELSE
        UPDATE public.products_espresso SET price = 105, cost = 57.46 WHERE id = prod_id;
    END IF;
    DELETE FROM public.product_recipes WHERE product_id = prod_id;
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, beans_id, 10);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, milk_id, 180);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, sugar_id, 30);
    INSERT INTO public.product_recipes (product_id, ingredient_id, quantity) VALUES (prod_id, caramel_id, 30);

END $$;
