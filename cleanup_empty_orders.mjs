import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Starting cleanup of empty orders...");

  // 1. Fetch all open orders
  const { data: openOrders, error: fetchError } = await supabase
    .from('orders_espresso')
    .select('id, table_id, order_items:order_items_espresso(id)')
    .eq('status', 'open');

  if (fetchError) {
    console.error("Error fetching open orders:", fetchError);
    return;
  }

  const emptyOrders = openOrders.filter(order => !order.order_items || order.order_items.length === 0);
  console.log(`Found ${emptyOrders.length} empty open orders.`);

  if (emptyOrders.length === 0) {
    console.log("No empty orders to clean up.");
    return;
  }

  for (const order of emptyOrders) {
    console.log(`Cleaning up Order ID: ${order.id}...`);

    // Free up table if occupied
    if (order.table_id) {
      console.log(`  Freeing up table ID: ${order.table_id}...`);
      await supabase.from('tables_espresso').update({ status: 'available' }).eq('id', order.table_id);
    }

    // Delete the order
    const { error: deleteError } = await supabase
      .from('orders_espresso')
      .delete()
      .eq('id', order.id);

    if (deleteError) {
      console.error(`  Error deleting order ${order.id}:`, deleteError);
    } else {
      console.log(`  Order ${order.id} successfully deleted.`);
    }
  }

  console.log("Cleanup complete!");
}

run();
