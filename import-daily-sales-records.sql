-- ==========================================================================
-- DAILY SALES RECORD & COMPLETE INVENTORY / RECIPE DEDUCTION SQL SCRIPT
-- Target Branch: Espresso Yourself & Tea House - Cebu City Branch (branch_id = 30)
-- Source File: recordsExcel/Daily_Sales_Record_Template.xlsx
--
-- Numbering: Starts from Order #000001 and Invoice #000001
-- Features:
-- 1. Creates paid orders in orders_espresso starting from Order #1 / Invoice #1.
-- 2. Inserts line items into order_items_espresso.
-- 3. Deducts Finished Product Stock in products_espresso.
-- 4. Deducts ALL Recipe Raw Materials / Ingredients (Concept Blend 1, Arla Milk, Syrups, etc.).
-- 5. Inserts audit transaction logs for all products & recipe ingredients.
-- 6. Sets Branch 30 Receipt Counter to 79.
-- 7. Updates Grand Accumulating Total (GAT).
-- ==========================================================================

DO $$
DECLARE
    v_order_id BIGINT;
BEGIN

    -- --------------------------------------------------------------------------
    -- Row 5: Order #000001 | Hot americano (Hot 8 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        1, 1, '2026-08-08 09:00:00+08', '2026-08-08 09:00:00+08', false, '[Imported Daily Sales: 2026-08-08]'
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
    -- Row 6: Order #000002 | French Vanilla (Hot 8 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        2, 2, '2026-08-08 09:05:00+08', '2026-08-08 09:05:00+08', false, '[Imported Daily Sales: 2026-08-08]'
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
    -- Row 7: Order #000003 | Caffe Latte (Hot 8 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        3, 3, '2026-08-08 09:10:00+08', '2026-08-08 09:10:00+08', false, '[Imported Daily Sales: 2026-08-08]'
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
    -- Row 8: Order #000004 | Macadamia (Hot 8 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        4, 4, '2026-08-08 09:15:00+08', '2026-08-08 09:15:00+08', false, '[Imported Daily Sales: 2026-08-08]'
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
    -- Row 9: Order #000005 | Iced Macadamia (Cold 16 oz) | Date: 2026-08-08 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        5, 5, '2026-08-08 10:20:00+08', '2026-08-08 10:20:00+08', false, '[Imported Daily Sales: 2026-08-08]'
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
    -- Row 10: Order #000006 | Iced Irish Cream (Cold 16 oz) | Date: 2026-08-08 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        6, 6, '2026-08-08 10:25:00+08', '2026-08-08 10:25:00+08', false, '[Imported Daily Sales: 2026-08-08]'
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
    -- Row 11: Order #000007 | Lychee Soda (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        7, 7, '2026-08-08 10:30:00+08', '2026-08-08 10:30:00+08', false, '[Imported Daily Sales: 2026-08-08]'
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
    -- Row 12: Order #000008 | Pink Guava (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        8, 8, '2026-08-08 10:35:00+08', '2026-08-08 10:35:00+08', false, '[Imported Daily Sales: 2026-08-08]'
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
    -- Row 13: Order #000009 | pink guava (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        9, 9, '2026-08-08 11:40:00+08', '2026-08-08 11:40:00+08', false, '[Imported Daily Sales: 2026-08-08]'
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
    -- Row 14: Order #000010 | Mango (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        10, 10, '2026-08-08 11:45:00+08', '2026-08-08 11:45:00+08', false, '[Imported Daily Sales: 2026-08-08]'
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
    -- Row 15: Order #000011 | Pink Guava (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        11, 11, '2026-08-08 11:50:00+08', '2026-08-08 11:50:00+08', false, '[Imported Daily Sales: 2026-08-08]'
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
    -- Row 16: Order #000012 | Mango (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        12, 12, '2026-08-08 11:55:00+08', '2026-08-08 11:55:00+08', false, '[Imported Daily Sales: 2026-08-08]'
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
    -- Row 17: Order #000013 | Mango (Cold 16 oz) | Date: 2026-08-08 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        13, 13, '2026-08-08 12:00:00+08', '2026-08-08 12:00:00+08', false, '[Imported Daily Sales: 2026-08-08]'
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
    -- Row 18: Order #000014 | Spanish latte (Hot 8 oz) | Date: 2026-08-09 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        14, 14, '2026-08-09 12:05:00+08', '2026-08-09 12:05:00+08', false, '[Imported Daily Sales: 2026-08-09]'
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
    -- Row 19: Order #000015 | Iced Latte (Cold 16 oz) | Date: 2026-08-09 | Price: ₱298 | Qty: 2
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 596, NULL, 0,
        63.8571, 0, 596, 'cash', 596, 0,
        15, 15, '2026-08-09 12:10:00+08', '2026-08-09 12:10:00+08', false, '[Imported Daily Sales: 2026-08-09]'
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
    -- Row 20: Order #000016 | Hot Choco (Hot 8 oz) | Date: 2026-08-10 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        16, 16, '2026-08-10 12:15:00+08', '2026-08-10 12:15:00+08', false, '[Imported Daily Sales: 2026-08-10]'
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
    -- Row 21: Order #000017 | Hot Latte (Hot 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        17, 17, '2026-08-10 13:20:00+08', '2026-08-10 13:20:00+08', false, '[Imported Daily Sales: 2026-08-10]'
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
    -- Row 22: Order #000018 | Hot Mocha (Hot 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        18, 18, '2026-08-10 13:25:00+08', '2026-08-10 13:25:00+08', false, '[Imported Daily Sales: 2026-08-10]'
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
    -- Row 23: Order #000019 | Pomegranate x Pink Guava (Cold 16 oz) | Date: 2026-08-10 | Price: ₱198 | Qty: 2
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 396, NULL, 0,
        42.4286, 0, 396, 'cash', 396, 0,
        19, 19, '2026-08-10 13:30:00+08', '2026-08-10 13:30:00+08', false, '[Imported Daily Sales: 2026-08-10]'
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
    -- Row 24: Order #000020 | Macadamia (Hot 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        20, 20, '2026-08-10 13:35:00+08', '2026-08-10 13:35:00+08', false, '[Imported Daily Sales: 2026-08-10]'
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
    -- Row 25: Order #000021 | Americano (Cold 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        21, 21, '2026-08-10 14:40:00+08', '2026-08-10 14:40:00+08', false, '[Imported Daily Sales: 2026-08-10]'
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
    -- Row 26: Order #000022 | Macadamia (Cold 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        22, 22, '2026-08-10 14:45:00+08', '2026-08-10 14:45:00+08', false, '[Imported Daily Sales: 2026-08-10]'
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
    -- Row 27: Order #000023 | Spanish Latte (Cold 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        23, 23, '2026-08-10 14:50:00+08', '2026-08-10 14:50:00+08', false, '[Imported Daily Sales: 2026-08-10]'
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
    -- Row 28: Order #000024 | Macadamia (Cold 16 oz) | Date: 2026-08-10 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        24, 24, '2026-08-10 14:55:00+08', '2026-08-10 14:55:00+08', false, '[Imported Daily Sales: 2026-08-10]'
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
    -- Row 29: Order #000025 | Mango Soda (Cold 16 oz) | Date: 2026-08-10 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        25, 25, '2026-08-10 15:00:00+08', '2026-08-10 15:00:00+08', false, '[Imported Daily Sales: 2026-08-10]'
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
    -- Row 30: Order #000026 | Americano (Hot 8 oz) | Date: 2026-08-11 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        26, 26, '2026-08-11 15:05:00+08', '2026-08-11 15:05:00+08', false, '[Imported Daily Sales: 2026-08-11]'
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
    -- Row 31: Order #000027 | Americano (Hot 8 oz) | Date: 2026-08-11 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        27, 27, '2026-08-11 15:10:00+08', '2026-08-11 15:10:00+08', false, '[Imported Daily Sales: 2026-08-11]'
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
    -- Row 32: Order #000028 | Americano (Hot 8 oz) | Date: 2026-08-11 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        28, 28, '2026-08-11 15:15:00+08', '2026-08-11 15:15:00+08', false, '[Imported Daily Sales: 2026-08-11]'
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
    -- Row 33: Order #000029 | Americano (Cold 16 oz) | Date: 2026-08-11 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        29, 29, '2026-08-11 16:20:00+08', '2026-08-11 16:20:00+08', false, '[Imported Daily Sales: 2026-08-11]'
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
    -- Row 34: Order #000030 | Latte (Hot 8 oz) | Date: 2026-08-11 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        30, 30, '2026-08-11 16:25:00+08', '2026-08-11 16:25:00+08', false, '[Imported Daily Sales: 2026-08-11]'
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
    -- Row 35: Order #000031 | Spanish Latte (Cold 16 oz) | Date: 2026-08-11 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        31, 31, '2026-08-11 16:30:00+08', '2026-08-11 16:30:00+08', false, '[Imported Daily Sales: 2026-08-11]'
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
    -- Row 36: Order #000032 | Latte (Hot 16 oz) | Date: 2026-08-11 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        32, 32, '2026-08-11 16:35:00+08', '2026-08-11 16:35:00+08', false, '[Imported Daily Sales: 2026-08-11]'
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
    -- Row 37: Order #000033 | Spanish Latte (Hot 8 oz) | Date: 2026-08-11 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        33, 33, '2026-08-11 17:40:00+08', '2026-08-11 17:40:00+08', false, '[Imported Daily Sales: 2026-08-11]'
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
    -- Row 38: Order #000034 | Pomegranate x Pink Guava (Cold 16 oz) | Date: 2026-08-11 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        34, 34, '2026-08-11 17:45:00+08', '2026-08-11 17:45:00+08', false, '[Imported Daily Sales: 2026-08-11]'
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
    -- Row 39: Order #000035 | Macadamia (Cold 16 oz) | Date: 2026-08-12 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        35, 35, '2026-08-12 17:50:00+08', '2026-08-12 17:50:00+08', false, '[Imported Daily Sales: 2026-08-12]'
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
    -- Row 40: Order #000036 | Pomegranate (Cold 16 oz) | Date: 2026-08-12 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        36, 36, '2026-08-12 17:55:00+08', '2026-08-12 17:55:00+08', false, '[Imported Daily Sales: 2026-08-12]'
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
    -- Row 41: Order #000037 | Pomegranate x Pink Guava (Cold 16 oz) | Date: 2026-08-12 | Price: ₱129 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 129, NULL, 0,
        13.8214, 0, 129, 'cash', 129, 0,
        37, 37, '2026-08-12 18:00:00+08', '2026-08-12 18:00:00+08', false, '[Imported Daily Sales: 2026-08-12]'
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
    -- Row 42: Order #000038 | Latte (Hot 8 oz) | Date: 2026-08-12 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        38, 38, '2026-08-12 18:05:00+08', '2026-08-12 18:05:00+08', false, '[Imported Daily Sales: 2026-08-12]'
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
    -- Row 43: Order #000039 | Spanish Latte (Cold 16 oz) | Date: 2026-08-12 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        39, 39, '2026-08-12 18:10:00+08', '2026-08-12 18:10:00+08', false, '[Imported Daily Sales: 2026-08-12]'
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
    -- Row 44: Order #000040 | irish cream (Cold 16 oz) | Date: 2026-08-12 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        40, 40, '2026-08-12 18:15:00+08', '2026-08-12 18:15:00+08', false, '[Imported Daily Sales: 2026-08-12]'
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
    -- Row 45: Order #000041 | Latte (Hot 8 oz) | Date: 2026-08-13 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        41, 41, '2026-08-13 09:20:00+08', '2026-08-13 09:20:00+08', false, '[Imported Daily Sales: 2026-08-13]'
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
    -- Row 46: Order #000042 | Americano (Cold 16 oz) | Date: 2026-08-13 | Price: ₱240 | Qty: 2
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 480, NULL, 0,
        51.4286, 0, 480, 'cash', 480, 0,
        42, 42, '2026-08-13 09:25:00+08', '2026-08-13 09:25:00+08', false, '[Imported Daily Sales: 2026-08-13]'
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
    -- Row 47: Order #000043 | Americano (Cold 16 oz) | Date: 2026-08-13 | Price: ₱120 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 120, NULL, 0,
        12.8571, 0, 120, 'cash', 120, 0,
        43, 43, '2026-08-13 09:30:00+08', '2026-08-13 09:30:00+08', false, '[Imported Daily Sales: 2026-08-13]'
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
    -- Row 48: Order #000044 | Spanish Latte (Hot 8 oz) | Date: 2026-08-13 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        44, 44, '2026-08-13 09:35:00+08', '2026-08-13 09:35:00+08', false, '[Imported Daily Sales: 2026-08-13]'
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
    -- Row 49: Order #000045 | Cappucino (Hot 8 oz) | Date: 2026-08-14 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        45, 45, '2026-08-14 10:40:00+08', '2026-08-14 10:40:00+08', false, '[Imported Daily Sales: 2026-08-14]'
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
    -- Row 50: Order #000046 | Pomegranate Tea (Cold 16 oz) | Date: 2026-08-14 | Price: ₱129 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 129, NULL, 0,
        13.8214, 0, 129, 'cash', 129, 0,
        46, 46, '2026-08-14 10:45:00+08', '2026-08-14 10:45:00+08', false, '[Imported Daily Sales: 2026-08-14]'
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
    -- Row 51: Order #000047 | latte (Hot 8 oz) | Date: 2026-08-14 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        47, 47, '2026-08-14 10:50:00+08', '2026-08-14 10:50:00+08', false, '[Imported Daily Sales: 2026-08-14]'
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
    -- Row 52: Order #000048 | Black tea (Hot 16 oz) | Date: 2026-08-14 | Price: ₱129 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 129, NULL, 0,
        13.8214, 0, 129, 'cash', 129, 0,
        48, 48, '2026-08-14 10:55:00+08', '2026-08-14 10:55:00+08', false, '[Imported Daily Sales: 2026-08-14]'
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
    -- Row 53: Order #000049 | Cappucino (Hot 8 oz) | Date: 2026-08-14 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        49, 49, '2026-08-14 11:00:00+08', '2026-08-14 11:00:00+08', false, '[Imported Daily Sales: 2026-08-14]'
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
    -- Row 54: Order #000050 | Pink Guava (Cold 16 oz) | Date: 2026-08-14 | Price: ₱129 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 129, NULL, 0,
        13.8214, 0, 129, 'cash', 129, 0,
        50, 50, '2026-08-14 11:05:00+08', '2026-08-14 11:05:00+08', false, '[Imported Daily Sales: 2026-08-14]'
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
    -- Row 55: Order #000051 | Black Tea (Hot 8 oz) | Date: 2026-08-14 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        51, 51, '2026-08-14 11:10:00+08', '2026-08-14 11:10:00+08', false, '[Imported Daily Sales: 2026-08-14]'
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
    -- Row 56: Order #000052 | Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-14 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        52, 52, '2026-08-14 11:15:00+08', '2026-08-14 11:15:00+08', false, '[Imported Daily Sales: 2026-08-14]'
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
    -- Row 57: Order #000053 | Mocha + Oat Milk (Cold 16 oz) | Date: 2026-08-14 | Price: ₱199 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 199, NULL, 0,
        21.3214, 0, 199, 'cash', 199, 0,
        53, 53, '2026-08-14 12:20:00+08', '2026-08-14 12:20:00+08', false, '[Imported Daily Sales: 2026-08-14]'
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
    -- Row 58: Order #000054 | Mango Soda (Cold 16 oz) | Date: 2026-08-14 | Price: ₱129 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 129, NULL, 0,
        13.8214, 0, 129, 'cash', 129, 0,
        54, 54, '2026-08-14 12:25:00+08', '2026-08-14 12:25:00+08', false, '[Imported Daily Sales: 2026-08-14]'
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
    -- Row 59: Order #000055 | White Chocolate Latte (Hot 16 oz) | Date: 2026-08-15 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        55, 55, '2026-08-15 12:30:00+08', '2026-08-15 12:30:00+08', false, '[Imported Daily Sales: 2026-08-15]'
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
    -- Row 60: Order #000056 | Macadamia (Hot 16 oz) | Date: 2026-08-15 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        56, 56, '2026-08-15 12:35:00+08', '2026-08-15 12:35:00+08', false, '[Imported Daily Sales: 2026-08-15]'
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
    -- Row 61: Order #000057 | Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-17 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        57, 57, '2026-08-17 13:40:00+08', '2026-08-17 13:40:00+08', false, '[Imported Daily Sales: 2026-08-17]'
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
    -- Row 62: Order #000058 | Seasalt Matcha (Cold 16 oz) | Date: 2026-08-17 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        58, 58, '2026-08-17 13:45:00+08', '2026-08-17 13:45:00+08', false, '[Imported Daily Sales: 2026-08-17]'
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
    -- Row 63: Order #000059 | Americano (Cold 16 oz) | Date: 2026-08-17 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        59, 59, '2026-08-17 13:50:00+08', '2026-08-17 13:50:00+08', false, '[Imported Daily Sales: 2026-08-17]'
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
    -- Row 64: Order #000060 | Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-17 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'gcash', 149, 0,
        60, 60, '2026-08-17 13:55:00+08', '2026-08-17 13:55:00+08', false, '[Imported Daily Sales: 2026-08-17]'
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
    -- Row 65: Order #000061 | Americano (Hot 8 oz) | Date: 2026-08-17 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        61, 61, '2026-08-17 14:00:00+08', '2026-08-17 14:00:00+08', false, '[Imported Daily Sales: 2026-08-17]'
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
    -- Row 66: Order #000062 | Cappucino (Hot 8 oz) | Date: 2026-08-18 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        62, 62, '2026-08-18 14:05:00+08', '2026-08-18 14:05:00+08', false, '[Imported Daily Sales: 2026-08-18]'
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
    -- Row 67: Order #000063 | Caramel Machiato (Hot 8 oz) | Date: 2026-08-18 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        63, 63, '2026-08-18 14:10:00+08', '2026-08-18 14:10:00+08', false, '[Imported Daily Sales: 2026-08-18]'
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
    -- Row 68: Order #000064 | Americano (Cold 16 oz) | Date: 2026-08-18 | Price: ₱120 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 120, NULL, 0,
        12.8571, 0, 120, 'gcash', 120, 0,
        64, 64, '2026-08-18 14:15:00+08', '2026-08-18 14:15:00+08', false, '[Imported Daily Sales: 2026-08-18]'
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
    -- Row 69: Order #000065 | Caramel Machiato (Cold 16 oz) | Date: 2026-08-18 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        65, 65, '2026-08-18 15:20:00+08', '2026-08-18 15:20:00+08', false, '[Imported Daily Sales: 2026-08-18]'
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
    -- Row 70: Order #000066 | White Chocolate (Cold 16 oz) | Date: 2026-08-18 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        66, 66, '2026-08-18 15:25:00+08', '2026-08-18 15:25:00+08', false, '[Imported Daily Sales: 2026-08-18]'
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
    -- Row 71: Order #000067 | Americano (Hot 8 oz) | Date: 2026-08-18 | Price: ₱120 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 120, NULL, 0,
        12.8571, 0, 120, 'cash', 120, 0,
        67, 67, '2026-08-18 15:30:00+08', '2026-08-18 15:30:00+08', false, '[Imported Daily Sales: 2026-08-18]'
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
    -- Row 72: Order #000068 | Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-18 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        68, 68, '2026-08-18 15:35:00+08', '2026-08-18 15:35:00+08', false, '[Imported Daily Sales: 2026-08-18]'
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
    -- Row 73: Order #000069 | Macadamia (Cold 16 oz) | Date: 2026-08-18 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'gcash', 149, 0,
        69, 69, '2026-08-18 16:40:00+08', '2026-08-18 16:40:00+08', false, '[Imported Daily Sales: 2026-08-18]'
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
    -- Row 74: Order #000070 | Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-18 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'gcash', 149, 0,
        70, 70, '2026-08-18 16:45:00+08', '2026-08-18 16:45:00+08', false, '[Imported Daily Sales: 2026-08-18]'
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
    -- Row 75: Order #000071 | Macadamia (Cold 16 oz) | Date: 2026-08-18 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        71, 71, '2026-08-18 16:50:00+08', '2026-08-18 16:50:00+08', false, '[Imported Daily Sales: 2026-08-18]'
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
    -- Row 76: Order #000072 | Americano (Hot 8 oz) | Date: 2026-08-19 | Price: ₱99 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 99, NULL, 0,
        10.6071, 0, 99, 'cash', 99, 0,
        72, 72, '2026-08-19 16:55:00+08', '2026-08-19 16:55:00+08', false, '[Imported Daily Sales: 2026-08-19]'
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
    -- Row 77: Order #000073 | Cappuccino (Hot 16 oz) | Date: 2026-08-19 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        73, 73, '2026-08-19 17:00:00+08', '2026-08-19 17:00:00+08', false, '[Imported Daily Sales: 2026-08-19]'
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
    -- Row 78: Order #000074 | Mocha (Hot 8oz) | Date: 2026-08-19 | Price: ₱105 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 105, NULL, 0,
        11.25, 0, 105, 'cash', 105, 0,
        74, 74, '2026-08-19 17:05:00+08', '2026-08-19 17:05:00+08', false, '[Imported Daily Sales: 2026-08-19]'
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
    -- Row 79: Order #000075 | Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-19 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        75, 75, '2026-08-19 17:10:00+08', '2026-08-19 17:10:00+08', false, '[Imported Daily Sales: 2026-08-19]'
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
    -- Row 80: Order #000076 | Oreo Milk (Cold 16 oz) | Date: 2026-08-19 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        76, 76, '2026-08-19 17:15:00+08', '2026-08-19 17:15:00+08', false, '[Imported Daily Sales: 2026-08-19]'
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
    -- Row 81: Order #000077 | Spanish Latte (Cold 16 oz) | Date: 2026-08-19 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        77, 77, '2026-08-19 18:20:00+08', '2026-08-19 18:20:00+08', false, '[Imported Daily Sales: 2026-08-19]'
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
    -- Row 82: Order #000078 | White Chocolate (Cold 16 oz) | Date: 2026-08-19 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'cash', 149, 0,
        78, 78, '2026-08-19 18:25:00+08', '2026-08-19 18:25:00+08', false, '[Imported Daily Sales: 2026-08-19]'
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
    -- Row 83: Order #000079 | Seasalt Biscoff (Cold 16 oz) | Date: 2026-08-19 | Price: ₱149 | Qty: 1
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        order_number, receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', 149, NULL, 0,
        15.9643, 0, 149, 'gcash', 149, 0,
        79, 79, '2026-08-19 18:30:00+08', '2026-08-19 18:30:00+08', false, '[Imported Daily Sales: 2026-08-19]'
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
    -- Set Branch 30 Receipt Counter to 79 & Grand Accumulating Total (GAT)
    -- --------------------------------------------------------------------------
    INSERT INTO public.receipt_counter_espresso (branch_id, current_value)
    VALUES (30, 79)
    ON CONFLICT (branch_id) DO UPDATE
    SET current_value = 79;

    INSERT INTO public.grand_accumulating_total_espresso (branch_id, total_sales, total_receipts, updated_at)
    VALUES (30, 11163, 79, NOW())
    ON CONFLICT (branch_id) DO UPDATE
    SET total_sales = 11163,
        total_receipts = 79,
        updated_at = NOW();

    RAISE NOTICE 'Daily sales and recipe ingredients imported successfully. Total Orders: %, Total Sales: ₱%', 79, 11163;

END $$;
