-- SQL Migration: Add Discount Customer Columns for BIR Compliance
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Add discount customer information columns to the orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS discount_customer_name TEXT,
ADD COLUMN IF NOT EXISTS discount_customer_id_no TEXT,
ADD COLUMN IF NOT EXISTS discount_customer_tin TEXT,
ADD COLUMN IF NOT EXISTS discount_child_name TEXT,
ADD COLUMN IF NOT EXISTS discount_child_birthdate TEXT,
ADD COLUMN IF NOT EXISTS discount_child_age INTEGER;

-- 2. Deduplicate the discounts table (keeps the first instance and deletes duplicate options)
DELETE FROM public.discounts
WHERE id NOT IN (
  SELECT MIN(id)
  FROM public.discounts
  GROUP BY name
);
