-- SQL Migration: Add division column to categories and notes to orders, then reload schema cache
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

ALTER TABLE public.categories_espresso ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'coffee';
ALTER TABLE public.orders_espresso ADD COLUMN IF NOT EXISTS notes TEXT;

-- Critical: Tell Supabase PostgREST to reload the schema cache so it recognizes the new columns
NOTIFY pgrst, 'reload schema';
