-- SQL Script to Disable Row-Level Security (RLS) on all Espresso Yourself & Tea House tables.
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

ALTER TABLE public.branches_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_terminals_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_items_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_redemptions_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_counter_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_credits_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grand_accumulating_total_espresso DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.z_readings_espresso DISABLE ROW LEVEL SECURITY;
