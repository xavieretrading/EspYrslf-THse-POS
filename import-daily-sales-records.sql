-- ==========================================================================
-- DAILY SALES RECORD & COMPLETE INVENTORY / RECIPE DEDUCTION SQL SCRIPT
-- Target Branch: Espresso Yourself & Tea House - Cebu City Branch (branch_id = 30)
-- Source File: recordsExcel/Daily_Sales_Record_Template.xlsx
--
-- Features:
-- 1. Creates paid orders in orders_espresso with historical dates (Aug 8 - 19, 2026).
-- 2. Inserts line items into order_items_espresso.
-- 3. Deducts Finished Product Stock in products_espresso.
-- 4. Deducts ALL Recipe Raw Materials / Ingredients (Concept Blend 1, Arla Milk, Syrups, etc.).
-- 5. Inserts audit transaction logs for all products & recipe ingredients in inventory_transactions_espresso.
-- 6. Updates Receipt Counter & Grand Accumulating Total (GAT).
-- ==========================================================================

DO $$
DECLARE
    v_order_id BIGINT;
BEGIN

    -- --------------------------------------------------------------------------
    -- Row 5: Hot americano (Hot 8 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2001, '2026-08-08 09:00:00+08', '2026-08-08 09:00:00+08', false, '[Imported Daily Sales: 2026-08-08]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 469, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-08 09:00:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 469;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        469, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Americano (Small)) - Log Date 2026-08-08', '2026-08-08 09:00:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.009 pack', '2026-08-08 09:00:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.02 bot', '2026-08-08 09:00:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 6: French Vanilla (Hot 8 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2002, '2026-08-08 09:05:00+08', '2026-08-08 09:05:00+08', false, '[Imported Daily Sales: 2026-08-08]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 489, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-08 09:05:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 489;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        489, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot French Vanilla (Small)) - Log Date 2026-08-08', '2026-08-08 09:05:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot French Vanilla (Small)) used 0.009 pack', '2026-08-08 09:05:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.18
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.18, 'Recipe Deduction: Order #' || v_order_id || ' (Hot French Vanilla (Small)) used 0.18 packs', '2026-08-08 09:05:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot French Vanilla (Small)) used 0.02 bot', '2026-08-08 09:05:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Vanilla 1L (Ingredient ID #432)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 432;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        432, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Hot French Vanilla (Small)) used 0.03 bot', '2026-08-08 09:05:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 7: Caffe Latte (Hot 8 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2003, '2026-08-08 09:10:00+08', '2026-08-08 09:10:00+08', false, '[Imported Daily Sales: 2026-08-08]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 477, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-08 09:10:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 477;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        477, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Latte (Small)) - Log Date 2026-08-08', '2026-08-08 09:10:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.009 pack', '2026-08-08 09:10:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.18
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.18, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.18 packs', '2026-08-08 09:10:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.02 bot', '2026-08-08 09:10:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 8: Macadamia (Hot 8 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2004, '2026-08-08 09:15:00+08', '2026-08-08 09:15:00+08', false, '[Imported Daily Sales: 2026-08-08]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 481, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-08 09:15:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 481;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        481, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Macadamia Latte (Small)) - Log Date 2026-08-08', '2026-08-08 09:15:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Macadamia Latte (Small)) used 0.009 pack', '2026-08-08 09:15:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.18
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.18, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Macadamia Latte (Small)) used 0.18 packs', '2026-08-08 09:15:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Macadamia Latte (Small)) used 0.02 bot', '2026-08-08 09:15:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Macadamia 1L (Ingredient ID #430)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 430;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        430, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Macadamia Latte (Small)) used 0.03 bot', '2026-08-08 09:15:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 9: Iced Macadamia (Cold 16 oz) | Date: 2026-08-08 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2005, '2026-08-08 10:20:00+08', '2026-08-08 10:20:00+08', false, '[Imported Daily Sales: 2026-08-08]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 484, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-08 10:20:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 484;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        484, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) - Log Date 2026-08-08', '2026-08-08 10:20:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.018 pack', '2026-08-08 10:20:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.13
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.13, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.13 packs', '2026-08-08 10:20:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.015
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.015, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.015 bot', '2026-08-08 10:20:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Macadamia 1L (Ingredient ID #430)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 430;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        430, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.04 bot', '2026-08-08 10:20:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 10: Iced Irish Cream (Cold 16 oz) | Date: 2026-08-08 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2006, '2026-08-08 10:25:00+08', '2026-08-08 10:25:00+08', false, '[Imported Daily Sales: 2026-08-08]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 585, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-08 10:25:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 585;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        585, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Irish Cream) - Log Date 2026-08-08', '2026-08-08 10:25:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 11: Lychee Soda (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2007, '2026-08-08 10:30:00+08', '2026-08-08 10:30:00+08', false, '[Imported Daily Sales: 2026-08-08]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 512, 1, 99, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-08 10:30:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 512;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        512, 'out', 1, 'Sales Order #' || v_order_id || ' (Lychee (16 oz)) - Log Date 2026-08-08', '2026-08-08 10:30:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.0866667
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.0866667, 'Recipe Deduction: Order #' || v_order_id || ' (Lychee (16 oz)) used 0.0866667 bottles', '2026-08-08 10:30:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Lychee (16 oz)) used 0.005 bot', '2026-08-08 10:30:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Lychee 1L (Ingredient ID #429)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 429;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        429, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Lychee (16 oz)) used 0.03 bot', '2026-08-08 10:30:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 12: Pink Guava (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2008, '2026-08-08 10:35:00+08', '2026-08-08 10:35:00+08', false, '[Imported Daily Sales: 2026-08-08]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 509, 1, 99, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-08 10:35:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 509;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        509, 'out', 1, 'Sales Order #' || v_order_id || ' (Pink Guava (16 oz)) - Log Date 2026-08-08', '2026-08-08 10:35:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.0866667
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.0866667, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava (16 oz)) used 0.0866667 bottles', '2026-08-08 10:35:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava (16 oz)) used 0.005 bot', '2026-08-08 10:35:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Pink Guava 1L (Ingredient ID #426)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 426;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        426, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava (16 oz)) used 0.03 bot', '2026-08-08 10:35:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 13: pink guava (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2009, '2026-08-08 11:40:00+08', '2026-08-08 11:40:00+08', false, '[Imported Daily Sales: 2026-08-08]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 509, 1, 99, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-08 11:40:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 509;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        509, 'out', 1, 'Sales Order #' || v_order_id || ' (Pink Guava (16 oz)) - Log Date 2026-08-08', '2026-08-08 11:40:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.0866667
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.0866667, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava (16 oz)) used 0.0866667 bottles', '2026-08-08 11:40:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava (16 oz)) used 0.005 bot', '2026-08-08 11:40:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Pink Guava 1L (Ingredient ID #426)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 426;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        426, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava (16 oz)) used 0.03 bot', '2026-08-08 11:40:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 14: Mango (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2010, '2026-08-08 11:45:00+08', '2026-08-08 11:45:00+08', false, '[Imported Daily Sales: 2026-08-08]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 510, 1, 99, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-08 11:45:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 510;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        510, 'out', 1, 'Sales Order #' || v_order_id || ' (Mango (16 oz)) - Log Date 2026-08-08', '2026-08-08 11:45:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.0866667
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.0866667, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.0866667 bottles', '2026-08-08 11:45:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.005 bot', '2026-08-08 11:45:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Mango 1L (Ingredient ID #427)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 427;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        427, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.03 bot', '2026-08-08 11:45:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 15: Pink Guava (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2011, '2026-08-08 11:50:00+08', '2026-08-08 11:50:00+08', false, '[Imported Daily Sales: 2026-08-08]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 509, 1, 99, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-08 11:50:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 509;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        509, 'out', 1, 'Sales Order #' || v_order_id || ' (Pink Guava (16 oz)) - Log Date 2026-08-08', '2026-08-08 11:50:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.0866667
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.0866667, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava (16 oz)) used 0.0866667 bottles', '2026-08-08 11:50:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava (16 oz)) used 0.005 bot', '2026-08-08 11:50:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Pink Guava 1L (Ingredient ID #426)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 426;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        426, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava (16 oz)) used 0.03 bot', '2026-08-08 11:50:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 16: Mango (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2012, '2026-08-08 11:55:00+08', '2026-08-08 11:55:00+08', false, '[Imported Daily Sales: 2026-08-08]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 510, 1, 99, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-08 11:55:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 510;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        510, 'out', 1, 'Sales Order #' || v_order_id || ' (Mango (16 oz)) - Log Date 2026-08-08', '2026-08-08 11:55:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.0866667
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.0866667, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.0866667 bottles', '2026-08-08 11:55:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.005 bot', '2026-08-08 11:55:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Mango 1L (Ingredient ID #427)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 427;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        427, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.03 bot', '2026-08-08 11:55:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 17: Mango (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2013, '2026-08-08 12:00:00+08', '2026-08-08 12:00:00+08', false, '[Imported Daily Sales: 2026-08-08]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 510, 1, 99, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-08 12:00:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 510;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        510, 'out', 1, 'Sales Order #' || v_order_id || ' (Mango (16 oz)) - Log Date 2026-08-08', '2026-08-08 12:00:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.0866667
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.0866667, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.0866667 bottles', '2026-08-08 12:00:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.005 bot', '2026-08-08 12:00:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Mango 1L (Ingredient ID #427)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 427;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        427, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.03 bot', '2026-08-08 12:00:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 18: Spanish latte (Hot 8 oz) | Date: 2026-08-09 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2014, '2026-08-09 12:05:00+08', '2026-08-09 12:05:00+08', false, '[Imported Daily Sales: 2026-08-09]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 497, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-09 12:05:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 497;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        497, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Spanish Latte (Small)) - Log Date 2026-08-09', '2026-08-09 12:05:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Spanish Latte (Small)) used 0.009 pack', '2026-08-09 12:05:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.18
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.18, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Spanish Latte (Small)) used 0.18 packs', '2026-08-09 12:05:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Spanish Latte (Small)) used 0.005 bot', '2026-08-09 12:05:00+08'
    );

    -- Deduct Recipe Raw Material: Doreen Condense Milk 390G (Ingredient ID #425)
    UPDATE public.products_espresso
    SET stock = stock - 0.0769231
    WHERE id = 425;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        425, 'out', 0.0769231, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Spanish Latte (Small)) used 0.0769231 can', '2026-08-09 12:05:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 19: Iced Latte (Cold 16 oz) | Date: 2026-08-09 | Price: ₱298 | Qty: 2
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 596, NULL, 0,
        63.8571, 0, 596, 'cash', 596, 0,
        2015, '2026-08-09 12:10:00+08', '2026-08-09 12:10:00+08', false, '[Imported Daily Sales: 2026-08-09]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 480, 2, 298, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-09 12:10:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 2
    WHERE id = 480;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        480, 'out', 2, 'Sales Order #' || v_order_id || ' (Iced Latte (Large)) - Log Date 2026-08-09', '2026-08-09 12:10:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.036
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.036, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Latte (Large)) used 0.036 pack', '2026-08-09 12:10:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.3
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.3, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Latte (Large)) used 0.3 packs', '2026-08-09 12:10:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.08
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.08, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Latte (Large)) used 0.08 bot', '2026-08-09 12:10:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 20: Hot Choco (Hot 8 oz) | Date: 2026-08-10 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2016, '2026-08-10 12:15:00+08', '2026-08-10 12:15:00+08', false, '[Imported Daily Sales: 2026-08-10]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 578, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-10 12:15:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 578;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        578, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Choco (Small)) - Log Date 2026-08-10', '2026-08-10 12:15:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 21: Hot Latte (Hot 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2017, '2026-08-10 13:20:00+08', '2026-08-10 13:20:00+08', false, '[Imported Daily Sales: 2026-08-10]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 478, 1, 149, 'ordered', '[TAKEOUT] [Hot] [16 oz]', '2026-08-10 13:20:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 478;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        478, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Latte (Large)) - Log Date 2026-08-10', '2026-08-10 13:20:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Large)) used 0.018 pack', '2026-08-10 13:20:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.36
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.36, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Large)) used 0.36 packs', '2026-08-10 13:20:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Large)) used 0.04 bot', '2026-08-10 13:20:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 22: Hot Mocha (Hot 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2018, '2026-08-10 13:25:00+08', '2026-08-10 13:25:00+08', false, '[Imported Daily Sales: 2026-08-10]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 474, 1, 149, 'ordered', '[TAKEOUT] [Hot] [16 oz]', '2026-08-10 13:25:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 474;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        474, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Mocha (Large)) - Log Date 2026-08-10', '2026-08-10 13:25:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Mocha (Large)) used 0.018 pack', '2026-08-10 13:25:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.184
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.184, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Mocha (Large)) used 0.184 packs', '2026-08-10 13:25:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Mocha (Large)) used 0.04 bot', '2026-08-10 13:25:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 23: Pomegranate x Pink Guava (Cold 16 oz) | Date: 2026-08-10 | Price: ₱198 | Qty: 2
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 396, NULL, 0,
        42.4286, 0, 396, 'cash', 396, 0,
        2019, '2026-08-10 13:30:00+08', '2026-08-10 13:30:00+08', false, '[Imported Daily Sales: 2026-08-10]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 513, 2, 198, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-10 13:30:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 2
    WHERE id = 513;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        513, 'out', 2, 'Sales Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) - Log Date 2026-08-10', '2026-08-10 13:30:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.16
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.16, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) used 0.16 bottles', '2026-08-10 13:30:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) used 0 bot', '2026-08-10 13:30:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Pink Guava 1L (Ingredient ID #426)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 426;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        426, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) used 0.04 bot', '2026-08-10 13:30:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Pomegranate 1L (Ingredient ID #428)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 428;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        428, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) used 0.04 bot', '2026-08-10 13:30:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 24: Macadamia (Hot 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2020, '2026-08-10 13:35:00+08', '2026-08-10 13:35:00+08', false, '[Imported Daily Sales: 2026-08-10]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 482, 1, 149, 'ordered', '[TAKEOUT] [Hot] [16 oz]', '2026-08-10 13:35:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 482;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        482, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Macadamia Latte (Large)) - Log Date 2026-08-10', '2026-08-10 13:35:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Macadamia Latte (Large)) used 0.018 pack', '2026-08-10 13:35:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.15
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.15, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Macadamia Latte (Large)) used 0.15 packs', '2026-08-10 13:35:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.015
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.015, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Macadamia Latte (Large)) used 0.015 bot', '2026-08-10 13:35:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Macadamia 1L (Ingredient ID #430)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 430;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        430, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Macadamia Latte (Large)) used 0.04 bot', '2026-08-10 13:35:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 25: Americano (Cold 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2021, '2026-08-10 14:40:00+08', '2026-08-10 14:40:00+08', false, '[Imported Daily Sales: 2026-08-10]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 472, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-10 14:40:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 472;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        472, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Americano) - Log Date 2026-08-10', '2026-08-10 14:40:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Americano) used 0.018 pack', '2026-08-10 14:40:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 26: Macadamia (Cold 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2022, '2026-08-10 14:45:00+08', '2026-08-10 14:45:00+08', false, '[Imported Daily Sales: 2026-08-10]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 484, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-10 14:45:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 484;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        484, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) - Log Date 2026-08-10', '2026-08-10 14:45:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.018 pack', '2026-08-10 14:45:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.13
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.13, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.13 packs', '2026-08-10 14:45:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.015
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.015, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.015 bot', '2026-08-10 14:45:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Macadamia 1L (Ingredient ID #430)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 430;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        430, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.04 bot', '2026-08-10 14:45:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 27: Spanish Latte (Cold 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2023, '2026-08-10 14:50:00+08', '2026-08-10 14:50:00+08', false, '[Imported Daily Sales: 2026-08-10]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 500, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-10 14:50:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 500;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        500, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Spanish Latte) - Log Date 2026-08-10', '2026-08-10 14:50:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.018 pack', '2026-08-10 14:50:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.13
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.13, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.13 packs', '2026-08-10 14:50:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.005 bot', '2026-08-10 14:50:00+08'
    );

    -- Deduct Recipe Raw Material: Doreen Condense Milk 390G (Ingredient ID #425)
    UPDATE public.products_espresso
    SET stock = stock - 0.102564
    WHERE id = 425;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        425, 'out', 0.102564, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.102564 can', '2026-08-10 14:50:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 28: Macadamia (Cold 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2024, '2026-08-10 14:55:00+08', '2026-08-10 14:55:00+08', false, '[Imported Daily Sales: 2026-08-10]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 484, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-10 14:55:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 484;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        484, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) - Log Date 2026-08-10', '2026-08-10 14:55:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.018 pack', '2026-08-10 14:55:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.13
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.13, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.13 packs', '2026-08-10 14:55:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.015
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.015, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.015 bot', '2026-08-10 14:55:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Macadamia 1L (Ingredient ID #430)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 430;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        430, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.04 bot', '2026-08-10 14:55:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 29: Mango Soda (Cold 16 oz) | Date: 2026-08-10 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2025, '2026-08-10 15:00:00+08', '2026-08-10 15:00:00+08', false, '[Imported Daily Sales: 2026-08-10]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 510, 1, 99, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-10 15:00:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 510;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        510, 'out', 1, 'Sales Order #' || v_order_id || ' (Mango (16 oz)) - Log Date 2026-08-10', '2026-08-10 15:00:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.0866667
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.0866667, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.0866667 bottles', '2026-08-10 15:00:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.005 bot', '2026-08-10 15:00:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Mango 1L (Ingredient ID #427)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 427;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        427, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.03 bot', '2026-08-10 15:00:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 30: Americano (Hot 8 oz) | Date: 2026-08-11 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2026, '2026-08-11 15:05:00+08', '2026-08-11 15:05:00+08', false, '[Imported Daily Sales: 2026-08-11]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 469, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-11 15:05:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 469;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        469, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Americano (Small)) - Log Date 2026-08-11', '2026-08-11 15:05:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.009 pack', '2026-08-11 15:05:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.02 bot', '2026-08-11 15:05:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 31: Americano (Hot 8 oz) | Date: 2026-08-11 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2027, '2026-08-11 15:10:00+08', '2026-08-11 15:10:00+08', false, '[Imported Daily Sales: 2026-08-11]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 469, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-11 15:10:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 469;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        469, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Americano (Small)) - Log Date 2026-08-11', '2026-08-11 15:10:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.009 pack', '2026-08-11 15:10:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.02 bot', '2026-08-11 15:10:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 32: Americano (Hot 8 oz) | Date: 2026-08-11 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2028, '2026-08-11 15:15:00+08', '2026-08-11 15:15:00+08', false, '[Imported Daily Sales: 2026-08-11]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 469, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-11 15:15:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 469;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        469, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Americano (Small)) - Log Date 2026-08-11', '2026-08-11 15:15:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.009 pack', '2026-08-11 15:15:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.02 bot', '2026-08-11 15:15:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 33: Americano (Cold 16 oz) | Date: 2026-08-11 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2029, '2026-08-11 16:20:00+08', '2026-08-11 16:20:00+08', false, '[Imported Daily Sales: 2026-08-11]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 472, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-11 16:20:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 472;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        472, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Americano) - Log Date 2026-08-11', '2026-08-11 16:20:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Americano) used 0.018 pack', '2026-08-11 16:20:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 34: Latte (Hot 8 oz) | Date: 2026-08-11 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2030, '2026-08-11 16:25:00+08', '2026-08-11 16:25:00+08', false, '[Imported Daily Sales: 2026-08-11]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 477, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-11 16:25:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 477;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        477, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Latte (Small)) - Log Date 2026-08-11', '2026-08-11 16:25:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.009 pack', '2026-08-11 16:25:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.18
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.18, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.18 packs', '2026-08-11 16:25:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.02 bot', '2026-08-11 16:25:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 35: Spanish Latte (Cold 16 oz) | Date: 2026-08-11 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2031, '2026-08-11 16:30:00+08', '2026-08-11 16:30:00+08', false, '[Imported Daily Sales: 2026-08-11]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 500, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-11 16:30:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 500;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        500, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Spanish Latte) - Log Date 2026-08-11', '2026-08-11 16:30:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.018 pack', '2026-08-11 16:30:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.13
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.13, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.13 packs', '2026-08-11 16:30:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.005 bot', '2026-08-11 16:30:00+08'
    );

    -- Deduct Recipe Raw Material: Doreen Condense Milk 390G (Ingredient ID #425)
    UPDATE public.products_espresso
    SET stock = stock - 0.102564
    WHERE id = 425;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        425, 'out', 0.102564, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.102564 can', '2026-08-11 16:30:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 36: Latte (Hot 16 oz) | Date: 2026-08-11 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2032, '2026-08-11 16:35:00+08', '2026-08-11 16:35:00+08', false, '[Imported Daily Sales: 2026-08-11]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 478, 1, 149, 'ordered', '[TAKEOUT] [Hot] [16 oz]', '2026-08-11 16:35:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 478;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        478, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Latte (Large)) - Log Date 2026-08-11', '2026-08-11 16:35:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Large)) used 0.018 pack', '2026-08-11 16:35:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.36
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.36, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Large)) used 0.36 packs', '2026-08-11 16:35:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Large)) used 0.04 bot', '2026-08-11 16:35:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 37: Spanish Latte (Hot 8 oz) | Date: 2026-08-11 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2033, '2026-08-11 17:40:00+08', '2026-08-11 17:40:00+08', false, '[Imported Daily Sales: 2026-08-11]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 497, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-11 17:40:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 497;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        497, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Spanish Latte (Small)) - Log Date 2026-08-11', '2026-08-11 17:40:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Spanish Latte (Small)) used 0.009 pack', '2026-08-11 17:40:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.18
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.18, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Spanish Latte (Small)) used 0.18 packs', '2026-08-11 17:40:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Spanish Latte (Small)) used 0.005 bot', '2026-08-11 17:40:00+08'
    );

    -- Deduct Recipe Raw Material: Doreen Condense Milk 390G (Ingredient ID #425)
    UPDATE public.products_espresso
    SET stock = stock - 0.0769231
    WHERE id = 425;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        425, 'out', 0.0769231, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Spanish Latte (Small)) used 0.0769231 can', '2026-08-11 17:40:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 38: Pomegranate x Pink Guava (Cold 16 oz) | Date: 2026-08-11 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2034, '2026-08-11 17:45:00+08', '2026-08-11 17:45:00+08', false, '[Imported Daily Sales: 2026-08-11]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 513, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-11 17:45:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 513;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        513, 'out', 1, 'Sales Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) - Log Date 2026-08-11', '2026-08-11 17:45:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.08
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.08, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) used 0.08 bottles', '2026-08-11 17:45:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) used 0 bot', '2026-08-11 17:45:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Pink Guava 1L (Ingredient ID #426)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 426;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        426, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) used 0.02 bot', '2026-08-11 17:45:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Pomegranate 1L (Ingredient ID #428)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 428;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        428, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) used 0.02 bot', '2026-08-11 17:45:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 39: Macadamia (Cold 16 oz) | Date: 2026-08-12 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2035, '2026-08-12 17:50:00+08', '2026-08-12 17:50:00+08', false, '[Imported Daily Sales: 2026-08-12]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 484, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-12 17:50:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 484;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        484, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) - Log Date 2026-08-12', '2026-08-12 17:50:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.018 pack', '2026-08-12 17:50:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.13
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.13, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.13 packs', '2026-08-12 17:50:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.015
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.015, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.015 bot', '2026-08-12 17:50:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Macadamia 1L (Ingredient ID #430)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 430;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        430, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.04 bot', '2026-08-12 17:50:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 40: Pomegranate (Cold 16 oz) | Date: 2026-08-12 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2036, '2026-08-12 17:55:00+08', '2026-08-12 17:55:00+08', false, '[Imported Daily Sales: 2026-08-12]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 511, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-12 17:55:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 511;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        511, 'out', 1, 'Sales Order #' || v_order_id || ' (Pomegranate (16 oz)) - Log Date 2026-08-12', '2026-08-12 17:55:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.0866667
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.0866667, 'Recipe Deduction: Order #' || v_order_id || ' (Pomegranate (16 oz)) used 0.0866667 bottles', '2026-08-12 17:55:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Pomegranate (16 oz)) used 0.005 bot', '2026-08-12 17:55:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Pomegranate 1L (Ingredient ID #428)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 428;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        428, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Pomegranate (16 oz)) used 0.03 bot', '2026-08-12 17:55:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 41: Pomegranate x Pink Guava (Cold 16 oz) | Date: 2026-08-12 | Price: ₱129 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 129, NULL, 0,
        13.8214, 0, 129, 'cash', 129, 0,
        2037, '2026-08-12 18:00:00+08', '2026-08-12 18:00:00+08', false, '[Imported Daily Sales: 2026-08-12]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 513, 1, 129, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-12 18:00:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 513;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        513, 'out', 1, 'Sales Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) - Log Date 2026-08-12', '2026-08-12 18:00:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.08
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.08, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) used 0.08 bottles', '2026-08-12 18:00:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) used 0 bot', '2026-08-12 18:00:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Pink Guava 1L (Ingredient ID #426)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 426;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        426, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) used 0.02 bot', '2026-08-12 18:00:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Pomegranate 1L (Ingredient ID #428)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 428;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        428, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava & Pomegranate (16 oz)) used 0.02 bot', '2026-08-12 18:00:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 42: Latte (Hot 8 oz) | Date: 2026-08-12 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        2038, '2026-08-12 18:05:00+08', '2026-08-12 18:05:00+08', false, '[Imported Daily Sales: 2026-08-12]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 477, 1, 105, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-12 18:05:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 477;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        477, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Latte (Small)) - Log Date 2026-08-12', '2026-08-12 18:05:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.009 pack', '2026-08-12 18:05:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.18
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.18, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.18 packs', '2026-08-12 18:05:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.02 bot', '2026-08-12 18:05:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 43: Spanish Latte (Cold 16 oz) | Date: 2026-08-12 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2039, '2026-08-12 18:10:00+08', '2026-08-12 18:10:00+08', false, '[Imported Daily Sales: 2026-08-12]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 500, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-12 18:10:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 500;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        500, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Spanish Latte) - Log Date 2026-08-12', '2026-08-12 18:10:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.018 pack', '2026-08-12 18:10:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.13
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.13, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.13 packs', '2026-08-12 18:10:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.005 bot', '2026-08-12 18:10:00+08'
    );

    -- Deduct Recipe Raw Material: Doreen Condense Milk 390G (Ingredient ID #425)
    UPDATE public.products_espresso
    SET stock = stock - 0.102564
    WHERE id = 425;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        425, 'out', 0.102564, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.102564 can', '2026-08-12 18:10:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 44: irish cream (Cold 16 oz) | Date: 2026-08-12 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2040, '2026-08-12 18:15:00+08', '2026-08-12 18:15:00+08', false, '[Imported Daily Sales: 2026-08-12]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 585, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-12 18:15:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 585;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        585, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Irish Cream) - Log Date 2026-08-12', '2026-08-12 18:15:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 45: Latte (Hot 8 oz) | Date: 2026-08-13 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        2041, '2026-08-13 09:20:00+08', '2026-08-13 09:20:00+08', false, '[Imported Daily Sales: 2026-08-13]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 477, 1, 105, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-13 09:20:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 477;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        477, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Latte (Small)) - Log Date 2026-08-13', '2026-08-13 09:20:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.009 pack', '2026-08-13 09:20:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.18
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.18, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.18 packs', '2026-08-13 09:20:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.02 bot', '2026-08-13 09:20:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 46: Americano (Cold 16 oz) | Date: 2026-08-13 | Price: ₱240 | Qty: 2
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 480, NULL, 0,
        51.4286, 0, 480, 'cash', 480, 0,
        2042, '2026-08-13 09:25:00+08', '2026-08-13 09:25:00+08', false, '[Imported Daily Sales: 2026-08-13]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 472, 2, 240, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-13 09:25:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 2
    WHERE id = 472;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        472, 'out', 2, 'Sales Order #' || v_order_id || ' (Iced Americano) - Log Date 2026-08-13', '2026-08-13 09:25:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.036
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.036, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Americano) used 0.036 pack', '2026-08-13 09:25:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 47: Americano (Cold 16 oz) | Date: 2026-08-13 | Price: ₱120 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 120, NULL, 0,
        12.8571, 0, 120, 'cash', 120, 0,
        2043, '2026-08-13 09:30:00+08', '2026-08-13 09:30:00+08', false, '[Imported Daily Sales: 2026-08-13]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 472, 1, 120, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-13 09:30:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 472;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        472, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Americano) - Log Date 2026-08-13', '2026-08-13 09:30:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Americano) used 0.018 pack', '2026-08-13 09:30:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 48: Spanish Latte (Hot 8 oz) | Date: 2026-08-13 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        2044, '2026-08-13 09:35:00+08', '2026-08-13 09:35:00+08', false, '[Imported Daily Sales: 2026-08-13]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 497, 1, 105, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-13 09:35:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 497;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        497, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Spanish Latte (Small)) - Log Date 2026-08-13', '2026-08-13 09:35:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Spanish Latte (Small)) used 0.009 pack', '2026-08-13 09:35:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.18
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.18, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Spanish Latte (Small)) used 0.18 packs', '2026-08-13 09:35:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Spanish Latte (Small)) used 0.005 bot', '2026-08-13 09:35:00+08'
    );

    -- Deduct Recipe Raw Material: Doreen Condense Milk 390G (Ingredient ID #425)
    UPDATE public.products_espresso
    SET stock = stock - 0.0769231
    WHERE id = 425;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        425, 'out', 0.0769231, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Spanish Latte (Small)) used 0.0769231 can', '2026-08-13 09:35:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 49: Cappucino (Hot 8 oz) | Date: 2026-08-14 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        2045, '2026-08-14 10:40:00+08', '2026-08-14 10:40:00+08', false, '[Imported Daily Sales: 2026-08-14]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 501, 1, 105, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-14 10:40:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 501;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        501, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Cappuccino (Small)) - Log Date 2026-08-14', '2026-08-14 10:40:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Cappuccino (Small)) used 0.009 pack', '2026-08-14 10:40:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.25
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.25, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Cappuccino (Small)) used 0.25 packs', '2026-08-14 10:40:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Cappuccino (Small)) used 0.02 bot', '2026-08-14 10:40:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 50: Pomegranate Tea (Cold 16 oz) | Date: 2026-08-14 | Price: ₱129 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 129, NULL, 0,
        13.8214, 0, 129, 'cash', 129, 0,
        2046, '2026-08-14 10:45:00+08', '2026-08-14 10:45:00+08', false, '[Imported Daily Sales: 2026-08-14]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 517, 1, 129, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-14 10:45:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 517;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        517, 'out', 1, 'Sales Order #' || v_order_id || ' (Pomegranate Tea (16 oz)) - Log Date 2026-08-14', '2026-08-14 10:45:00+08'
    );

    -- Deduct Recipe Raw Material: Jasmine Tea Leaves 1kg (Ingredient ID #463)
    UPDATE public.products_espresso
    SET stock = stock - 0.006
    WHERE id = 463;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        463, 'out', 0.006, 'Recipe Deduction: Order #' || v_order_id || ' (Pomegranate Tea (16 oz)) used 0.006 pack', '2026-08-14 10:45:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Pomegranate 1L (Ingredient ID #428)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 428;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        428, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Pomegranate Tea (16 oz)) used 0.04 bot', '2026-08-14 10:45:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Pomegranate Tea (16 oz)) used 0.04 bot', '2026-08-14 10:45:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 51: latte (Hot 8 oz) | Date: 2026-08-14 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        2047, '2026-08-14 10:50:00+08', '2026-08-14 10:50:00+08', false, '[Imported Daily Sales: 2026-08-14]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 477, 1, 105, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-14 10:50:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 477;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        477, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Latte (Small)) - Log Date 2026-08-14', '2026-08-14 10:50:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.009 pack', '2026-08-14 10:50:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.18
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.18, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.18 packs', '2026-08-14 10:50:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Latte (Small)) used 0.02 bot', '2026-08-14 10:50:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 52: Black tea (Hot 16 oz) | Date: 2026-08-14 | Price: ₱129 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 129, NULL, 0,
        13.8214, 0, 129, 'cash', 129, 0,
        2048, '2026-08-14 10:55:00+08', '2026-08-14 10:55:00+08', false, '[Imported Daily Sales: 2026-08-14]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 588, 1, 129, 'ordered', '[TAKEOUT] [Hot] [16 oz]', '2026-08-14 10:55:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 588;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        588, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Black Tea (Large)) - Log Date 2026-08-14', '2026-08-14 10:55:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 53: Cappucino (Hot 8 oz) | Date: 2026-08-14 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        2049, '2026-08-14 11:00:00+08', '2026-08-14 11:00:00+08', false, '[Imported Daily Sales: 2026-08-14]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 501, 1, 105, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-14 11:00:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 501;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        501, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Cappuccino (Small)) - Log Date 2026-08-14', '2026-08-14 11:00:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Cappuccino (Small)) used 0.009 pack', '2026-08-14 11:00:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.25
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.25, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Cappuccino (Small)) used 0.25 packs', '2026-08-14 11:00:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Cappuccino (Small)) used 0.02 bot', '2026-08-14 11:00:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 54: Pink Guava (Cold 16 oz) | Date: 2026-08-14 | Price: ₱129 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 129, NULL, 0,
        13.8214, 0, 129, 'cash', 129, 0,
        2050, '2026-08-14 11:05:00+08', '2026-08-14 11:05:00+08', false, '[Imported Daily Sales: 2026-08-14]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 509, 1, 129, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-14 11:05:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 509;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        509, 'out', 1, 'Sales Order #' || v_order_id || ' (Pink Guava (16 oz)) - Log Date 2026-08-14', '2026-08-14 11:05:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.0866667
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.0866667, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava (16 oz)) used 0.0866667 bottles', '2026-08-14 11:05:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava (16 oz)) used 0.005 bot', '2026-08-14 11:05:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Pink Guava 1L (Ingredient ID #426)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 426;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        426, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Pink Guava (16 oz)) used 0.03 bot', '2026-08-14 11:05:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 55: Black Tea (Hot 8 oz) | Date: 2026-08-14 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2051, '2026-08-14 11:10:00+08', '2026-08-14 11:10:00+08', false, '[Imported Daily Sales: 2026-08-14]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 520, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-14 11:10:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 520;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        520, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Black Tea (Small)) - Log Date 2026-08-14', '2026-08-14 11:10:00+08'
    );

    -- Deduct Recipe Raw Material: Black Tea Leaves 1kg (Ingredient ID #464)
    UPDATE public.products_espresso
    SET stock = stock - 0.006
    WHERE id = 464;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        464, 'out', 0.006, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Black Tea (Small)) used 0.006 pack', '2026-08-14 11:10:00+08'
    );

    -- Deduct Recipe Raw Material: Lemon Fruit (Ingredient ID #647)
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 647;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        647, 'out', 1, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Black Tea (Small)) used 1 pieces', '2026-08-14 11:10:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.01
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.01, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Black Tea (Small)) used 0.01 bot', '2026-08-14 11:10:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 56: Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-14 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2052, '2026-08-14 11:15:00+08', '2026-08-14 11:15:00+08', false, '[Imported Daily Sales: 2026-08-14]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 583, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-14 11:15:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 583;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        583, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Sea Salt Biscoff) - Log Date 2026-08-14', '2026-08-14 11:15:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 57: Mocha + Oat Milk (Cold 16 oz) | Date: 2026-08-14 | Price: ₱199 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 199, NULL, 0,
        21.3214, 0, 199, 'cash', 199, 0,
        2053, '2026-08-14 12:20:00+08', '2026-08-14 12:20:00+08', false, '[Imported Daily Sales: 2026-08-14]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 476, 1, 199, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-14 12:20:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 476;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        476, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Mocha) - Log Date 2026-08-14', '2026-08-14 12:20:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Mocha) used 0.018 pack', '2026-08-14 12:20:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.13
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.13, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Mocha) used 0.13 packs', '2026-08-14 12:20:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Mocha) used 0.04 bot', '2026-08-14 12:20:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 58: Mango Soda (Cold 16 oz) | Date: 2026-08-14 | Price: ₱129 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 129, NULL, 0,
        13.8214, 0, 129, 'cash', 129, 0,
        2054, '2026-08-14 12:25:00+08', '2026-08-14 12:25:00+08', false, '[Imported Daily Sales: 2026-08-14]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 510, 1, 129, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-14 12:25:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 510;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        510, 'out', 1, 'Sales Order #' || v_order_id || ' (Mango (16 oz)) - Log Date 2026-08-14', '2026-08-14 12:25:00+08'
    );

    -- Deduct Recipe Raw Material: Sprite 1.5L (Ingredient ID #439)
    UPDATE public.products_espresso
    SET stock = stock - 0.0866667
    WHERE id = 439;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        439, 'out', 0.0866667, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.0866667 bottles', '2026-08-14 12:25:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.005 bot', '2026-08-14 12:25:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Mango 1L (Ingredient ID #427)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 427;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        427, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Mango (16 oz)) used 0.03 bot', '2026-08-14 12:25:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 59: White Chocolate Latte (Hot 16 oz) | Date: 2026-08-15 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2055, '2026-08-15 12:30:00+08', '2026-08-15 12:30:00+08', false, '[Imported Daily Sales: 2026-08-15]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 579, 1, 149, 'ordered', '[TAKEOUT] [Hot] [16 oz]', '2026-08-15 12:30:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 579;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        579, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Choco (Large)) - Log Date 2026-08-15', '2026-08-15 12:30:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 60: Macadamia (Hot 16 oz) | Date: 2026-08-15 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2056, '2026-08-15 12:35:00+08', '2026-08-15 12:35:00+08', false, '[Imported Daily Sales: 2026-08-15]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 482, 1, 149, 'ordered', '[TAKEOUT] [Hot] [16 oz]', '2026-08-15 12:35:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 482;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        482, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Macadamia Latte (Large)) - Log Date 2026-08-15', '2026-08-15 12:35:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Macadamia Latte (Large)) used 0.018 pack', '2026-08-15 12:35:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.15
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.15, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Macadamia Latte (Large)) used 0.15 packs', '2026-08-15 12:35:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.015
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.015, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Macadamia Latte (Large)) used 0.015 bot', '2026-08-15 12:35:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Macadamia 1L (Ingredient ID #430)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 430;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        430, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Macadamia Latte (Large)) used 0.04 bot', '2026-08-15 12:35:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 61: Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-17 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2057, '2026-08-17 13:40:00+08', '2026-08-17 13:40:00+08', false, '[Imported Daily Sales: 2026-08-17]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 583, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-17 13:40:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 583;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        583, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Sea Salt Biscoff) - Log Date 2026-08-17', '2026-08-17 13:40:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 62: Seasalt Matcha (Cold 16 oz) | Date: 2026-08-17 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2058, '2026-08-17 13:45:00+08', '2026-08-17 13:45:00+08', false, '[Imported Daily Sales: 2026-08-17]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 522, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-17 13:45:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 522;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        522, 'out', 1, 'Sales Order #' || v_order_id || ' (Matcha Seasalt (Large)) - Log Date 2026-08-17', '2026-08-17 13:45:00+08'
    );

    -- Deduct Recipe Raw Material: Matcha Powder 1kg (Ingredient ID #465)
    UPDATE public.products_espresso
    SET stock = stock - 0.004
    WHERE id = 465;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        465, 'out', 0.004, 'Recipe Deduction: Order #' || v_order_id || ' (Matcha Seasalt (Large)) used 0.004 pack', '2026-08-17 13:45:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Matcha Seasalt (Large)) used 0.04 bot', '2026-08-17 13:45:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.13
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.13, 'Recipe Deduction: Order #' || v_order_id || ' (Matcha Seasalt (Large)) used 0.13 packs', '2026-08-17 13:45:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 63: Americano (Cold 16 oz) | Date: 2026-08-17 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2059, '2026-08-17 13:50:00+08', '2026-08-17 13:50:00+08', false, '[Imported Daily Sales: 2026-08-17]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 472, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-17 13:50:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 472;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        472, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Americano) - Log Date 2026-08-17', '2026-08-17 13:50:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Americano) used 0.018 pack', '2026-08-17 13:50:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 64: Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-17 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'gcash', 149, 0,
        2060, '2026-08-17 13:55:00+08', '2026-08-17 13:55:00+08', false, '[Imported Daily Sales: 2026-08-17]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 583, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-17 13:55:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 583;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        583, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Sea Salt Biscoff) - Log Date 2026-08-17', '2026-08-17 13:55:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 65: Americano (Hot 8 oz) | Date: 2026-08-17 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2061, '2026-08-17 14:00:00+08', '2026-08-17 14:00:00+08', false, '[Imported Daily Sales: 2026-08-17]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 469, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-17 14:00:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 469;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        469, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Americano (Small)) - Log Date 2026-08-17', '2026-08-17 14:00:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.009 pack', '2026-08-17 14:00:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.02 bot', '2026-08-17 14:00:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 66: Cappucino (Hot 8 oz) | Date: 2026-08-18 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        2062, '2026-08-18 14:05:00+08', '2026-08-18 14:05:00+08', false, '[Imported Daily Sales: 2026-08-18]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 501, 1, 105, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-18 14:05:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 501;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        501, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Cappuccino (Small)) - Log Date 2026-08-18', '2026-08-18 14:05:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Cappuccino (Small)) used 0.009 pack', '2026-08-18 14:05:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.25
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.25, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Cappuccino (Small)) used 0.25 packs', '2026-08-18 14:05:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Cappuccino (Small)) used 0.02 bot', '2026-08-18 14:05:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 67: Caramel Machiato (Hot 8 oz) | Date: 2026-08-18 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        2063, '2026-08-18 14:10:00+08', '2026-08-18 14:10:00+08', false, '[Imported Daily Sales: 2026-08-18]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 493, 1, 105, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-18 14:10:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 493;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        493, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Caramel Macchiato (Small)) - Log Date 2026-08-18', '2026-08-18 14:10:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Caramel Macchiato (Small)) used 0.009 pack', '2026-08-18 14:10:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.18
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.18, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Caramel Macchiato (Small)) used 0.18 packs', '2026-08-18 14:10:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Caramel Macchiato (Small)) used 0.03 bot', '2026-08-18 14:10:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Caramel 1L (Ingredient ID #462)
    UPDATE public.products_espresso
    SET stock = stock - 0.03
    WHERE id = 462;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        462, 'out', 0.03, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Caramel Macchiato (Small)) used 0.03 bot', '2026-08-18 14:10:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 68: Americano (Cold 16 oz) | Date: 2026-08-18 | Price: ₱120 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 120, NULL, 0,
        12.8571, 0, 120, 'gcash', 120, 0,
        2064, '2026-08-18 14:15:00+08', '2026-08-18 14:15:00+08', false, '[Imported Daily Sales: 2026-08-18]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 472, 1, 120, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-18 14:15:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 472;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        472, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Americano) - Log Date 2026-08-18', '2026-08-18 14:15:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Americano) used 0.018 pack', '2026-08-18 14:15:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 69: Caramel Machiato (Cold 16 oz) | Date: 2026-08-18 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2065, '2026-08-18 15:20:00+08', '2026-08-18 15:20:00+08', false, '[Imported Daily Sales: 2026-08-18]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 496, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-18 15:20:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 496;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        496, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Caramel Macchiato) - Log Date 2026-08-18', '2026-08-18 15:20:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Caramel Macchiato) used 0.018 pack', '2026-08-18 15:20:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.13
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.13, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Caramel Macchiato) used 0.13 packs', '2026-08-18 15:20:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Caramel Macchiato) used 0.04 bot', '2026-08-18 15:20:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Caramel 1L (Ingredient ID #462)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 462;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        462, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Caramel Macchiato) used 0.04 bot', '2026-08-18 15:20:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 70: White Chocolate (Cold 16 oz) | Date: 2026-08-18 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2066, '2026-08-18 15:25:00+08', '2026-08-18 15:25:00+08', false, '[Imported Daily Sales: 2026-08-18]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 579, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-18 15:25:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 579;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        579, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Choco (Large)) - Log Date 2026-08-18', '2026-08-18 15:25:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 71: Americano (Hot 8 oz) | Date: 2026-08-18 | Price: ₱120 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 120, NULL, 0,
        12.8571, 0, 120, 'cash', 120, 0,
        2067, '2026-08-18 15:30:00+08', '2026-08-18 15:30:00+08', false, '[Imported Daily Sales: 2026-08-18]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 469, 1, 120, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-18 15:30:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 469;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        469, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Americano (Small)) - Log Date 2026-08-18', '2026-08-18 15:30:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.009 pack', '2026-08-18 15:30:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.02 bot', '2026-08-18 15:30:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 72: Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-18 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2068, '2026-08-18 15:35:00+08', '2026-08-18 15:35:00+08', false, '[Imported Daily Sales: 2026-08-18]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 583, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-18 15:35:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 583;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        583, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Sea Salt Biscoff) - Log Date 2026-08-18', '2026-08-18 15:35:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 73: Macadamia (Cold 16 oz) | Date: 2026-08-18 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'gcash', 149, 0,
        2069, '2026-08-18 16:40:00+08', '2026-08-18 16:40:00+08', false, '[Imported Daily Sales: 2026-08-18]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 484, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-18 16:40:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 484;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        484, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) - Log Date 2026-08-18', '2026-08-18 16:40:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.018 pack', '2026-08-18 16:40:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.13
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.13, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.13 packs', '2026-08-18 16:40:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.015
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.015, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.015 bot', '2026-08-18 16:40:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Macadamia 1L (Ingredient ID #430)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 430;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        430, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.04 bot', '2026-08-18 16:40:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 74: Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-18 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'gcash', 149, 0,
        2070, '2026-08-18 16:45:00+08', '2026-08-18 16:45:00+08', false, '[Imported Daily Sales: 2026-08-18]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 583, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-18 16:45:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 583;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        583, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Sea Salt Biscoff) - Log Date 2026-08-18', '2026-08-18 16:45:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 75: Macadamia (Cold 16 oz) | Date: 2026-08-18 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2071, '2026-08-18 16:50:00+08', '2026-08-18 16:50:00+08', false, '[Imported Daily Sales: 2026-08-18]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 484, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-18 16:50:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 484;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        484, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) - Log Date 2026-08-18', '2026-08-18 16:50:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.018 pack', '2026-08-18 16:50:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.13
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.13, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.13 packs', '2026-08-18 16:50:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.015
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.015, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.015 bot', '2026-08-18 16:50:00+08'
    );

    -- Deduct Recipe Raw Material: Shott Macadamia 1L (Ingredient ID #430)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 430;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        430, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Macadamia Latte (Large)) used 0.04 bot', '2026-08-18 16:50:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 76: Americano (Hot 8 oz) | Date: 2026-08-19 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2072, '2026-08-19 16:55:00+08', '2026-08-19 16:55:00+08', false, '[Imported Daily Sales: 2026-08-19]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 469, 1, 99, 'ordered', '[TAKEOUT] [Hot] [8 oz]', '2026-08-19 16:55:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 469;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        469, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Americano (Small)) - Log Date 2026-08-19', '2026-08-19 16:55:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.009 pack', '2026-08-19 16:55:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Americano (Small)) used 0.02 bot', '2026-08-19 16:55:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 77: Cappuccino (Hot 16 oz) | Date: 2026-08-19 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2073, '2026-08-19 17:00:00+08', '2026-08-19 17:00:00+08', false, '[Imported Daily Sales: 2026-08-19]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 502, 1, 149, 'ordered', '[TAKEOUT] [Hot] [16 oz]', '2026-08-19 17:00:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 502;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        502, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Cappuccino (Large)) - Log Date 2026-08-19', '2026-08-19 17:00:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Cappuccino (Large)) used 0.018 pack', '2026-08-19 17:00:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.31
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.31, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Cappuccino (Large)) used 0.31 packs', '2026-08-19 17:00:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.04
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.04, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Cappuccino (Large)) used 0.04 bot', '2026-08-19 17:00:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 78: Mocha (Hot 8oz) | Date: 2026-08-19 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        2074, '2026-08-19 17:05:00+08', '2026-08-19 17:05:00+08', false, '[Imported Daily Sales: 2026-08-19]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 473, 1, 105, 'ordered', '[TAKEOUT] [Hot] [8oz]', '2026-08-19 17:05:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 473;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        473, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Mocha (Small)) - Log Date 2026-08-19', '2026-08-19 17:05:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.009
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.009, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Mocha (Small)) used 0.009 pack', '2026-08-19 17:05:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.092
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.092, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Mocha (Small)) used 0.092 packs', '2026-08-19 17:05:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.02
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.02, 'Recipe Deduction: Order #' || v_order_id || ' (Hot Mocha (Small)) used 0.02 bot', '2026-08-19 17:05:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 79: Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-19 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2075, '2026-08-19 17:10:00+08', '2026-08-19 17:10:00+08', false, '[Imported Daily Sales: 2026-08-19]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 583, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-19 17:10:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 583;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        583, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Sea Salt Biscoff) - Log Date 2026-08-19', '2026-08-19 17:10:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 80: Oreo Milk (Cold 16 oz) | Date: 2026-08-19 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2076, '2026-08-19 17:15:00+08', '2026-08-19 17:15:00+08', false, '[Imported Daily Sales: 2026-08-19]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 584, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-19 17:15:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 584;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        584, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Oreo Milk) - Log Date 2026-08-19', '2026-08-19 17:15:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 81: Spanish Latte (Cold 16 oz) | Date: 2026-08-19 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2077, '2026-08-19 18:20:00+08', '2026-08-19 18:20:00+08', false, '[Imported Daily Sales: 2026-08-19]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 500, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-19 18:20:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 500;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        500, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Spanish Latte) - Log Date 2026-08-19', '2026-08-19 18:20:00+08'
    );

    -- Deduct Recipe Raw Material: Concept Blend 1 (Ingredient ID #420)
    UPDATE public.products_espresso
    SET stock = stock - 0.018
    WHERE id = 420;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        420, 'out', 0.018, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.018 pack', '2026-08-19 18:20:00+08'
    );

    -- Deduct Recipe Raw Material: Arla Full Cream Milk 1L (Ingredient ID #424)
    UPDATE public.products_espresso
    SET stock = stock - 0.13
    WHERE id = 424;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        424, 'out', 0.13, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.13 packs', '2026-08-19 18:20:00+08'
    );

    -- Deduct Recipe Raw Material: Hi Fructose Corn Syrup 500ML (Ingredient ID #433)
    UPDATE public.products_espresso
    SET stock = stock - 0.005
    WHERE id = 433;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        433, 'out', 0.005, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.005 bot', '2026-08-19 18:20:00+08'
    );

    -- Deduct Recipe Raw Material: Doreen Condense Milk 390G (Ingredient ID #425)
    UPDATE public.products_espresso
    SET stock = stock - 0.102564
    WHERE id = 425;

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        425, 'out', 0.102564, 'Recipe Deduction: Order #' || v_order_id || ' (Iced Spanish Latte) used 0.102564 can', '2026-08-19 18:20:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 82: White Chocolate (Cold 16 oz) | Date: 2026-08-19 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        2078, '2026-08-19 18:25:00+08', '2026-08-19 18:25:00+08', false, '[Imported Daily Sales: 2026-08-19]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 579, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-19 18:25:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 579;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        579, 'out', 1, 'Sales Order #' || v_order_id || ' (Hot Choco (Large)) - Log Date 2026-08-19', '2026-08-19 18:25:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Row 83: Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-19 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'gcash', 149, 0,
        2079, '2026-08-19 18:30:00+08', '2026-08-19 18:30:00+08', false, '[Imported Daily Sales: 2026-08-19]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, 583, 1, 149, 'ordered', '[TAKEOUT] [Cold] [16 oz]', '2026-08-19 18:30:00+08', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - 1
    WHERE id = 583;

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        583, 'out', 1, 'Sales Order #' || v_order_id || ' (Iced Sea Salt Biscoff) - Log Date 2026-08-19', '2026-08-19 18:30:00+08'
    );

    -- --------------------------------------------------------------------------
    -- Update Branch 30 Receipt Counter & Grand Accumulating Total (GAT)
    -- --------------------------------------------------------------------------
    INSERT INTO public.receipt_counter_espresso (branch_id, current_value)
    VALUES (30, 2079)
    ON CONFLICT (branch_id) DO UPDATE
    SET current_value = GREATEST(receipt_counter_espresso.current_value, 2079);

    INSERT INTO public.grand_accumulating_total_espresso (branch_id, total_sales, total_receipts, updated_at)
    VALUES (30, 11163, 79, NOW())
    ON CONFLICT (branch_id) DO UPDATE
    SET total_sales = grand_accumulating_total_espresso.total_sales + 11163,
        total_receipts = grand_accumulating_total_espresso.total_receipts + 79,
        updated_at = NOW();

    RAISE NOTICE 'Daily sales and recipe ingredients imported successfully. Total Orders: %, Total Sales: ₱%', 79, 11163;

END $$;
