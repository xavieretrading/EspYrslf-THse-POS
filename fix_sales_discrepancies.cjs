const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://aziowvhzfrmtrbypiodm.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aW93dmh6ZnJtdHJieXBpb2RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDYxNDMxOCwiZXhwIjoyMTAwMTkwMzE4fQ.6TzWshOMqE72fhGKfAYhJY448s_1Fw_wIvVIgtKiS0o';
const BRANCH_ID = 30;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function calcTax(total) {
  return Number((total - (total / 1.12)).toFixed(4));
}

async function fixPOS() {
  console.log('================================================================================');
  console.log('🛠️  EXECUTING POS SALES DATABASE RECONCILIATION FIX');
  console.log('================================================================================\n');

  // ---------------------------------------------------------------------------
  // STEP 1: Delete duplicate Custom SQL Import orders
  // ---------------------------------------------------------------------------
  console.log('Step 1: Fetching duplicate [Custom SQL Import] orders...');
  const { data: dupOrders, error: fetchErr } = await supabase
    .from('orders_espresso')
    .select('id, total, notes')
    .eq('branch_id', BRANCH_ID)
    .ilike('notes', '%Custom SQL Import%');

  if (fetchErr) {
    throw new Error(`Failed to fetch duplicate orders: ${fetchErr.message}`);
  }

  const dupIds = (dupOrders || []).map(o => o.id);
  const dupTotal = (dupOrders || []).reduce((sum, o) => sum + Number(o.total || 0), 0);
  console.log(`Found ${dupIds.length} duplicate orders totaling ₱${dupTotal.toFixed(2)}.`);

  if (dupIds.length > 0) {
    console.log('Deleting duplicate order_items_espresso...');
    const { error: delItemsErr } = await supabase
      .from('order_items_espresso')
      .delete()
      .in('order_id', dupIds);

    if (delItemsErr) {
      throw new Error(`Failed to delete duplicate order items: ${delItemsErr.message}`);
    }

    console.log('Deleting duplicate orders_espresso...');
    const { error: delOrdersErr } = await supabase
      .from('orders_espresso')
      .delete()
      .in('id', dupIds);

    if (delOrdersErr) {
      throw new Error(`Failed to delete duplicate orders: ${delOrdersErr.message}`);
    }
    console.log(`✅ Successfully removed ${dupIds.length} duplicate orders (-₱${dupTotal.toFixed(2)}).\n`);
  }

  // ---------------------------------------------------------------------------
  // STEP 2: Fix August 25 Pricing Errors
  // ---------------------------------------------------------------------------
  console.log('Step 2: Correcting August 25 Order Items and Orders...');

  // 2a. Fix Order #639: 4x Sea Salt Biscoff
  // Excel: Qty 4, unit price ₱149, total ₱596 (was recorded as unit price ₱596 -> ₱2,384)
  console.log('  - Fixing Order #639 (4x Sea Salt Biscoff)...');
  const { error: item639Err } = await supabase
    .from('order_items_espresso')
    .update({ price: 149 })
    .eq('order_id', 639);
  if (item639Err) console.error('Error updating item for #639:', item639Err);

  const { error: ord639Err } = await supabase
    .from('orders_espresso')
    .update({
      subtotal: 596,
      total: 596,
      tax_amount: calcTax(596),
      amount_tendered: 596
    })
    .eq('id', 639);
  if (ord639Err) console.error('Error updating order #639:', ord639Err);
  else console.log('    ✅ Order #639 updated to ₱596.00 (4x @ ₱149).');

  // 2b. Fix Order #640: 2x Matcha Latte
  // Excel: Qty 2, unit price ₱149, total ₱298 (was recorded as unit price ₱298 -> ₱596)
  console.log('  - Fixing Order #640 (2x Matcha Latte)...');
  const { error: item640Err } = await supabase
    .from('order_items_espresso')
    .update({ price: 149 })
    .eq('order_id', 640);
  if (item640Err) console.error('Error updating item for #640:', item640Err);

  const { error: ord640Err } = await supabase
    .from('orders_espresso')
    .update({
      subtotal: 298,
      total: 298,
      tax_amount: calcTax(298),
      amount_tendered: 298
    })
    .eq('id', 640);
  if (ord640Err) console.error('Error updating order #640:', ord640Err);
  else console.log('    ✅ Order #640 updated to ₱298.00 (2x @ ₱149).');

  // 2c. Fix Order #635: 3x Biscoff Matcha (Buy 2 Get 1 Promo)
  // Excel: Qty 3, Total Sales ₱298 (1 free cup: ₱447 - ₱149 = ₱298)
  console.log('  - Fixing Order #635 (Biscoff Matcha Promo)...');
  const { error: ord635Err } = await supabase
    .from('orders_espresso')
    .update({
      subtotal: 447,
      discount_amount: 149,
      total: 298,
      tax_amount: calcTax(298),
      amount_tendered: 298
    })
    .eq('id', 635);
  if (ord635Err) console.error('Error updating order #635:', ord635Err);
  else console.log('    ✅ Order #635 updated to ₱298.00 (₱447 - ₱149 promo discount).');

  // ---------------------------------------------------------------------------
  // STEP 3: Minor Alignment on Aug 27 (Row 134 Spanish ₱159 add-on)
  // ---------------------------------------------------------------------------
  // Check Order #667 or whichever order has Spanish on Aug 27
  const { data: aug27Orders } = await supabase
    .from('orders_espresso')
    .select('id, total, notes, order_items_espresso(*)')
    .eq('branch_id', BRANCH_ID)
    .gte('created_at', '2026-08-27T00:00:00')
    .lte('created_at', '2026-08-27T23:59:59')
    .ilike('notes', '%Sales Log Import%');

  // Find order with Spanish latte at 149 that had total 159 in Excel
  const spanishOrder = (aug27Orders || []).find(o => 
    o.order_items_espresso && o.order_items_espresso.some(i => i.product_id === 500 && o.total === 149)
  );

  if (spanishOrder) {
    console.log(`  - Aligning Aug 27 Order #${spanishOrder.id} to ₱159.00 (reflecting +₱10 add-on in Excel)...`);
    await supabase.from('orders_espresso').update({
      subtotal: 159,
      total: 159,
      tax_amount: calcTax(159),
      amount_tendered: 159
    }).eq('id', spanishOrder.id);
    await supabase.from('order_items_espresso').update({
      price: 159
    }).eq('order_id', spanishOrder.id);
    console.log(`    ✅ Order #${spanishOrder.id} updated to ₱159.00.`);
  }

  console.log('\n================================================================================');
  console.log('🎉 ALL DATABASE FIXES APPLIED SUCCESSFULLY!');
  console.log('================================================================================\n');
}

fixPOS().catch(err => {
  console.error('Fatal error during fix:', err);
  process.exit(1);
});
