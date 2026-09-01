const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aziowvhzfrmtrbypiodm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aW93dmh6ZnJtdHJieXBpb2RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDYxNDMxOCwiZXhwIjoyMTAwMTkwMzE4fQ.6TzWshOMqE72fhGKfAYhJY448s_1Fw_wIvVIgtKiS0o';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const EXCEL_FILE = path.join(__dirname, 'recordsExcel', 'Daily_Sales_Record_Template.xlsx');
const wb = XLSX.readFile(EXCEL_FILE);
const sheet = wb.Sheets['Detailed Product Sales'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
const dataRows = rows.slice(4).filter(r => r && r[0] !== undefined && r[1] !== undefined);

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

async function generateFullSQL() {
  console.log('Fetching products and recipes from Supabase...');
  const { data: recipes } = await supabase.from('product_recipes').select('*');
  const { data: products } = await supabase.from('products_espresso').select('id, name, unit').eq('branch_id', 30);
  const prodMap = {};
  (products || []).forEach(p => { prodMap[p.id] = p; });

  let sql = `-- ==========================================================================
-- DAILY SALES RECORD & COMPLETE INVENTORY / RECIPE DEDUCTION SQL SCRIPT
-- Target Branch: Espresso Yourself & Tea House - Cebu City Branch (branch_id = 30)
-- Source File: recordsExcel/Daily_Sales_Record_Template.xlsx
--
-- Features:
-- 1. Creates paid orders in orders_espresso with historical dates (Aug 8 - 19, 2026).
-- 2. Inserts line items into order_items_espresso.
-- 3. Deducts Finished Product Stock in products_espresso.
-- 4. Deducts ALL Recipe Raw Materials / Ingredients (Concept Blend 1, Arla Milk, Syrups, etc.).
-- 5. Inserts audit transaction logs for all products & recipe ingredients in inventory_transactions_espresso.
-- 6. Updates Receipt Counter & Grand Accumulating Total (GAT).
-- ==========================================================================

DO $$
DECLARE
    v_order_id BIGINT;
BEGIN
`;

  let receiptNo = 2000;
  let totalSales = 0;
  const ingredientSummary = {};

  dataRows.forEach((r, idx) => {
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

    receiptNo += 1;
    totalSales += total;

    const prod = resolveProduct(name, temp, size, price) || { id: 469, name: 'Unknown' };
    const minuteOffset = (idx % 12) * 5;
    const hour = 9 + Math.floor((idx % 40) / 4);
    const timeStr = String(hour).padStart(2, '0') + ':' + String(minuteOffset).padStart(2, '0') + ':00';
    const timestamp = `${dateStr} ${timeStr}+08`;
    const notes = `[TAKEOUT]${temp ? ` [${temp}]` : ''}${size ? ` [${size}]` : ''}`.trim();
    const vatAmount = Number((total - (total / 1.12)).toFixed(4));

    // Find recipe ingredients
    const itemRecipes = (recipes || []).filter(rc => rc.product_id === prod.id);

    sql += `
    -- --------------------------------------------------------------------------
    -- Row ${idx + 5}: ${name} (${temp} ${size}) | Date: ${dateStr} | Price: ₱${price} | Qty: ${qty}
    -- --------------------------------------------------------------------------
    INSERT INTO public.orders_espresso (
        branch_id, table_id, order_type, status, subtotal, discount_id, discount_amount,
        tax_amount, service_charge, total, payment_method, amount_tendered, change,
        receipt_number, created_at, updated_at, is_training_mode, notes
    ) VALUES (
        30, NULL, 'takeout', 'paid', ${total}, NULL, 0,
        ${vatAmount}, 0, ${total}, '${payMethod}', ${total}, 0,
        ${receiptNo}, '${timestamp}', '${timestamp}', false, '[Imported Daily Sales: ${dateStr}]'
    ) RETURNING id INTO v_order_id;

    -- 1. Insert Line Item
    INSERT INTO public.order_items_espresso (
        order_id, product_id, quantity, price, status, notes, created_at, is_active
    ) VALUES (
        v_order_id, ${prod.id}, ${qty}, ${price}, 'ordered', '${notes}', '${timestamp}', 1
    );

    -- 2. Deduct Menu Product Stock
    UPDATE public.products_espresso
    SET stock = stock - ${qty}
    WHERE id = ${prod.id};

    -- 3. Log Menu Product Outflow
    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        ${prod.id}, 'out', ${qty}, 'Sales Order #' || v_order_id || ' (${prod.name}) - Log Date ${dateStr}', '${timestamp}'
    );
`;

    // 4. Deduct Raw Ingredients from Product Recipe
    if (itemRecipes.length > 0) {
      itemRecipes.forEach(rc => {
        const ing = prodMap[rc.ingredient_id] || { name: 'Ingredient #' + rc.ingredient_id, unit: '' };
        const usedQty = Number(rc.quantity || 0) * qty;
        ingredientSummary[ing.name] = (ingredientSummary[ing.name] || 0) + usedQty;

        sql += `
    -- Deduct Recipe Raw Material: ${ing.name} (Ingredient ID #${rc.ingredient_id})
    UPDATE public.products_espresso
    SET stock = stock - ${usedQty}
    WHERE id = ${rc.ingredient_id};

    INSERT INTO public.inventory_transactions_espresso (
        product_id, type, quantity, remarks, created_at
    ) VALUES (
        ${rc.ingredient_id}, 'out', ${usedQty}, 'Recipe Deduction: Order #' || v_order_id || ' (${prod.name}) used ${usedQty} ${ing.unit || ''}', '${timestamp}'
    );
`;
      });
    }
  });

  sql += `
    -- --------------------------------------------------------------------------
    -- Update Branch 30 Receipt Counter & Grand Accumulating Total (GAT)
    -- --------------------------------------------------------------------------
    INSERT INTO public.receipt_counter_espresso (branch_id, current_value)
    VALUES (30, ${receiptNo})
    ON CONFLICT (branch_id) DO UPDATE
    SET current_value = GREATEST(receipt_counter_espresso.current_value, ${receiptNo});

    INSERT INTO public.grand_accumulating_total_espresso (branch_id, total_sales, total_receipts, updated_at)
    VALUES (30, ${totalSales}, ${dataRows.length}, NOW())
    ON CONFLICT (branch_id) DO UPDATE
    SET total_sales = grand_accumulating_total_espresso.total_sales + ${totalSales},
        total_receipts = grand_accumulating_total_espresso.total_receipts + ${dataRows.length},
        updated_at = NOW();

    RAISE NOTICE 'Daily sales and recipe ingredients imported successfully. Total Orders: %, Total Sales: ₱%', ${dataRows.length}, ${totalSales};

END $$;
`;

  fs.writeFileSync(path.join(__dirname, 'import-daily-sales-records.sql'), sql, 'utf8');
  console.log('✅ Generated import-daily-sales-records.sql with full recipe deductions!');
  console.log('📊 Recipe Raw Materials Deducted:');
  Object.keys(ingredientSummary).forEach(name => {
    console.log(`  • ${name}: -${ingredientSummary[name].toFixed(4)}`);
  });
}

generateFullSQL().catch(e => {
  console.error('Error generating SQL:', e);
});
