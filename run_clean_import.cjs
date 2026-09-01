const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aziowvhzfrmtrbypiodm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aW93dmh6ZnJtdHJieXBpb2RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDYxNDMxOCwiZXhwIjoyMTAwMTkwMzE4fQ.6TzWshOMqE72fhGKfAYhJY448s_1Fw_wIvVIgtKiS0o';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BRANCH_ID = 30;

function resolveProduct(name, temp, size, price) {
  const n = (name || '').toLowerCase().trim();
  const t = (temp || '').toLowerCase().trim();
  const s = (size || '').toLowerCase().trim();

  if (n.includes('americano')) {
    if (t.includes('hot') || (!t.includes('cold') && s.includes('8'))) return s.includes('16') ? { id: 470, name: 'Hot Americano (Large)' } : { id: 469, name: 'Hot Americano (Small)' };
    return s.includes('8') ? { id: 471, name: 'Iced Americano (Small)' } : { id: 472, name: 'Iced Americano' };
  }
  if (n.includes('french vanilla')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? { id: 490, name: 'Hot French Vanilla (Large)' } : { id: 489, name: 'Hot French Vanilla (Small)' };
    return { id: 492, name: 'Iced French Vanilla' };
  }
  if (n.includes('latte') && !n.includes('spanish') && !n.includes('matcha') && !n.includes('white chocolate') && !n.includes('macadamia')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? { id: 478, name: 'Hot Latte (Large)' } : { id: 477, name: 'Hot Latte (Small)' };
    return { id: 480, name: 'Iced Latte (Large)' };
  }
  if (n.includes('caffe latte')) return s.includes('16') ? { id: 478, name: 'Hot Latte (Large)' } : { id: 477, name: 'Hot Latte (Small)' };
  if (n.includes('macadamia')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? { id: 482, name: 'Hot Macadamia Latte (Large)' } : { id: 481, name: 'Hot Macadamia Latte (Small)' };
    return { id: 484, name: 'Iced Macadamia Latte (Large)' };
  }
  if (n.includes('irish cream')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? { id: 581, name: 'Hot Irish Cream (Large)' } : { id: 580, name: 'Hot Irish Cream (Small)' };
    return { id: 585, name: 'Iced Irish Cream' };
  }
  if (n.includes('pink guava') && n.includes('pomegranate')) return { id: 513, name: 'Pink Guava & Pomegranate (16 oz)' };
  if (n.includes('pink guava')) return { id: 509, name: 'Pink Guava (16 oz)' };
  if (n.includes('pomegranate')) return n.includes('tea') ? { id: 517, name: 'Pomegranate Tea (16 oz)' } : { id: 511, name: 'Pomegranate (16 oz)' };
  if (n.includes('mango')) return n.includes('tea') ? { id: 516, name: 'Mango Tea (16 oz)' } : { id: 510, name: 'Mango (16 oz)' };
  if (n.includes('lychee')) return n.includes('tea') ? { id: 514, name: 'Lychee Tea (16 oz)' } : { id: 512, name: 'Lychee (16 oz)' };
  if (n.includes('spanish latte') || n.includes('spanish')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? { id: 498, name: 'Hot Spanish Latte (Large)' } : { id: 497, name: 'Hot Spanish Latte (Small)' };
    return { id: 500, name: 'Iced Spanish Latte' };
  }
  if (n.includes('choco')) return s.includes('16') ? { id: 579, name: 'Hot Choco (Large)' } : { id: 578, name: 'Hot Choco (Small)' };
  if (n.includes('mocha')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? { id: 474, name: 'Hot Mocha (Large)' } : { id: 473, name: 'Hot Mocha (Small)' };
    return { id: 476, name: 'Iced Mocha' };
  }
  if (n.includes('cappuc') || n.includes('cappuccino')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? { id: 502, name: 'Hot Cappuccino (Large)' } : { id: 501, name: 'Hot Cappuccino (Small)' };
    return { id: 504, name: 'Iced Cappuccino' };
  }
  if (n.includes('butterscotch')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? { id: 486, name: 'Hot Butterscotch (Large)' } : { id: 485, name: 'Hot Butterscotch (Small)' };
    return { id: 488, name: 'Iced Butterscotch' };
  }
  if (n.includes('caramel mach') || n.includes('caramel macchiato')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? { id: 494, name: 'Hot Caramel Macchiato (Large)' } : { id: 493, name: 'Hot Caramel Macchiato (Small)' };
    return { id: 496, name: 'Iced Caramel Macchiato' };
  }
  if (n.includes('white chocolate')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? { id: 506, name: 'Hot White Chocolate Latte (Large)' } : { id: 505, name: 'Hot White Chocolate Latte (Small)' };
    return { id: 508, name: 'Iced White Chocolate Latte' };
  }
  if (n.includes('black tea')) return s.includes('16') ? { id: 588, name: 'Hot Black Tea (Large)' } : { id: 520, name: 'Hot Black Tea (Small)' };
  if (n.includes('jasmine tea')) return s.includes('16') ? { id: 587, name: 'Hot Jasmine Tea (Large)' } : { id: 519, name: 'Hot Jasmine Tea (Small)' };
  if (n.includes('biscoff') && n.includes('seasalt')) return { id: 583, name: 'Iced Sea Salt Biscoff' };
  if (n.includes('oreo')) return { id: 584, name: 'Iced Oreo Milk' };
  if (n.includes('matcha') && n.includes('seasalt')) return { id: 522, name: 'Matcha Seasalt (Large)' };
  return null;
}

async function runCleanImport() {
  console.log('🧹 1. Clearing previous orders and duplicate records for Branch 30...');
  const { data: oldOrders } = await supabase.from('orders_espresso').select('id').eq('branch_id', BRANCH_ID);
  const oldIds = (oldOrders || []).map(o => o.id);
  if (oldIds.length > 0) {
    await supabase.from('order_items_espresso').delete().in('order_id', oldIds);
    await supabase.from('orders_espresso').delete().eq('branch_id', BRANCH_ID);
  }

  const { data: prods } = await supabase.from('products_espresso').select('id, name, unit, is_sellable, stock').eq('branch_id', BRANCH_ID);
  const prodMap = {};
  (prods || []).forEach(p => { prodMap[p.id] = p; });
  const prodIds = Object.keys(prodMap);
  if (prodIds.length > 0) {
    await supabase.from('inventory_transactions_espresso').delete().in('product_id', prodIds);
  }

  // Reset initial stock levels
  await supabase.from('products_espresso').update({ stock: 9999 }).eq('branch_id', BRANCH_ID).eq('is_sellable', 1);
  await supabase.from('products_espresso').update({ stock: 10 }).eq('id', 420); // Concept Blend 1 initial 10 packs

  console.log('📊 2. Loading Excel sales and Product Recipes...');
  const wb = XLSX.readFile('recordsExcel/Daily_Sales_Record_Template.xlsx');
  const sheet = wb.Sheets['Detailed Product Sales'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const dataRows = rows.slice(4).filter(r => r && r[0] !== undefined && r[1] !== undefined);
  const { data: recipes } = await supabase.from('product_recipes').select('*');

  console.log(`Found ${dataRows.length} sales rows.`);

  let orderSeq = 0;
  let totalSales = 0;
  const ingredientDeductionSummary = {};

  for (let idx = 0; idx < dataRows.length; idx++) {
    const r = dataRows[idx];
    let dateStr = r[0];
    if (typeof r[0] === 'number') {
      const p = XLSX.SSF.parse_date_code(r[0]);
      dateStr = p.y + '-' + String(p.m).padStart(2, '0') + '-' + String(p.d).padStart(2, '0');
    }

    const name = String(r[1]).trim();
    const temp = r[2] ? String(r[2]).trim() : '';
    const size = r[3] ? String(r[3]).trim() : '';
    const qty = Number(r[4] || 1);
    const price = Number(r[5] || 0);
    const total = Number(r[6] || (price * qty));
    const payment = (r[7] ? String(r[7]).trim() : 'Cash').toLowerCase();
    const payMethod = payment.includes('qr') || payment.includes('gcash') ? 'gcash' : 'cash';

    orderSeq += 1;
    totalSales += total;

    const prod = resolveProduct(name, temp, size, price) || { id: 469, name: 'Unknown' };
    const minuteOffset = (idx % 12) * 5;
    const hour = 9 + Math.floor((idx % 40) / 4);
    const timeStr = String(hour).padStart(2, '0') + ':' + String(minuteOffset).padStart(2, '0') + ':00';
    const timestamp = `${dateStr}T${timeStr}.000Z`;
    const notes = `[TAKEOUT]${temp ? ` [${temp}]` : ''}${size ? ` [${size}]` : ''}`.trim();
    const vatAmount = Number((total - (total / 1.12)).toFixed(4));

    // 1. Insert order with order_number and receipt_number = orderSeq
    const { data: createdOrder, error: orderErr } = await supabase
      .from('orders_espresso')
      .insert([{
        branch_id: BRANCH_ID,
        table_id: null,
        order_type: 'takeout',
        status: 'paid',
        subtotal: total,
        discount_id: null,
        discount_amount: 0,
        tax_amount: vatAmount,
        service_charge: 0,
        total: total,
        payment_method: payMethod,
        amount_tendered: total,
        change: 0,
        order_number: orderSeq,
        receipt_number: orderSeq,
        created_at: timestamp,
        updated_at: timestamp,
        is_training_mode: false,
        notes: `[Imported Daily Sales: ${dateStr}]`
      }])
      .select('id')
      .single();

    if (orderErr || !createdOrder) {
      console.error(`Error inserting Order #${orderSeq}:`, orderErr?.message);
      continue;
    }

    const orderId = createdOrder.id;

    // 2. Insert item
    await supabase.from('order_items_espresso').insert([{
      order_id: orderId,
      product_id: prod.id,
      quantity: qty,
      price: price,
      status: 'ordered',
      notes: notes,
      created_at: timestamp,
      is_active: 1
    }]);

    // 3. Deduct product stock & log transaction
    if (prodMap[prod.id]) {
      prodMap[prod.id].stock = (prodMap[prod.id].stock || 0) - qty;
      await supabase.from('products_espresso').update({ stock: prodMap[prod.id].stock }).eq('id', prod.id);
      await supabase.from('inventory_transactions_espresso').insert([{
        product_id: prod.id,
        type: 'out',
        quantity: qty,
        remarks: `Sales Order #${orderSeq} (${prod.name}) - Log Date ${dateStr}`,
        created_at: timestamp
      }]);
    }

    // 4. Deduct recipes
    const itemRecipes = (recipes || []).filter(rc => rc.product_id === prod.id);
    for (const rc of itemRecipes) {
      const usedAmt = Number(rc.quantity || 0) * qty;
      const ing = prodMap[rc.ingredient_id];
      if (ing) {
        ing.stock = Number(ing.stock || 0) - usedAmt;
        ingredientDeductionSummary[ing.name] = (ingredientDeductionSummary[ing.name] || 0) + usedAmt;

        await supabase.from('products_espresso').update({ stock: ing.stock }).eq('id', rc.ingredient_id);
        await supabase.from('inventory_transactions_espresso').insert([{
          product_id: rc.ingredient_id,
          type: 'out',
          quantity: usedAmt,
          remarks: `Recipe usage for Order #${orderSeq} (${prod.name})`,
          created_at: timestamp
        }]);
      }
    }
  }

  // 5. Update receipt counter to 79 and GAT
  await supabase.from('receipt_counter_espresso').upsert({ branch_id: BRANCH_ID, current_value: orderSeq });
  await supabase.from('grand_accumulating_total_espresso').upsert({
    branch_id: BRANCH_ID,
    total_sales: totalSales,
    total_receipts: orderSeq,
    updated_at: new Date().toISOString()
  });

  console.log('\n======================================================');
  console.log('🎉 CLEAN IMPORT COMPLETED SUCCESSFULLY!');
  console.log(`✅ Total Orders: ${orderSeq} (Numbered #000001 to #${String(orderSeq).padStart(6, '0')})`);
  console.log(`✅ Total Sales: ₱${totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`);
  console.log(`✅ Receipt Counter for Branch 30 set to: ${orderSeq}`);
  console.log('✅ Concept Blend 1 Final Stock:', prodMap[420]?.stock?.toFixed(4), 'packs');
  console.log('======================================================\n');
}

runCleanImport().catch(err => {
  console.error('Fatal error:', err);
});
