import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://hzirutqjszwzfjipdlnw.supabase.co';
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zgrkJjk-L19q9Nsxh9bCDQ_uIDABfmM';

export const supabase = createClient(supabaseUrl, supabaseKey);
