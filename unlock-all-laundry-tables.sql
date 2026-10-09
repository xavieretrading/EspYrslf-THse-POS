-- Fixes "new row violates row-level security policy for table laundry_..." for ALL laundry app tables at once
-- (laundry_media, laundry_promos, laundry_highlights, laundry_notifications, laundry_rewards, laundry_posts, ...).
--
-- Why it happens: Supabase turns on row-level security for every new table, and the live server is not yet
-- using the secret (service_role) key, so it is treated like a public visitor and blocked.
-- The real fix is the secret key on Cloud Run; this keeps everything working until then.
-- Safe to run more than once.

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'laundry\_%' LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t.tablename);
    RAISE NOTICE 'unlocked %', t.tablename;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
