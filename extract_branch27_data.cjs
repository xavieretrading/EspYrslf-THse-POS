const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aziowvhzfrmtrbypiodm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aW93dmh6ZnJtdHJieXBpb2RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDYxNDMxOCwiZXhwIjoyMTAwMTkwMzE4fQ.6TzWshOMqE72fhGKfAYhJY448s_1Fw_wIvVIgtKiS0o';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function extract() {
  console.log('Extracting Branch 27 data...');
  
  // 1. Fetch branch info
  const { data: branch, error: bErr } = await supabase.from('branches_espresso').select('*').eq('id', 27).single();
  if (bErr) console.error('Branch error:', bErr);
  
  // 2. Fetch categories
  const { data: categories, error: cErr } = await supabase.from('categories_espresso').select('*');
  if (cErr) console.error('Categories error:', cErr);
  
  // 3. Fetch products
  const { data: products, error: pErr } = await supabase.from('products_espresso').select('*');
  if (pErr) console.error('Products error:', pErr);
  
  // 4. Fetch all orders for branch 27
  const { data: orders, error: oErr } = await supabase
    .from('orders_espresso')
    .select('*')
    .eq('branch_id', 27)
    .order('created_at', { ascending: true });
    
  if (oErr) {
    console.error('Error fetching orders:', oErr);
    return;
  }
  
  // 5. Fetch all items for these orders
  const orderIds = orders.map(o => o.id);
  let allItems = [];
  for (let i = 0; i < orderIds.length; i += 100) {
    const chunk = orderIds.slice(i, i + 100);
    const { data: items, error: iErr } = await supabase
      .from('order_items_espresso')
      .select('*')
      .in('order_id', chunk);
    if (iErr) console.error('Error fetching items chunk:', iErr);
    if (items) allItems = allItems.concat(items);
  }
  
  console.log('Fetched: 1 branch, ' + categories.length + ' categories, ' + products.length + ' products, ' + orders.length + ' orders, ' + allItems.length + ' order items.');
  
  const payload = {
    branch,
    categories,
    products,
    orders,
    orderItems: allItems,
    extractedAt: new Date().toISOString()
  };
  
  fs.writeFileSync('davao_branch_27_raw_sales.json', JSON.stringify(payload, null, 2));
  console.log('SUCCESS: Saved data to davao_branch_27_raw_sales.json');
}

extract();
