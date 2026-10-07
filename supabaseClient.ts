import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://aziowvhzfrmtrbypiodm.supabase.co';
// Public (anon) key: only used for Supabase Auth checks once the service key is set
export const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aW93dmh6ZnJtdHJieXBpb2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQzMTgsImV4cCI6MjEwMDE5MDMxOH0.cCyA0z20cRfGotnzcatm-9AgZRXR0UEyW7SjGBo-HqQ';

// The server should use the secret service-role key (Cloud Run secret SUPABASE_SERVICE_ROLE_KEY).
// It keeps working when Row Level Security is turned on, while the public key is then locked out.
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) console.warn('[supabase] SUPABASE_SERVICE_ROLE_KEY not set: using the public key (do not enable RLS yet).');

export const usingServiceKey = !!serviceKey;
export const supabase = createClient(supabaseUrl, serviceKey || supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
