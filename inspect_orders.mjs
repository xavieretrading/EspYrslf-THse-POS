import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const pids = [290, 281];
  
  const { data: products, error } = await supabase
    .from('products_espresso')
    .select('*')
    .in('id', pids);

  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  console.log(`Fetched ${products.length} products:`);
  products.forEach(p => {
    console.log(`Product ID: ${p.id}, Name: ${p.name}, Price: ${p.price}`);
  });
}

run();
