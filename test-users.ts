import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hzirutqjszwzfjipdlnw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zgrkJjk-L19q9Nsxh9bCDQ_uIDABfmM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data } = await supabase.from('tables').select('*');
  console.log('Tables:', data ? 'yes' : 'no');
}
test();
