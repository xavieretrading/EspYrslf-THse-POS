const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aziowvhzfrmtrbypiodm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aW93dmh6ZnJtdHJieXBpb2RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDYxNDMxOCwiZXhwIjoyMTAwMTkwMzE4fQ.6TzWshOMqE72fhGKfAYhJY448s_1Fw_wIvVIgtKiS0o';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const BRANCH_ID = 30; // Espresso Yourself & Tea House - Cebu City Branch
const EXCEL_FILE = path.join(__dirname, 'recordsExcel', 'Daily_Sales_Record_Template.xlsx');

function resolveProduct(name, temp, size, price) {
  const n = (name || '').toLowerCase().trim();
  const t = (temp || '').toLowerCase().trim();
  const s = (size || '').toLowerCase().trim();

  if (n.includes('americano')) {
    if (t.includes('hot') || (!t.includes('cold') && s.includes('8'))) return s.includes('16') ? 470 : 469;
    return s.includes('8') ? 471 : 472;
  }
  if (n.includes('french vanilla')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? 490 : 489;
    return 492;
  }
  if (n.includes('latte') && !n.includes('spanish') && !n.includes('matcha') && !n.includes('white chocolate') && !n.includes('macadamia')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? 478 : 477;
    return 480;
  }
  if (n.includes('caffe latte')) {
    return s.includes('16') ? 478 : 477;
  }
  if (n.includes('macadamia')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? 482 : 481;
    return 484;
  }
  if (n.includes('irish cream')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? 581 : 580;
    return 585;
  }
  if (n.includes('pink guava') && n.includes('pomegranate')) {
    return 513;
  }
  if (n.includes('pink guava')) {
    return 509;
  }
  if (n.includes('pomegranate')) {
    if (n.includes('tea')) return 517;
    return 511;
  }
  if (n.includes('mango')) {
    if (n.includes('tea')) return 516;
    return 510;
  }
  if (n.includes('lychee')) {
    if (n.includes('tea')) return 514;
    return 512;
  }
  if (n.includes('spanish latte') || n.includes('spanish')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? 498 : 497;
    return 500;
  }
  if (n.includes('choco')) {
    return s.includes('16') ? 579 : 578;
  }
  if (n.includes('mocha')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? 474 : 473;
    return 476;
  }
  if (n.includes('cappuc') || n.includes('cappuccino')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? 502 : 501;
    return 504;
  }
  if (n.includes('butterscotch')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? 486 : 485;
    return 488;
  }
  if (n.includes('caramel mach') || n.includes('caramel macchiato')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? 494 : 493;
    return 496;
  }
  if (n.includes('white chocolate')) {
    if (t.includes('hot') || s.includes('8')) return s.includes('16') ? 506 : 505;
    return 508;
  }
  if (n.includes('black tea')) {
    return s.includes('16') ? 588 : 520;
  }
  if (n.includes('jasmine tea')) {
    return s.includes('16') ? 587 : 519;
  }
  if (n.includes('biscoff') && n.includes('seasalt')) {
    return 583;
  }
  if (n.includes('oreo')) {
    return 584;
  }
  if (n.includes('matcha') && n.includes('seasalt')) {
    return 522;
  }
  return null;
}

async function runImport() {
  console.log('🚀 Starting Daily Sales Record Import & Inventory Deduction...');
  console.log(`📁 Reading from: ${EXCEL_FILE}`);

  const wb = XLSX.readFile(EXCEL_FILE);
  const sheet = wb.Sheets['Detailed Product Sales'];
  if (!sheet) {
    throw new Error("Sheet 'Detailed Product Sales' not found in Excel file!");
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const dataRows = rows.slice(4).filter(r => r && r[0] !== undefined && r[1] !== undefined);
  console.log(`📊 Found ${dataRows.length} sales rows in Excel file.`);

  // 1. Fetch DB Products for branch 30
  const { data: dbProducts, error: prodErr } = await supabase
    .from('products_espresso')
    .select('*')
    .eq('branch_id', BRANCH_ID);

  if (prodErr || !dbProducts) {
    throw new Error(`Failed to fetch branch 30 products: ${prodErr?.message}`);
  }
  console.log(`☕ Loaded ${dbProducts.length} products from branch ${BRANCH_ID}.`);

  // 2. Fetch Receipt Counter
  let currentReceiptNumber = 2000;
  try {
    const { data: counterData } = await supabase
      .from('receipt_counter_espresso')
      .select('current_value')
      .eq('branch_id', BRANCH_ID);
    if (counterData && counterData.length > 0) {
      currentReceiptNumber = Math.max(currentReceiptNumber, Number(counterData[0].current_value));
    }
  } catch (e) {
    console.warn('Could not read receipt_counter_espresso:', e.message);
  }

  // 3. Process and group/sequence items by Date
  const itemsByDate = {};
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
    const payment = r[7] ? String(r[7]).trim() : 'Cash';

    const prodId = resolveProduct(name, temp, size, price);
    if (!prodId) {
      console.error(`❌ Unresolved product at row ${idx + 5}: ${name} (${temp}, ${size}, ${price})`);
      return;
    }

    const dbProd = dbProducts.find(p => p.id === prodId);

    if (!itemsByDate[dateStr]) {
      itemsByDate[dateStr] = [];
    }
    itemsByDate[dateStr].push({
      excelRow: idx + 5,
      date: dateStr,
      name,
      temp,
      size,
      qty,
      price,
      total,
      payment,
      prodId,
      dbProd
    });
  });

  const dates = Object.keys(itemsByDate).sort();
  console.log(`📅 Processing dates (${dates.length}): ${dates.join(', ')}`);

  let totalOrdersCreated = 0;
  let totalItemsInserted = 0;
  let grandTotalSales = 0;
  const stockDeductionSummary = {};

  for (const dateStr of dates) {
    const dayItems = itemsByDate[dateStr];
    console.log(`\n▶️ Processing ${dayItems.length} orders for Date: ${dateStr}...`);

    let minuteCounter = 0;
    for (const item of dayItems) {
      currentReceiptNumber += 1;
      
      // Calculate realistic sequential timestamp on that date (e.g., 09:00, 09:15, etc.)
      const hour = 9 + Math.floor(minuteCounter / 4);
      const minute = (minuteCounter % 4) * 15;
      const orderDate = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`);
      const isoDate = orderDate.toISOString();
      minuteCounter += 1;

      const subtotal = item.total;
      const total = item.total;
      const taxAmount = Number((total - (total / 1.12)).toFixed(4));
      const payMethod = item.payment.toLowerCase().includes('qr') || item.payment.toLowerCase().includes('gcash') ? 'gcash' : 'cash';

      // 1. Insert into orders_espresso
      const orderPayload = {
        branch_id: BRANCH_ID,
        table_id: null,
        order_type: 'takeout',
        status: 'paid',
        subtotal: subtotal,
        discount_id: null,
        discount_amount: 0,
        tax_amount: taxAmount,
        service_charge: 0,
        total: total,
        payment_method: payMethod,
        amount_tendered: total,
        change: 0,
        receipt_number: currentReceiptNumber,
        created_at: isoDate,
        updated_at: isoDate,
        is_training_mode: false,
        notes: `[Imported from Daily Sales Log: ${dateStr}]`
      };

      const { data: createdOrder, error: orderErr } = await supabase
        .from('orders_espresso')
        .insert([orderPayload])
        .select('id')
        .single();

      if (orderErr || !createdOrder) {
        console.error(`❌ Failed to create order for ${item.name} (${dateStr}):`, orderErr?.message);
        continue;
      }

      const orderId = createdOrder.id;
      totalOrdersCreated += 1;
      grandTotalSales += total;

      // 2. Insert into order_items_espresso
      const notes = `[TAKEOUT] ${item.temp ? `[${item.temp}] ` : ''}${item.size ? `[${item.size}]` : ''}`.trim();
      const itemPayload = {
        order_id: orderId,
        product_id: item.prodId,
        quantity: item.qty,
        price: item.price,
        status: 'ordered',
        notes: notes,
        created_at: isoDate,
        is_active: 1
      };

      const { error: itemErr } = await supabase
        .from('order_items_espresso')
        .insert([itemPayload]);

      if (itemErr) {
        console.error(`❌ Failed to insert item for Order #${orderId}:`, itemErr.message);
      } else {
        totalItemsInserted += 1;
      }

      // 3. Deduct Product Stock & Log Inventory Transaction
      const currentStock = Number(item.dbProd.stock || 0);
      const newStock = currentStock - item.qty;
      item.dbProd.stock = newStock; // Keep in-memory stock updated

      // Update stock in products_espresso
      const { error: stockUpdateErr } = await supabase
        .from('products_espresso')
        .update({ stock: newStock })
        .eq('id', item.prodId);

      if (stockUpdateErr) {
        console.error(`⚠️ Failed to update stock for Product #${item.prodId} (${item.dbProd.name}):`, stockUpdateErr.message);
      }

      // Insert inventory transaction
      await supabase
        .from('inventory_transactions_espresso')
        .insert([{
          product_id: item.prodId,
          type: 'out',
          quantity: item.qty,
          remarks: `Sales Order #${orderId} (${item.dbProd.name}) - Log Date ${dateStr}`,
          created_at: isoDate
        }]);

      stockDeductionSummary[item.dbProd.name] = (stockDeductionSummary[item.dbProd.name] || 0) + item.qty;
    }
  }

  // 4. Update receipt_counter_espresso for Branch 30
  try {
    const { data: existingCounter } = await supabase
      .from('receipt_counter_espresso')
      .select('*')
      .eq('branch_id', BRANCH_ID);

    if (existingCounter && existingCounter.length > 0) {
      await supabase
        .from('receipt_counter_espresso')
        .update({ current_value: currentReceiptNumber })
        .eq('branch_id', BRANCH_ID);
    } else {
      await supabase
        .from('receipt_counter_espresso')
        .insert([{ branch_id: BRANCH_ID, current_value: currentReceiptNumber }]);
    }
    console.log(`\n🧾 Receipt Counter for Branch ${BRANCH_ID} updated to: ${currentReceiptNumber}`);
  } catch (e) {
    console.warn('Failed to update receipt counter:', e);
  }

  // 5. Update Grand Accumulating Total (GAT) for Branch 30
  try {
    const { data: gatData } = await supabase
      .from('grand_accumulating_total_espresso')
      .select('*')
      .eq('branch_id', BRANCH_ID);

    if (gatData && gatData.length > 0) {
      const newTotalSales = Number(gatData[0].total_sales || 0) + grandTotalSales;
      const newTotalReceipts = Number(gatData[0].total_receipts || 0) + totalOrdersCreated;
      await supabase
        .from('grand_accumulating_total_espresso')
        .update({
          total_sales: newTotalSales,
          total_receipts: newTotalReceipts,
          updated_at: new Date().toISOString()
        })
        .eq('branch_id', BRANCH_ID);
    } else {
      await supabase
        .from('grand_accumulating_total_espresso')
        .insert([{
          branch_id: BRANCH_ID,
          total_sales: grandTotalSales,
          total_receipts: totalOrdersCreated,
          updated_at: new Date().toISOString()
        }]);
    }
    console.log(`💰 Grand Accumulating Total (GAT) updated for Branch ${BRANCH_ID}.`);
  } catch (gatErr) {
    console.warn('Failed to update GAT:', gatErr);
  }

  console.log('\n======================================================');
  console.log('🎉 DAILY SALES RECORD IMPORT COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
  console.log(`✅ Total Orders Created: ${totalOrdersCreated}`);
  console.log(`✅ Total Items Inserted: ${totalItemsInserted}`);
  console.log(`✅ Total Sales Volume: ₱${grandTotalSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`);
  console.log('\n📦 INVENTORY STOCK DEDUCTION SUMMARY:');
  Object.keys(stockDeductionSummary).sort().forEach(prodName => {
    console.log(`  • ${prodName}: -${stockDeductionSummary[prodName]} unit(s)`);
  });
  console.log('======================================================\n');
}

runImport().catch(err => {
  console.error('💥 Fatal error during import:', err);
  process.exit(1);
});
