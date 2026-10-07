-- UNDO for security-enable-rls.sql: opens the tables to the public key again (the old setting).
-- Use only if something stops working after locking, then tell the developer what broke.

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
