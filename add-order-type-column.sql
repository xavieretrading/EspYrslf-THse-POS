-- Run this in your Supabase SQL Editor to add the order_type column to the orders table

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'dine-in';
