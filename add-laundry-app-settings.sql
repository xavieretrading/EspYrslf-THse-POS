-- S1p & Sp1n Laundry app: shop settings the owner types in, and structured customer addresses.
-- Only creates/changes laundry_* tables. Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.laundry_app_settings (
  branch_id BIGINT PRIMARY KEY REFERENCES public.branches_espresso(id),
  contact_phone TEXT,          -- shown in the app with a Call button
  gcash_number TEXT,           -- shown on the payment screen
  gcash_name TEXT,             -- GCash account name
  promo_title TEXT,            -- promo banner on the Home screen
  promo_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.laundry_app_settings DISABLE ROW LEVEL SECURITY;

-- One row for the Davao (Buhangin) laundry branch. Edit these in Table Editor → laundry_app_settings.
INSERT INTO public.laundry_app_settings (branch_id, promo_title, promo_text)
VALUES (27, '5 + 2 kilo promo', 'Regular clothes, towels & bedsheets: 7 kg and up, 2 kg are free.')
ON CONFLICT (branch_id) DO NOTHING;

-- Province / city / barangay / ZIP / street / landmark for each customer
ALTER TABLE public.laundry_customers ADD COLUMN IF NOT EXISTS address_details JSONB;

-- Login codes (stored hashed; used by every Cloud Run copy of the server)
CREATE TABLE IF NOT EXISTS public.laundry_otp_codes (
  phone TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  tries INT DEFAULT 0,
  sent_at JSONB DEFAULT '[]'::jsonb
);
ALTER TABLE public.laundry_otp_codes DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
