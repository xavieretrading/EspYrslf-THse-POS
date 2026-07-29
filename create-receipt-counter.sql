-- SQL Migration: Run this in the Supabase SQL Editor to support Fix C (tax-compliant receipt/invoice numbers)
-- This creates a dedicated receipt_counter table and adds a receipt_number column to public.orders.

CREATE TABLE IF NOT EXISTS public.receipt_counter (
    id SERIAL PRIMARY KEY,
    branch_id BIGINT DEFAULT 1,
    current_value BIGINT NOT NULL DEFAULT 0,
    UNIQUE(branch_id)
);

-- Seed an initial row for branch #1 starting at 795 (so next receipt created is 796)
INSERT INTO public.receipt_counter (branch_id, current_value)
VALUES (1, 795)
ON CONFLICT (branch_id) DO NOTHING;

-- Add a custom receipt_number column to the orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_number BIGINT;
