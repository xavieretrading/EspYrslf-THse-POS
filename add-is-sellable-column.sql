-- SQL Migration: Add is_sellable column to products_espresso table
-- Run this query in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

ALTER TABLE public.products_espresso ADD COLUMN IF NOT EXISTS is_sellable INTEGER DEFAULT 1;
