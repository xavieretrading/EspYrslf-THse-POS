const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aziowvhzfrmtrbypiodm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aW93dmh6ZnJtdHJieXBpb2RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDYxNDMxOCwiZXhwIjoyMTAwMTkwMzE4fQ.6TzWshOMqE72fhGKfAYhJY448s_1Fw_wIvVIgtKiS0o';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BRANCH_ID = 30; // Espresso Yourself & Tea House - Cebu City Branch

async function resetBranch() {
  console.log(`🧹 Resetting all data for Branch #${BRANCH_ID} (Espresso Yourself & Tea House)...`);

  // 1. Get all orders for Branch 30
  const { data: orders, error: ordFetchErr } = await supabase
    .from('orders_espresso')
    .select('id')
    .eq('branch_id', BRANCH_ID);

  const orderIds = (orders || []).map(o => o.id);
  console.log(`📦 Found ${orderIds.length} orders to delete for Branch ${BRANCH_ID}.`);

  // 2. Delete order items
  if (orderIds.length > 0) {
    const { error: itemsDelErr } = await supabase
      .from('order_items_espresso')
      .delete()
      .in('order_id', orderIds);

    if (itemsDelErr) console.error('Error deleting order items:', itemsDelErr.message);
    else console.log(`✅ Deleted all order items linked to Branch ${BRANCH_ID} orders.`);
  }

  // 3. Delete orders
  const { error: ordersDelErr } = await supabase
    .from('orders_espresso')
    .delete()
    .eq('branch_id', BRANCH_ID);

  if (ordersDelErr) console.error('Error deleting orders:', ordersDelErr.message);
  else console.log(`✅ Deleted all orders for Branch ${BRANCH_ID}.`);

  // 4. Get all products for Branch 30
  const { data: products, error: prodFetchErr } = await supabase
    .from('products_espresso')
    .select('id, name, is_sellable')
    .eq('branch_id', BRANCH_ID);

  const productIds = (products || []).map(p => p.id);
  console.log(`☕ Found ${productIds.length} products belonging to Branch ${BRANCH_ID}.`);

  // 5. Delete inventory transactions for Branch 30 products
  if (productIds.length > 0) {
    const { error: txDelErr } = await supabase
      .from('inventory_transactions_espresso')
      .delete()
      .in('product_id', productIds);

    if (txDelErr) console.error('Error deleting inventory transactions:', txDelErr.message);
    else console.log(`✅ Cleared all inventory transaction logs for Branch ${BRANCH_ID}.`);
  }

  // 6. Reset sellable products stock back to 9999
  const sellableIds = (products || []).filter(p => p.is_sellable === 1).map(p => p.id);
  if (sellableIds.length > 0) {
    const { error: stockResetErr } = await supabase
      .from('products_espresso')
      .update({ stock: 9999 })
      .in('id', sellableIds);

    if (stockResetErr) console.error('Error resetting product stocks:', stockResetErr.message);
    else console.log(`✅ Reset stock for ${sellableIds.length} sellable menu products to 9999.`);
  }

  // 7. Delete shifts for Branch 30
  const { error: shiftsDelErr } = await supabase
    .from('shifts_espresso')
    .delete()
    .eq('branch_id', BRANCH_ID);

  if (shiftsDelErr) console.error('Error deleting shifts:', shiftsDelErr.message);
  else console.log(`✅ Cleared all cashier/barista shifts for Branch ${BRANCH_ID}.`);

  // 8. Reset Grand Accumulating Total (GAT) to 0
  const { error: gatResetErr } = await supabase
    .from('grand_accumulating_total_espresso')
    .update({ total_sales: 0, total_receipts: 0, updated_at: new Date().toISOString() })
    .eq('branch_id', BRANCH_ID);

  if (gatResetErr) console.error('Error resetting GAT:', gatResetErr.message);
  else console.log(`✅ Reset Grand Accumulating Total (GAT) to ₱0.00 for Branch ${BRANCH_ID}.`);

  // 9. Reset Receipt Counter to 1000
  const { error: counterResetErr } = await supabase
    .from('receipt_counter_espresso')
    .update({ current_value: 1000 })
    .eq('branch_id', BRANCH_ID);

  if (counterResetErr) console.error('Error resetting receipt counter:', counterResetErr.message);
  else console.log(`✅ Reset Receipt Counter to 1000 for Branch ${BRANCH_ID}.`);

  // 10. Free up any occupied tables
  await supabase
    .from('tables_espresso')
    .update({ status: 'available' })
    .eq('branch_id', BRANCH_ID);

  console.log('\n======================================================');
  console.log(`✨ ESPRESSO BRANCH (BRANCH #${BRANCH_ID}) HAS BEEN FULLY RESET!`);
  console.log('• Total Sales: ₱0.00');
  console.log('• Orders: 0');
  console.log('• Inventory Transaction Logs: 0');
  console.log('• Active Shifts: 0');
  console.log('======================================================\n');

  // Generate SQL file
  const sqlContent = `-- ==========================================================================
-- RESET ESPRESSO YOURSELF BRANCH SCRIPT
-- Target Branch: Espresso Yourself & Tea House - Cebu City Branch (branch_id = 30)
--
-- Instructions:
-- Run this query in your Supabase SQL Editor if you ever need to reset this branch to zero.
-- ==========================================================================

-- 1. Delete Order Items belonging to Branch 30 orders
DELETE FROM public.order_items_espresso
WHERE order_id IN (
    SELECT id FROM public.orders_espresso WHERE branch_id = 30
);

-- 2. Delete Orders for Branch 30
DELETE FROM public.orders_espresso
WHERE branch_id = 30;

-- 3. Delete Inventory Transaction Logs for Branch 30 products
DELETE FROM public.inventory_transactions_espresso
WHERE product_id IN (
    SELECT id FROM public.products_espresso WHERE branch_id = 30
);

-- 4. Reset Stock for Sellable Menu Items
UPDATE public.products_espresso
SET stock = 9999
WHERE branch_id = 30 AND is_sellable = 1;

-- 5. Delete Cashier Shifts for Branch 30
DELETE FROM public.shifts_espresso
WHERE branch_id = 30;

-- 6. Reset Grand Accumulating Total (GAT) to 0
UPDATE public.grand_accumulating_total_espresso
SET total_sales = 0, total_receipts = 0, updated_at = NOW()
WHERE branch_id = 30;

-- 7. Reset Receipt Counter to 1000
UPDATE public.receipt_counter_espresso
SET current_value = 1000
WHERE branch_id = 30;

-- 8. Reset Tables to Available
UPDATE public.tables_espresso
SET status = 'available'
WHERE branch_id = 30;
`;

  fs.writeFileSync(path.join(__dirname, 'reset-espresso-branch.sql'), sqlContent, 'utf8');
  console.log('📄 Created SQL script: reset-espresso-branch.sql');
}

resetBranch().catch(err => {
  console.error('Fatal error during reset:', err);
  process.exit(1);
});
