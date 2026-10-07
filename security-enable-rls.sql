-- SECURITY STAGE 3: lock the database so the public key can no longer read or change anything.
-- Run ONLY after SUPABASE_SERVICE_ROLE_KEY is set on Cloud Run and the POS has been checked to work with it.
-- The server (service key) keeps full access; the public key gets nothing because no policies are added.
-- Undo: security-rollback-rls.sql

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

-- Check: every table should say true
SELECT tablename, rowsecurity AS locked FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
