-- SQL Migration: Split payments (e.g. part cash, part GCash) on one order
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

ALTER TABLE public.orders_espresso ADD COLUMN IF NOT EXISTS payment_splits JSONB;

-- Tell Supabase PostgREST to reload the schema cache so it recognizes the new column
NOTIFY pgrst, 'reload schema';
