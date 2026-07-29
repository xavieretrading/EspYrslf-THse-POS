const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('inventory_transactions_espresso').select('*');
  if (error) {
    console.error('Select Error:', error);
  } else {
    console.log('Transactions in Supabase:', data);
  }
}

test();
