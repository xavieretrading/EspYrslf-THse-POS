-- ==========================================================================
-- RESET ESPRESSO YOURSELF BRANCH SCRIPT
-- Target Branch: Espresso Yourself & Tea House - Cebu City Branch (branch_id = 30)
--
-- Instructions:
-- Run this query in your Supabase SQL Editor if you ever need to reset this branch to zero.
-- ==========================================================================

-- 1. Delete Order Items belonging to Branch 30 orders
DELETE FROM public.order_items_espresso
WHERE order_id IN (
    SELECT id FROM public.orders_espresso WHERE branch_id = 30
);

-- 2. Delete Orders for Branch 30
DELETE FROM public.orders_espresso
WHERE branch_id = 30;

-- 3. Delete Inventory Transaction Logs for Branch 30 products
DELETE FROM public.inventory_transactions_espresso
WHERE product_id IN (
    SELECT id FROM public.products_espresso WHERE branch_id = 30
);

-- 4. Reset Stock for Sellable Menu Items
UPDATE public.products_espresso
SET stock = 9999
WHERE branch_id = 30 AND is_sellable = 1;

-- 5. Delete Cashier Shifts for Branch 30
DELETE FROM public.shifts_espresso
WHERE branch_id = 30;

-- 6. Reset Grand Accumulating Total (GAT) to 0
UPDATE public.grand_accumulating_total_espresso
SET total_sales = 0, total_receipts = 0, updated_at = NOW()
WHERE branch_id = 30;

-- 7. Reset Receipt Counter to 1000
UPDATE public.receipt_counter_espresso
SET current_value = 1000
WHERE branch_id = 30;

-- 8. Reset Tables to Available
UPDATE public.tables_espresso
SET status = 'available'
WHERE branch_id = 30;
