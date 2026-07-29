import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hzirutqjszwzfjipdlnw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zgrkJjk-L19q9Nsxh9bCDQ_uIDABfmM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching orders:", error);
  } else {
    console.log("Columns in orders:", data.length > 0 ? Object.keys(data[0]) : "No orders found to inspect columns");
  }
}
inspect();
