import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hzirutqjszwzfjipdlnw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zgrkJjk-L19q9Nsxh9bCDQ_uIDABfmM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching order_items...");
  const { data, error } = await supabase
    .from('order_items')
    .select('*, orders!inner(id, branch_id, created_at, status, receipt_number), products(name)')
    .ilike('notes', '%[COMPLIMENTARY%')
    .order('id', { ascending: false });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Fetched", data.length, "items");
    if (data.length > 0) {
      console.log("First item:", JSON.stringify(data[0], null, 2));
    }
  }
}
test();
