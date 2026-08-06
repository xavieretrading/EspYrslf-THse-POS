import express from 'express';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Set system timezone
process.env.TZ = 'Asia/Manila';

const SETTINGS_FILE = path.join(process.cwd(), 'business_settings.json');

function parseItemNotes(notes: string) {
  let is_complimentary = false;
  let complimentary_recipient = null;
  let complimentary_authorized_by = null;
  let complimentary_server = null;
  let complimentary_slip_number = null;

  if (notes && notes.includes('[COMPLIMENTARY:')) {
    const match = notes.match(/\[COMPLIMENTARY:({.*?})\]/);
    if (match) {
      try {
        const details = JSON.parse(match[1]);
        is_complimentary = true;
        complimentary_recipient = details.recipient;
        complimentary_authorized_by = details.authorizedBy;
        complimentary_server = details.server;
        complimentary_slip_number = details.slipNumber || details.slip_number || null;
      } catch (e) {}
    }
  } else if (notes && notes.includes('[COMPLIMENTARY]')) {
    is_complimentary = true;
  }

  return { 
    is_complimentary, 
    complimentary_recipient, 
    complimentary_authorized_by, 
    complimentary_server,
    complimentary_slip_number
  };
}

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aziowvhzfrmtrbypiodm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aW93dmh6ZnJtdHJieXBpb2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQzMTgsImV4cCI6MjEwMDE5MDMxOH0.cCyA0z20cRfGotnzcatm-9AgZRXR0UEyW7SjGBo-HqQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to generate the next unique non-skipped tax-compliant receipt number
async function generateNextReceiptNumber(orderId: string | number, branchId: string | number): Promise<number> {
  const oId = Number(orderId);
  const bId = Number(branchId || 1);

  // 1. First, try DB-level sequence from receipt_counter table
  try {
    const { data, error } = await supabase
      .from('receipt_counter_espresso')
      .select('current_value')
      .eq('branch_id', bId);

    if (!error && data && data.length > 0) {
      const nextVal = Number(data[0].current_value) + 1;
      
      const { error: updateErr } = await supabase
        .from('receipt_counter_espresso')
        .update({ current_value: nextVal })
        .eq('branch_id', bId);

      if (!updateErr) {
        // Also try to persist to orders.receipt_number if column exists
        await supabase
          .from('orders_espresso')
          .update({ receipt_number: nextVal })
          .eq('id', oId);
        
        return nextVal;
      }
    }
  } catch (err) {
    console.error('Error with receipt_counter database sequence:', err);
  }

  // 2. Gracious Fallback: Sync with persistent Branches CONFIG JSON (no DB migrations required, fully sharing-safe!)
  try {
    let settings: any = {};
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      } catch (e) {
        settings = {};
      }
    }

    if (!settings.last_receipt_number) {
      let startSeq = 795;
      try {
        const { data: maxOrderData } = await supabase
          .from('orders_espresso')
          .select('id')
          .eq('status', 'paid')
          .order('id', { ascending: false })
          .limit(1);
        if (maxOrderData && maxOrderData.length > 0) {
          startSeq = Math.max(795, Number(maxOrderData[0].id));
        }
      } catch (e) {}
      settings.last_receipt_number = startSeq;
    }

    if (!settings.receipt_mappings) {
      settings.receipt_mappings = {};
    }

    // Idempotent guard
    if (settings.receipt_mappings[oId]) {
      return Number(settings.receipt_mappings[oId]);
    }

    const nextVal = Number(settings.last_receipt_number) + 1;
    settings.last_receipt_number = nextVal;
    settings.receipt_mappings[oId] = nextVal;

    // Save to server local cache
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');

    // Persist changes back to the Cloud (Supabase branches configuration row)
    await supabase
      .from('branches_espresso')
      .update({ address: JSON.stringify(settings) })
      .eq('name', '__SYSTEM_CONFIG__');

    return nextVal;
  } catch (err) {
    console.error('Error in receipt sequence fallback mechanism:', err);
    return oId; // Ultimate safety fallback
  }
}

async function generateNextOrderNumber(branchId: string | number): Promise<number> {
  const bId = Number(branchId || 1);
  try {
    const { data, error } = await supabase
      .from('order_counter_espresso')
      .select('current_value')
      .eq('branch_id', bId);

    if (!error && data && data.length > 0) {
      const nextVal = Number(data[0].current_value) + 1;
      const { error: updateErr } = await supabase
        .from('order_counter_espresso')
        .update({ current_value: nextVal })
        .eq('branch_id', bId);

      if (!updateErr) return nextVal;
    } else {
      // Initialize sequence for this branch if it doesn't exist
      const { error: insertErr } = await supabase
        .from('order_counter_espresso')
        .insert([{ branch_id: bId, current_value: 1 }]);
      if (!insertErr) return 1;
    }
  } catch (e) {
    console.error('Error in generateNextOrderNumber:', e);
  }
  return 0; // Fallback
}

// Helper to attach receipt number to list/single orders retrieved from database
async function attachReceiptNumbers(orders: any): Promise<any> {
  if (!orders) return orders;
  const isArray = Array.isArray(orders);
  const arr = isArray ? orders : [orders];

  // Try to load current JSON mappings
  let mappings: Record<string, number> = {};
  let lastReceiptNum = 0;
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      if (settings.receipt_mappings) {
        mappings = settings.receipt_mappings;
      }
      if (settings.last_receipt_number !== undefined) {
        lastReceiptNum = Number(settings.last_receipt_number);
      }
    }
  } catch (e) {}

  const mappedKeys = Object.keys(mappings).map(Number);
  const latestCompletedId = mappedKeys.length > 0 ? Math.max(...mappedKeys) : 0;
  const offset = latestCompletedId > 0 && lastReceiptNum > 0 ? (lastReceiptNum - latestCompletedId) : 0;

  const mapped = arr.map((order: any) => {
    let receiptNumber = order.receipt_number;
    if (receiptNumber === undefined || receiptNumber === null) {
      receiptNumber = mappings[order.id];
    }

    // Internal tracking is handled by the order.id (Transaction Number)
    // Receipt Numbers (Invoice Numbers) are strictly assigned only upon successful payment
    if (receiptNumber === undefined || receiptNumber === null) {
      // We do not predict receipt numbers anymore for open orders to comply with BIR gapless sequential rules
    }

    // Fallback to sequential database order ID if mapping still couldn't be loaded (only for completed orders)
    if (!receiptNumber && (order.status === 'paid' || order.status === 'voided' || order.status === 'refunded')) {
      receiptNumber = order.id;
    }

    return {
      ...order,
      receipt_number: receiptNumber || null
    };
  });

  return isArray ? mapped : mapped[0];
}

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API Routes ---

// Terminals
app.get('/api/terminals', async (req, res) => {
  const { branch_id } = req.query;
  const { data, error } = await supabase.from('pos_terminals_espresso').select('*').eq('branch_id', branch_id).order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/terminals', async (req, res) => {
  const { branch_id, name, status } = req.body;
  const { data, error } = await supabase.from('pos_terminals_espresso').insert([{ branch_id, name, status: status || 'active' }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data.id, success: true });
});

app.put('/api/terminals/:id', async (req, res) => {
  const id = req.params.id;
  const { name, status } = req.body;
  const { error } = await supabase.from('pos_terminals_espresso').update({ name, status }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/terminals/:id', async (req, res) => {
  const id = req.params.id;
  const { error } = await supabase.from('pos_terminals_espresso').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Branches
app.get('/api/branches', async (req, res) => {
  const { data, error } = await supabase.from('branches_espresso').select('*');
  if (error) return res.status(500).json({ error: error.message });
  const filtered = (data || []).filter((b: any) => b.name !== '__SYSTEM_CONFIG__');
  res.json(filtered);
});

app.post('/api/branches', async (req, res) => {
  const { name, address, is_bir_compliant } = req.body;
  const { data, error } = await supabase.from('branches_espresso').insert([{ name, address: address || '', is_bir_compliant: !!is_bir_compliant }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data.id, success: true });
});

app.put('/api/branches/:id', async (req, res) => {
  const { name, address, is_bir_compliant } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (address !== undefined) updates.address = address;
  if (is_bir_compliant !== undefined) updates.is_bir_compliant = !!is_bir_compliant;
  
  const { error } = await supabase.from('branches_espresso').update(updates).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/branches/:id', async (req, res) => {
  const id = req.params.id;
  try {
    // 1. Clean up KDS/Orders
    const { data: orders } = await supabase.from('orders_espresso').select('id').eq('branch_id', id);
    if (orders && orders.length > 0) {
      const orderIds = orders.map((o: any) => o.id);
      await supabase.from('order_items_espresso').delete().in('order_id', orderIds);
    }
    await supabase.from('orders_espresso').delete().eq('branch_id', id);

    // 2. Clean up Inventory Transactions
    const { data: prods } = await supabase.from('products_espresso').select('id').eq('branch_id', id);
    if (prods && prods.length > 0) {
      const prodIds = prods.map((p: any) => p.id);
      await supabase.from('inventory_transactions_espresso').delete().in('product_id', prodIds);
    }

    // 3. Clean up dependent tables
    await supabase.from('products_espresso').delete().eq('branch_id', id);
    await supabase.from('categories_espresso').delete().eq('branch_id', id);
    await supabase.from('tables_espresso').delete().eq('branch_id', id);
    await supabase.from('shifts_espresso').delete().eq('branch_id', id);
    await supabase.from('terminals_espresso').delete().eq('branch_id', id);
    await supabase.from('voucher_items_espresso').delete().eq('branch_id', id);
    await supabase.from('business_settings_espresso').delete().eq('branch_id', id);
    await supabase.from('discounts_espresso').delete().eq('branch_id', id);
    await supabase.from('grand_accumulating_total_espresso').delete().eq('branch_id', id);
    await supabase.from('z_readings_espresso').delete().eq('branch_id', id);

    // 4. Update users branch_id to null instead of deleting them to prevent lockouts
    await supabase.from('users_espresso').update({ branch_id: null }).eq('branch_id', id);

    // 5. Finally delete the branch
    const { error } = await supabase.from('branches_espresso').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  const { data, error } = await supabase.from('categories_espresso').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/categories', async (req, res) => {
  const { name, division } = req.body;
  const { data, error } = await supabase.from('categories_espresso').insert([{ name, division: division || 'coffee' }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data.id, success: true });
});

app.delete('/api/categories/:id', async (req, res) => {
  const id = req.params.id;
  
  // Check if products exist in category
  const { count } = await supabase.from('products_espresso').select('*', { count: 'exact', head: true }).eq('category_id', id).eq('is_active', 1);
  if (count && count > 0) {
      return res.status(400).json({ error: 'Cannot delete category that has active products. Please move or delete the products first.' });
  }

  const { error } = await supabase.from('categories_espresso').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Products
app.get('/api/products', async (req, res) => {
  const { branch_id } = req.query;
  let query = supabase.from('products_espresso').select('*, categories:categories_espresso(name, division)').eq('is_active', 1);
  if (branch_id) query = query.eq('branch_id', branch_id);
  
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  
  const products = data.map((p: any) => ({ ...p, category_name: p.categories?.name, division: p.categories?.division || 'coffee' }));
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const { branch_id, category_id, name, price, cost, stock, image_url, is_sellable, unit } = req.body;

  const insertObj: any = {
    branch_id, category_id, name, price, cost: cost || 0, stock: stock || 0, is_active: 1, image_url,
    is_sellable: is_sellable === undefined ? 1 : is_sellable,
    unit: unit || 'pcs'
  };

  let { data, error } = await supabase.from('products_espresso').insert([insertObj]).select().single();
  
  if (error && error.message.includes('unit')) {
    console.warn("⚠️ Warning: 'unit' column not found in database. Retrying save without it. Please run add-unit-column.sql in Supabase SQL Editor.");
    delete insertObj.unit;
    const retryResult = await supabase.from('products_espresso').insert([insertObj]).select().single();
    data = retryResult.data;
    error = retryResult.error;
  }

  if (error && error.message.includes('is_sellable')) {
    console.warn("⚠️ Warning: 'is_sellable' column not found in database. Retrying save without it. Please run add-is-sellable-column.sql.");
    delete insertObj.is_sellable;
    const retryResult = await supabase.from('products_espresso').insert([insertObj]).select().single();
    data = retryResult.data;
    error = retryResult.error;
  }

  if (error) return res.status(500).json({ error: error.message });

  // Log stock transaction on creation if stock is set and not dummy/service stock (9999)
  if (data?.id && stock && stock > 0 && stock !== 9999) {
    await supabase.from('inventory_transactions_espresso').insert([{
      product_id: data.id,
      type: 'in',
      quantity: stock,
      remarks: 'Initial stock on product creation'
    }]);
  }

  res.json({ id: data?.id, success: true });
});

app.put('/api/products/:id', async (req, res) => {
  const { name, price, cost, category_id, stock, image_url, is_sellable, unit } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (price !== undefined) updates.price = price;
  if (cost !== undefined) updates.cost = cost;
  if (category_id !== undefined) updates.category_id = category_id;
  if (stock !== undefined) updates.stock = stock;
  if (image_url !== undefined) updates.image_url = image_url;
  if (is_sellable !== undefined) updates.is_sellable = is_sellable;
  if (unit !== undefined) updates.unit = unit;
  
  // Fetch existing stock value if stock is being modified
  let oldStock = 0;
  if (stock !== undefined) {
    const { data: currentProduct } = await supabase.from('products_espresso').select('stock').eq('id', req.params.id).single();
    if (currentProduct) {
      oldStock = currentProduct.stock || 0;
    }
  }

  let { error } = await supabase.from('products_espresso').update(updates).eq('id', req.params.id);
  
  if (error && error.message.includes('unit')) {
    console.warn("⚠️ Warning: 'unit' column not found in database. Retrying update without it. Please run add-unit-column.sql in Supabase SQL Editor.");
    delete updates.unit;
    const retryResult = await supabase.from('products_espresso').update(updates).eq('id', req.params.id);
    error = retryResult.error;
  }

  if (error && error.message.includes('is_sellable')) {
    console.warn("⚠️ Warning: 'is_sellable' column not found in database. Retrying update without it. Please run add-is-sellable-column.sql.");
    delete updates.is_sellable;
    const retryResult = await supabase.from('products_espresso').update(updates).eq('id', req.params.id);
    error = retryResult.error;
  }

  if (error) return res.status(500).json({ error: error.message });

  // Log stock transaction on edit if stock has changed and is not dummy/service stock (9999)
  if (stock !== undefined && stock !== oldStock && stock !== 9999 && oldStock !== 9999) {
    const diff = stock - oldStock;
    await supabase.from('inventory_transactions_espresso').insert([{
      product_id: parseInt(req.params.id, 10),
      type: diff > 0 ? 'in' : 'out',
      quantity: Math.abs(diff),
      remarks: `Direct stock adjustment via product edit (from ${oldStock} to ${stock})`
    }]);
  }

  res.json({ success: true });
});

app.delete('/api/products/:id', async (req, res) => {
  // Soft delete to prevent breaking orders
  const { error } = await supabase.from('products_espresso').update({ is_active: 0 }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/products/upload-image', async (req, res) => {
  const { name, base64Image } = req.body;
  if (!name || !base64Image) {
    return res.status(400).json({ error: 'Missing product name or image data' });
  }

  try {
    const filename = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '.jpg';
    const filePath = path.join(process.cwd(), 'public', filename);

    // Ensure public folder exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    fs.writeFileSync(filePath, buffer);
    console.log(`Saved product image: ${filename}`);

    res.json({ success: true, url: `/${filename}` });
  } catch (error: any) {
    console.error('Error saving uploaded product image:', error);
    res.status(500).json({ error: error.message || 'Failed to save product image' });
  }
});

app.get('/api/products/:id/recipe', async (req, res) => {
  const { data, error } = await supabase
    .from('product_recipes')
    .select('*, ingredient:products_espresso!ingredient_id(name, stock, price)')
    .eq('product_id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/products/:id/recipe', async (req, res) => {
  const { ingredients } = req.body; // Array of { ingredient_id, quantity }
  
  // Delete existing recipe items
  await supabase.from('product_recipes').delete().eq('product_id', req.params.id);
  
  if (ingredients && ingredients.length > 0) {
    const insertData = ingredients.map((ing: any) => ({
      product_id: parseInt(req.params.id),
      ingredient_id: parseInt(ing.ingredient_id),
      quantity: parseFloat(ing.quantity)
    }));
    const { error } = await supabase.from('product_recipes').insert(insertData);
    if (error) return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
});

// Tables
app.get('/api/tables', async (req, res) => {
  const { branch_id } = req.query;
  let query = supabase.from('tables_espresso').select('*, orders:orders_espresso(id, status)');
  if (branch_id) query = query.eq('branch_id', branch_id);
  
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  
  // Filter for active (open) orders only for each table
  const results = data.map((t: any) => ({
    ...t,
    active_order_id: t.orders?.find((o: any) => o.status === 'open')?.id || null
  }));

  res.json(results);
});

app.post('/api/tables', async (req, res) => {
  const { branch_id, name, capacity } = req.body;
  const { data, error } = await supabase.from('tables_espresso').insert([{ branch_id, name, capacity }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data.id, success: true });
});

app.put('/api/tables/:id', async (req, res) => {
  const { name, capacity } = req.body;
  const { error } = await supabase
    .from('tables_espresso')
    .update({ name, capacity })
    .eq('id', req.params.id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/tables/:id', async (req, res) => {
  const { error } = await supabase.from('tables_espresso').delete().eq('id', parseInt(req.params.id));
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.put('/api/tables/:id/status', async (req, res) => {
  const { status } = req.body;
  const { error } = await supabase.from('tables_espresso').update({ status }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

const USERS_FILE = path.join(process.cwd(), 'users.json');

// Helper to keep JSON as backup/legacy
function readUsersLocal() {
  try { 
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch { return []; }
}

async function getSupabaseUsers() {
  const { data, error } = await supabase.from('users_espresso').select('*').eq('is_active', 1);
  if (error) {
    console.error('Supabase users fetch error:', error.message);
    // Fallback to local JSON if table or column doesn't exist
    if (error.message.includes('Could not find the table') || error.message.includes("'email' column")) {
      return readUsersLocal().filter((u: any) => u.is_active === 1);
    }
    throw error;
  }
  return data || [];
}

async function syncUsersToSupabase() {
  try {
    const { data: dbUsers, error } = await supabase.from('users_espresso').select('id').limit(1);
    // If table exists and is empty, try to seed from JSON
    if (!error && (!dbUsers || dbUsers.length === 0)) {
      const localUsers = readUsersLocal();
      if (localUsers.length > 0) {
        console.log('Migrating local users to Supabase...');
        for (const user of localUsers) {
          const { id, branch_name, ...userData } = user; // Exclude virtual fields
          await supabase.from('users_espresso').insert([userData]);
        }
      }
    }
  } catch (e) {
    console.error('Sync to Supabase failed:', e);
  }
}

// Users API
app.get('/api/users', async (req, res) => {
  try {
    const users = await getSupabaseUsers();
    const branchIds = [...new Set(users.map((u: any) => u.branch_id).filter(Boolean))];
    let branches: any[] = [];
    
    if (branchIds.length > 0) {
      const { data } = await supabase.from('branches_espresso').select('id, name').in('id', branchIds);
      if (data) branches = data;
    }
    
    const mapped = users.map((u: any) => ({
      ...u,
      branch_name: branches.find(b => b.id === u.branch_id)?.name
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password, role, full_name, branch_id, permissions } = req.body;
    
    // Check if exists
    const users = await getSupabaseUsers();
    if (users.find((u:any) => u.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const userData = {
      username,
      email,
      password,
      role,
      permissions: permissions || (role === 'admin' ? 
        { '/': 'admin', '/pos': 'admin', '/orders': 'admin', '/kitchen': 'admin', '/tables': 'admin', '/inventory': 'admin', '/vouchers': 'admin', '/reports': 'admin', '/settings': 'admin' } : 
        { '/pos': 'edit' }),
      full_name,
      branch_id: branch_id ? parseInt(branch_id) : null,
      is_active: 1
    };
    
    const { data, error } = await supabase.from('users_espresso').insert([userData]).select().single();
    
    if (error) {
       // If table missing or column missing, fallback to JSON
       if (error.message.includes('Could not find the table') || error.message.includes("'email' column")) {
          const localUsers = readUsersLocal();
          const newId = localUsers.length > 0 ? Math.max(...localUsers.map((u:any) => u.id)) + 1 : 1;
          const newUser = { id: newId, ...userData };
          localUsers.push(newUser);
          fs.writeFileSync(USERS_FILE, JSON.stringify(localUsers, null, 2));
          return res.json({ id: newId, success: true });
       }
       return res.status(500).json({ error: error.message });
    }
    
    res.json({ id: data.id, success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { username, email, password, role, full_name, branch_id, permissions } = req.body;
    const updates: any = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (password !== undefined && password.trim() !== '') updates.password = password; 
    if (role !== undefined) updates.role = role;
    if (permissions !== undefined) updates.permissions = permissions;
    if (full_name !== undefined) updates.full_name = full_name;
    if (branch_id !== undefined) updates.branch_id = branch_id ? parseInt(branch_id) : null;
    
    const { error } = await supabase.from('users_espresso').update(updates).eq('id', req.params.id);
    
    if (error) {
       // Fallback to JSON if table or column missing
       if (error.message.includes('Could not find the table') || error.message.includes("'email' column")) {
          const localUsers = readUsersLocal();
          const idx = localUsers.findIndex((u:any) => u.id === parseInt(req.params.id));
          if (idx !== -1) {
             localUsers[idx] = { ...localUsers[idx], ...updates };
             fs.writeFileSync(USERS_FILE, JSON.stringify(localUsers, null, 2));
             return res.json({ success: true });
          }
       }
       return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('users_espresso').update({ is_active: 0 }).eq('id', req.params.id);
    if (error) {
       if (error.message.includes('Could not find the table') || error.message.includes("'email' column")) {
          const localUsers = readUsersLocal();
          const idx = localUsers.findIndex((u:any) => u.id === parseInt(req.params.id));
          if (idx !== -1) {
             localUsers[idx].is_active = 0;
             fs.writeFileSync(USERS_FILE, JSON.stringify(localUsers, null, 2));
             return res.json({ success: true });
          }
       }
       return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Shifts API
app.get('/api/shifts/current', async (req, res) => {
  const { user_id, branch_id } = req.query;
  
  if (!user_id || user_id === 'undefined' || user_id === 'null' || !branch_id || branch_id === 'undefined' || branch_id === 'null') {
    return res.json(null);
  }
  
  const uId = parseInt(user_id as string, 10);
  const bId = parseInt(branch_id as string, 10);
  if (isNaN(uId) || isNaN(bId)) {
    return res.json(null);
  }

  const { data, error } = await supabase
    .from('shifts_espresso')
    .select('*')
    .eq('user_id', uId)
    .eq('branch_id', bId)
    .eq('status', 'open')
    .order('id', { ascending: false })
    .limit(1);
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data && data.length > 0 ? data[0] : null);
});

app.post('/api/shifts/start', async (req, res) => {
  const { user_id, branch_id, cash_in } = req.body;
  if (!user_id || user_id === 'undefined' || user_id === 'null' || !branch_id || branch_id === 'undefined' || branch_id === 'null') {
    return res.status(400).json({ error: 'Invalid user_id or branch_id supplied' });
  }
  
  const uId = parseInt(user_id, 10);
  const bId = parseInt(branch_id, 10);
  if (isNaN(uId) || isNaN(bId)) {
    return res.status(400).json({ error: 'Invalid user_id or branch_id format' });
  }

  // Check if there is already an open shift
  const { data: existingShift, error: existingErr } = await supabase
    .from('shifts_espresso')
    .select('*')
    .eq('user_id', uId)
    .eq('branch_id', bId)
    .eq('status', 'open')
    .order('id', { ascending: false })
    .limit(1);

  if (!existingErr && existingShift && existingShift.length > 0) {
     return res.json(existingShift[0]);
  }

  const { data, error } = await supabase
    .from('shifts_espresso')
    .insert([{ user_id: uId, branch_id: bId, cash_in: parseFloat(cash_in || '0'), status: 'open' }])
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/shifts/end', async (req, res) => {
  try {
    const { shift_id, cash_out } = req.body;
    console.log('[End Shift] received body:', req.body);
    
    if (!shift_id) {
      console.error('[End Shift] missing shift_id');
      return res.status(400).json({ error: 'Missing shift_id' });
    }
    
    const idNum = parseInt(shift_id, 10);
    if (isNaN(idNum)) {
      console.error('[End Shift] invalid shift_id:', shift_id);
      return res.status(400).json({ error: 'Invalid shift_id format' });
    }
    
    const { data: shift, error: shiftError } = await supabase
      .from('shifts_espresso')
      .select('*')
      .eq('id', idNum)
      .single();
      
    if (shiftError) {
      console.error('[End Shift] shift fetch error from Supabase:', shiftError);
      return res.status(500).json({ error: shiftError.message });
    }
    
    if (!shift) {
      console.error('[End Shift] shift not found in db for id:', idNum);
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    let totalSales = 0;
    if (shift.time_in) {
      const { data: orders, error: ordersError } = await supabase
        .from('orders_espresso')
        .select('total')
        .eq('branch_id', shift.branch_id)
        .gte('created_at', shift.time_in)
        .eq('status', 'paid');
        
      if (ordersError) {
        console.error('[End Shift] orders fetch error from Supabase:', ordersError);
      } else if (orders) {
        totalSales = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      }
    } else {
      console.warn('[End Shift] shift has null time_in, using totalSales = 0');
    }
    
    const cashOutVal = parseFloat(cash_out || '0');
    
    // Also close any older stray open shifts for this user and branch to ensure clean state
    if (shift && shift.user_id && shift.branch_id) {
      try {
        await supabase
          .from('shifts_espresso')
          .update({
            status: 'closed',
            time_out: new Date().toISOString(),
            total_sales: 0,
            cash_out: 0
          })
          .eq('user_id', shift.user_id)
          .eq('branch_id', shift.branch_id)
          .eq('status', 'open')
          .neq('id', idNum);
      } catch (e) {
        console.error('[End Shift] error auto-closing stray open shifts:', e);
      }
    }
    
    const { data, error } = await supabase
      .from('shifts_espresso')
      .update({ 
        cash_out: isNaN(cashOutVal) ? 0 : cashOutVal, 
        total_sales: totalSales, 
        status: 'closed', 
        time_out: new Date().toISOString() 
      })
      .eq('id', idNum)
      .select()
      .single();
    
    if (error) {
      console.error('[End Shift] shift update error in Supabase:', error);
      return res.status(500).json({ error: error.message });
    }

    // Generate Z-Reading record for BIR compliance
    try {
      if (shift && shift.time_in) {
        const { data: ordersForZ } = await supabase
          .from('orders_espresso')
          .select('*')
          .eq('branch_id', shift.branch_id)
          .gte('updated_at', shift.time_in);

        if (ordersForZ) {
          const paidOrders = ordersForZ.filter((o: any) => o.status === 'paid');
          const voidedOrders = ordersForZ.filter((o: any) => o.status === 'voided');

          let grossSales = 0;
          let netSales = 0;
          let vatAmount = 0;
          let vatExemptSales = 0;
          let discountTotal = 0;
          let serviceChargeTotal = 0;
          let cashTotal = 0;
          let nonCashTotal = 0;
          let voidTotal = 0;
          let receiptStartNo: any = null;
          let receiptEndNo: any = null;

          paidOrders.forEach((o: any) => {
            grossSales += o.subtotal || 0;
            netSales += o.total || 0;
            vatAmount += o.tax_amount || 0;
            discountTotal += o.discount_amount || 0;
            serviceChargeTotal += o.service_charge || 0;

            if (o.tax_amount === 0 && o.discount_amount > 0) {
              vatExemptSales += (o.subtotal || 0);
            }

            const pm = (o.payment_method || 'cash').toLowerCase();
            if (pm === 'cash') {
              cashTotal += o.total || 0;
            } else {
              nonCashTotal += o.total || 0;
            }

            const rNum = o.receipt_number || o.id;
            if (rNum) {
              if (receiptStartNo === null || rNum < receiptStartNo) receiptStartNo = rNum;
              if (receiptEndNo === null || rNum > receiptEndNo) receiptEndNo = rNum;
            }
          });

          voidedOrders.forEach((o: any) => {
            voidTotal += o.total || 0;
          });

          let oldGrandTotal = 0;
          let newGrandTotal = 0;
          const { data: gatData } = await supabase.from('grand_accumulating_total_espresso').select('*').eq('branch_id', shift.branch_id).maybeSingle();
          if (gatData) {
            newGrandTotal = Number(gatData.total_sales);
            oldGrandTotal = Math.max(0, newGrandTotal - netSales);
          }

          const { count: zCount } = await supabase.from('z_readings_espresso').select('*', { count: 'exact', head: true }).eq('branch_id', shift.branch_id);
          const nextZCounter = (zCount || 0) + 1;

          let generatedBy = 'Staff';
          if (shift.user_id) {
            const { data: uData } = await supabase.from('users_espresso').select('username').eq('id', shift.user_id).maybeSingle();
            if (uData) generatedBy = uData.username || 'Staff';
          }

          await supabase.from('z_readings_espresso').insert([{
            branch_id: shift.branch_id,
            z_counter: nextZCounter,
            generated_by: generatedBy,
            gross_sales: grossSales,
            net_sales: netSales,
            vat_amount: vatAmount,
            vat_exempt_sales: vatExemptSales,
            discount_total: discountTotal,
            service_charge_total: serviceChargeTotal,
            cash_total: cashTotal,
            non_cash_total: nonCashTotal,
            void_total: voidTotal,
            receipt_start_no: receiptStartNo ? Number(receiptStartNo) : null,
            receipt_end_no: receiptEndNo ? Number(receiptEndNo) : null,
            old_grand_total: oldGrandTotal,
            new_grand_total: newGrandTotal
          }]);
        }
      }
    } catch (zErr) {
      console.error('Error logging Z-Reading to DB:', zErr);
    }
    
    res.json(data);
  } catch (err: any) {
    console.error('[End Shift] unexpected exception caught:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.get('/api/shifts/report', async (req, res) => {
  const { branch_id, start_date, end_date, user_id, start_time, end_time } = req.query;
  let query = supabase.from('shifts_espresso').select(`
    *,
    users:users_espresso (id, full_name, username)
  `);
  
  if (branch_id) query = query.eq('branch_id', branch_id);
  if (start_date) query = query.gte('time_in', start_date);
  if (end_date) query = query.lte('time_in', end_date);
  if (user_id) query = query.eq('user_id', user_id);
  
  const { data, error } = await query.order('time_in', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  // Get settings for report hours
  let reportStartTime = (start_time as string) || '06:00';
  let reportEndTime = (end_time as string) || '05:59';
  
  if (!start_time && !end_time) {
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        if (settings.report_start_time) reportStartTime = settings.report_start_time;
        if (settings.report_end_time) reportEndTime = settings.report_end_time;
      } catch (e) {}
    }
  }
  const isNextDayEnd = reportEndTime < reportStartTime;

  const filtered = data.filter((s: any) => {
    if (!start_date && !end_date) return true;
    
    const utDate = new Date(s.time_in);
    const sDate = start_date as string;
    const eDate = end_date as string;

    const startBoundary = new Date(`${sDate}T${reportStartTime}:00`);
    let endBoundary = new Date(`${eDate}T${reportEndTime}:00`);
    if (isNextDayEnd) {
      endBoundary.setDate(endBoundary.getDate() + 1);
    }

    return utDate >= startBoundary && utDate <= endBoundary;
  });

  // Fetch the itemised orders/products for each filtered shift
  const filteredWithDetails = await Promise.all(filtered.map(async (s: any) => {
    const tOut = s.time_out || new Date().toISOString();
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders_espresso')
      .select('*, order_items:order_items_espresso(*, products:products_espresso(name))')
      .eq('branch_id', s.branch_id)
      .eq('status', 'paid')
      .gte('updated_at', s.time_in)
      .lte('updated_at', tOut);
      
    if (ordersError) {
      console.error(`Error fetching orders for shift ${s.id}:`, ordersError);
      s.orders = [];
    } else {
      const ordersWithNo = await attachReceiptNumbers(orders || []);
      s.orders = ordersWithNo;
      
      if (ordersWithNo.length > 0) {
        // Fetch voucher redemptions and active voucher item points for correct mapping
        const orderIds = ordersWithNo.map(o => o.id);
        const { data: redemptions } = await supabase
          .from('voucher_redemptions_espresso')
          .select('order_id, product_id, points_used')
          .in('order_id', orderIds);
          
        const { data: voucherItems } = await supabase
          .from('voucher_items_espresso')
          .select('product_id, points_required');
          
        const redMap = new Map();
        if (redemptions) {
          redemptions.forEach((r: any) => {
            redMap.set(`${r.order_id}-${r.product_id}`, r.points_used);
          });
        }
        
        const vMap = new Map();
        if (voucherItems) {
          voucherItems.forEach((vi: any) => {
            vMap.set(vi.product_id, vi.points_required);
          });
        }
        
        orders.forEach((o: any) => {
          if (o.order_items) {
            o.order_items.forEach((item: any) => {
              const isVoucher = o.payment_method?.toUpperCase() === 'VOUCHER' || item.notes?.includes('Voucher') || item.notes?.includes('(Voucher)');
              const points = redMap.get(`${o.id}-${item.product_id}`) || (isVoucher ? vMap.get(item.product_id) : 0) || 0;
              item.points_used = points;
            });
          }
        });
      }
    }
    return s;
  }));

  res.json(filteredWithDetails);
});

// Discounts
app.get('/api/discounts', async (req, res) => {
  const { data, error } = await supabase.from('discounts_espresso').select('*').eq('is_active', 1);
  if (error) return res.status(500).json({ error: error.message });
  
  // Dynamically populate requires_id based on name (e.g., Senior, PWD, Exempt)
  const mapped = (data || []).map(d => ({
    ...d,
    requires_id: (d.name && (d.name.toLowerCase().includes('senior') || d.name.toLowerCase().includes('pwd') || d.name.toLowerCase().includes('exempt'))) ? 1 : 0
  }));
  res.json(mapped);
});

app.post('/api/discounts', async (req, res) => {
  const { name, type, value, requires_id } = req.body;
  const { data, error } = await supabase.from('discounts_espresso').insert([{ name, type, value: parseFloat(value) || 0 }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ...data, requires_id: requires_id ? 1 : 0 });
});

app.put('/api/discounts/:id', async (req, res) => {
  const { name, type, value } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type;
  if (value !== undefined) updates.value = parseFloat(value) || 0;
  
  const { error } = await supabase.from('discounts_espresso').update(updates).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/discounts/:id', async (req, res) => {
  const { error } = await supabase.from('discounts_espresso').update({ is_active: 0 }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// QZ security keys
let qzPrivateKey: string = '';
let qzCertificate: string = '';

// Generate keys if not already present or load them
function ensureQzKeys() {
  if (qzPrivateKey && qzCertificate) return;

  try {
    // Generate RSA 2048 keypair
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    qzPrivateKey = privateKey;
    
    // Create certificate PEM string
    qzCertificate = `-----BEGIN CERTIFICATE-----\n` +
      publicKey.replace(/-----BEGIN PUBLIC KEY-----/g, '')
        .replace(/-----END PUBLIC KEY-----/g, '')
        .trim() +
      `\n-----END CERTIFICATE-----`;

  } catch (err) {
    console.error("Error generating QZ keys:", err);
  }
}

app.get('/api/qz/certificate', (req, res) => {
  ensureQzKeys();
  res.header('Content-Type', 'text/plain');
  res.send(qzCertificate);
});

app.post('/api/qz/sign', (req, res) => {
  ensureQzKeys();
  const requestVal = req.body.request || req.query.request;
  if (!requestVal) {
    return res.status(400).send('Request payload is required');
  }

  try {
    const signer = crypto.createSign('SHA512');
    signer.update(requestVal);
    const signature = signer.sign(qzPrivateKey, 'base64');
    res.header('Content-Type', 'text/plain');
    res.send(signature);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.post('/api/orders', async (req, res) => {
  const { branch_id, table_id, order_type, items, notes } = req.body;
  
  // Calculate subtotal & total BEFORE order insertion to save a DB update roundtrip!
  let subtotal = 0;
  if (items && Array.isArray(items)) {
    items.forEach((item: any) => {
      if (!item.is_complimentary) {
        subtotal += (item.price || 0) * (item.quantity || 1);
      }
    });
  }

  const orderPayload: any = { 
    branch_id, 
    table_id: table_id || null, 
    status: 'open', 
    notes: notes || null,
    subtotal: subtotal,
    total: subtotal
  };
  if (order_type) orderPayload.order_type = order_type;
  
  const nextOrderNumber = await generateNextOrderNumber(branch_id);
  if (nextOrderNumber > 0) {
    orderPayload.order_number = nextOrderNumber;
  }
  
  let { data: orderData, error: orderError } = await supabase
    .from('orders_espresso')
    .insert([orderPayload])
    .select().single();
    
  if (orderError && orderError.message.includes("'order_type' column")) {
     // Fallback for transition
     delete orderPayload.order_type;
     const { data: retryData, error: retryError } = await supabase
       .from('orders_espresso')
       .insert([orderPayload])
       .select().single();
     orderData = retryData;
     orderError = retryError;
  }
    
  if (orderError) return res.status(500).json({ error: orderError.message });
  const orderId = orderData.id;

  const orderItems = items.map((item: any) => {
    let finalNotes = item.notes || '';
    if (item.is_complimentary) {
        const details = {
            recipient: item.complimentary_recipient,
            authorizedBy: item.complimentary_authorized_by,
            server: item.complimentary_server,
            slipNumber: item.complimentary_slip_number || null
        };
        const tag = `[COMPLIMENTARY:${JSON.stringify(details)}]`;
        finalNotes = finalNotes ? `${finalNotes} ${tag}` : tag;
    }

    return {
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity || 1,
      price: item.price || 0,
      notes: finalNotes,
      status: 'ordered',
      discount_id: item.discount_id || null,
      discount_amount: item.discount_amount || 0,
      is_vat_exempt: item.is_vat_exempt || false
    };
  });

  const { error: itemError } = await supabase.from('order_items_espresso').insert(orderItems);
  if (itemError) {
    console.error('Order items insert error:', itemError.message);
    return res.status(500).json({ error: 'Failed to insert order items: ' + itemError.message });
  }

  // Update table status asynchronously so we don't await the network response!
  if (table_id) {
    (async () => {
      try {
        await supabase.from('tables_espresso').update({ status: 'occupied' }).eq('id', table_id);
      } catch (err) {
        console.error('Table status update error:', err);
      }
    })();
  }

  res.json({ id: orderId, success: true });
});

app.get('/api/orders/history', async (req, res) => {
  const { branch_id, filter } = req.query;
  // filter can be 'today', 'week', 'month', 'custom'
  // for 'custom', we pass start_date and end_date
  let query = supabase.from('orders_espresso').select(`
    *,
    tables:tables_espresso (id, name),
    branches:branches_espresso (id, name, address),
    order_items:order_items_espresso (*, products:products_espresso (id, name, price)),
    discounts:discounts_espresso (id, name)
  `).order('created_at', { ascending: false });
  
  if (branch_id) query = query.eq('branch_id', branch_id);
  
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const now = new Date();
  
  const filterDate = (dateStr: string) => {
    if (filter === 'vouchers') return true; 
    
    const d = new Date(dateStr);
    switch(filter) {
      case 'today':
        return d.toDateString() === now.toDateString();
      case 'week': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return d >= startOfWeek;
      }
      case 'month':
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      case 'custom': {
        const { start_date, end_date } = req.query;
        if (start_date && end_date) {
            return d >= new Date(start_date as string) && d <= new Date(end_date as string);
        }
        return true;
      }
      default:
        return true;
    }
  };

  const filteredOrdersBase = data.filter((o: any) => {
      if (filter === 'vouchers') {
          const paymentVoucher = o.payment_method?.toLowerCase() === 'voucher';
          const oItemsRaw = o.order_items || [];
          const oItems = Array.isArray(oItemsRaw) ? oItemsRaw : [oItemsRaw];
          const hasVoucherItem = oItems.some((oi: any) => oi.notes?.includes('(Voucher)'));
          return paymentVoucher || hasVoucherItem;
      }
      return filterDate(o.created_at);
    });

  // Fetch redemptions and active voucher item points for correct mapping
  const orderIds = filteredOrdersBase.map(o => o.id);
  const redMap = new Map();
  const vMap = new Map();

  if (orderIds.length > 0) {
    const { data: redemptions } = await supabase
      .from('voucher_redemptions_espresso')
      .select('order_id, product_id, points_used')
      .in('order_id', orderIds);
      
    const { data: voucherItems } = await supabase
      .from('voucher_items_espresso')
      .select('product_id, points_required');
      
    if (redemptions) {
      redemptions.forEach((r: any) => {
        redMap.set(`${r.order_id}-${r.product_id}`, r.points_used);
      });
    }
    
    if (voucherItems) {
      voucherItems.forEach((vi: any) => {
        vMap.set(vi.product_id, vi.points_required);
      });
    }
  }

  const filteredOrders = filteredOrdersBase.map((order: any) => {
      const table = Array.isArray(order.tables) ? order.tables[0] : order.tables;
      const discount = Array.isArray(order.discounts) ? order.discounts[0] : order.discounts;
      const branch = Array.isArray(order.branches) ? order.branches[0] : order.branches;
      const oItemsRaw = order.order_items || [];
      const oItems = Array.isArray(oItemsRaw) ? oItemsRaw : [oItemsRaw];

      let realSubtotal = order.subtotal || 0;
      let realTotal = order.total || 0;

      if (oItems.length > 0) {
        const calculatedItemSubtotal = oItems.reduce((sum: number, oi: any) => {
          const isComp = oi.is_complimentary || (oi.notes && oi.notes.includes('[COMPLIMENTARY'));
          const pr = oi.price || (oi.products ? (Array.isArray(oi.products) ? oi.products[0]?.price : oi.products?.price) : 0) || 0;
          return sum + (isComp ? 0 : (pr * (oi.quantity || 1)));
        }, 0);

        if (calculatedItemSubtotal > 0) {
          realSubtotal = calculatedItemSubtotal;
          realTotal = Math.max(0, calculatedItemSubtotal - (order.discount_amount || 0));
          
          if (Math.abs((order.total || 0) - realTotal) > 0.01) {
            order.subtotal = realSubtotal;
            order.total = realTotal;
            // Sync database asynchronously
            supabase.from('orders_espresso').update({ subtotal: realSubtotal, total: realTotal }).eq('id', order.id).then(() => {});
          }
        }
      }
      
      return {
        ...order,
        subtotal: realSubtotal,
        total: realTotal,
        table_name: table?.name,
        discount_name: discount?.name,
        branch_name: branch?.name,
        branch_address: branch?.address,
        items: oItems.map((oi: any) => {
          const product = Array.isArray(oi.products) ? oi.products[0] : oi.products;
          const comp = parseItemNotes(oi.notes);
          const isVoucher = order.payment_method?.toUpperCase() === 'VOUCHER' || oi.notes?.includes('Voucher') || oi.notes?.includes('(Voucher)');
          const points = redMap.get(`${order.id}-${oi.product_id}`) || (isVoucher ? vMap.get(oi.product_id) : 0) || 0;
          return { 
            ...oi, 
            name: product?.name,
            product_name: product?.name,
            products: product, // Compatibility
            points_used: points,
            ...comp
          };
        })
      };
    });

  const ordersWithNo = await attachReceiptNumbers(filteredOrders);
  res.json(ordersWithNo);
});

app.post('/api/orders/:id/reprint', async (req, res) => {
  const orderId = req.params.id;
  
  // Increment reprint_count
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders_espresso')
    .select('reprint_count')
    .eq('id', orderId)
    .single();

  if (fetchError) return res.status(500).json({ error: fetchError.message });

  const { error } = await supabase
    .from('orders_espresso')
    .update({
      reprint_count: (currentOrder?.reprint_count || 0) + 1,
      last_reprinted_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true, message: 'Reprint tracked' });
});

app.post('/api/orders/:id/void', async (req, res) => {
  const orderId = req.params.id;
  const { reason } = req.body;
  
  // Update status to 'voided'
  const { data: order, error } = await supabase.from('orders_espresso').update({
    status: 'voided',
    updated_at: new Date().toISOString()
  }).eq('id', orderId).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Free up table if occupied
  if (order && order.table_id) {
    await supabase.from('tables_espresso').update({ status: 'available' }).eq('id', order.table_id);
  }

  res.json({ success: true, message: 'Order voided' });
});

app.post('/api/orders/:id/refund', async (req, res) => {
  const orderId = req.params.id;
  const { reason, refund_method, issued_to } = req.body;

  // Make sure it's paid before refunding
  const { data: currentOrder } = await supabase.from('orders_espresso').select('status, total, branch_id').eq('id', orderId).single();
  
  if (currentOrder?.status !== 'paid') {
      return res.status(400).json({ error: 'Only paid orders can be refunded' });
  }

  // Update status to 'refunded'
  const { data: order, error } = await supabase.from('orders_espresso').update({
    status: 'refunded',
    updated_at: new Date().toISOString()
  }).eq('id', orderId).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Issue store credit if requested
  let storeCredit = null;
  if (refund_method === 'store_credit') {
    const { data: scData, error: scErr } = await supabase.from('store_credits_espresso').insert([{
      branch_id: currentOrder?.branch_id || 1,
      amount: currentOrder?.total || 0,
      status: 'active',
      issued_to: issued_to || 'Walk-in Customer',
      reference_order_id: parseInt(orderId)
    }]).select().single();
    
    if (scErr) {
      console.error("Error creating store credit during refund:", scErr);
    } else {
      storeCredit = scData;
    }
  }

  // Return inventory
  const { data: items } = await supabase.from('order_items_espresso').select('product_id, quantity, notes').eq('order_id', orderId);
  if (items) {
    for (const item of items) {
      // 1. Restore product itself
      const { data: product } = await supabase.from('products_espresso').select('name, stock').eq('id', item.product_id).single();
      const newStock = (product?.stock || 0) + item.quantity;
      await supabase.from('products_espresso').update({ stock: newStock }).eq('id', item.product_id);
      
      await supabase.from('inventory_transactions_espresso').insert([{
        product_id: item.product_id,
        type: 'in',
        quantity: item.quantity,
        remarks: `Refund Order #${orderId}` + (reason ? ` - ${reason}` : '')
      }]);

      // 2. Restore recipe ingredients if defined
      const { data: recipe } = await supabase.from('product_recipes').select('ingredient_id, quantity').eq('product_id', item.product_id);
      if (recipe && recipe.length > 0) {
        for (const recItem of recipe) {
          const { data: ing } = await supabase.from('products_espresso').select('name, stock').eq('id', recItem.ingredient_id).single();
          
          let factor = 1.0;
          if (ing && ing.name.toLowerCase().includes('sugar') && item.notes) {
            const notes = item.notes;
            if (notes.includes('[Sugar: 50%]') || notes.includes('Sugar: 50%') || notes.includes('Sugar Level: 50%')) factor = 0.5;
            else if (notes.includes('[Sugar: 25%]') || notes.includes('Sugar: 25%') || notes.includes('Sugar Level: 25%')) factor = 0.25;
            else if (notes.includes('[Sugar: 75%]') || notes.includes('Sugar: 75%') || notes.includes('Sugar Level: 75%')) factor = 0.75;
            else if (notes.includes('[Sugar: 0%]') || notes.includes('Sugar: 0%') || notes.includes('Sugar Level: 0%') || notes.includes('Sugar Level: No Sugar')) factor = 0.0;
          }

          const restoreQty = recItem.quantity * item.quantity * factor;
          const newIngStock = (ing?.stock || 0) + restoreQty;
          
          await supabase.from('products_espresso').update({ stock: newIngStock }).eq('id', recItem.ingredient_id);
          await supabase.from('inventory_transactions_espresso').insert([{
            product_id: recItem.ingredient_id,
            type: 'in',
            quantity: restoreQty,
            remarks: `Refund Restore Recipe for Order #${orderId} (Parent: ${product?.name || 'Item'})` + (factor !== 1.0 ? ` (Sugar: ${(factor * 100).toFixed(0)}%)` : '')
          }]);
        }
      }
    }
  }

  res.json({ success: true, message: 'Order refunded and inventory restored', store_credit: storeCredit });
});

// Create Store Credit
app.post('/api/store-credits', async (req, res) => {
  const { branch_id, amount, issued_to, reference_order_id } = req.body;
  const { data, error } = await supabase.from('store_credits_espresso').insert([{
    branch_id: branch_id || 1,
    amount: parseFloat(amount),
    status: 'active',
    issued_to: issued_to || 'Walk-in Customer',
    reference_order_id: reference_order_id ? parseInt(reference_order_id) : null
  }]).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

// Search Active Store Credits
app.get('/api/store-credits/search', async (req, res) => {
  const { query, branch_id } = req.query;
  let q = supabase.from('store_credits_espresso').select('*').eq('status', 'active');
  if (branch_id) q = q.eq('branch_id', branch_id);
  
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  
  const filtered = (data || []).filter((sc: any) => {
    if (!query) return true;
    const str = query.toString().toLowerCase();
    return sc.id.toString().includes(str) || (sc.issued_to && sc.issued_to.toLowerCase().includes(str));
  });
  
  res.json(filtered);
});

app.get('/api/orders/active', async (req, res) => {
  const { branch_id } = req.query;
  let query = supabase.from('orders_espresso').select('*, tables:tables_espresso(name), order_items:order_items_espresso(*, products:products_espresso(name))').eq('status', 'open');
  if (branch_id) query = query.eq('branch_id', branch_id);
  
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const orders = data.map((order: any) => {
    const table = Array.isArray(order.tables) ? order.tables[0] : order.tables;
    const oItemsRaw = order.order_items || [];
    const oItems = Array.isArray(oItemsRaw) ? oItemsRaw : [oItemsRaw];

    return {
      ...order,
      table_name: table?.name,
      items: oItems.map((oi: any) => {
        const product = Array.isArray(oi.products) ? oi.products[0] : oi.products;
        return { 
          ...oi, 
          name: product?.name,
          product_name: product?.name,
          products: product // Compatibility
        };
      })
    };
  });

  res.json(orders);
});

app.get('/api/orders/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('orders_espresso')
    .select(`
      *,
      tables:tables_espresso (id, name),
      branches:branches_espresso (id, name, address),
      order_items:order_items_espresso (*, products:products_espresso (id, name, price)),
      discounts:discounts_espresso (id, name)
    `)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Order not found' });

  // Fetch redemptions and active voucher item points for correct mapping
  const { data: redemptions } = await supabase
    .from('voucher_redemptions_espresso')
    .select('product_id, points_used')
    .eq('order_id', req.params.id);

  const { data: voucherItems } = await supabase
    .from('voucher_items_espresso')
    .select('product_id, points_required');

  const redMap = new Map();
  if (redemptions) {
    redemptions.forEach((r: any) => {
      redMap.set(r.product_id, r.points_used);
    });
  }

  const vMap = new Map();
  if (voucherItems) {
    voucherItems.forEach((vi: any) => {
      vMap.set(vi.product_id, vi.points_required);
    });
  }

  const table = Array.isArray(data.tables) ? data.tables[0] : data.tables;
  const discount = Array.isArray(data.discounts) ? data.discounts[0] : data.discounts;
  const branch = Array.isArray(data.branches) ? data.branches[0] : data.branches;
  const oItemsRaw = data.order_items || [];
  const oItems = Array.isArray(oItemsRaw) ? oItemsRaw : [oItemsRaw];

  const dataWithNo = await attachReceiptNumbers(data);

  res.json({
    ...dataWithNo,
    table_name: table?.name,
    discount_name: discount?.name,
    branch_name: branch?.name,
    branch_address: branch?.address,
    items: oItems.map((oi: any) => {
      const product = Array.isArray(oi.products) ? oi.products[0] : oi.products;
      const comp = parseItemNotes(oi.notes);
      const isVoucher = data.payment_method?.toUpperCase() === 'VOUCHER' || oi.notes?.includes('Voucher') || oi.notes?.includes('(Voucher)');
      const points = redMap.get(oi.product_id) || (isVoucher ? vMap.get(oi.product_id) : 0) || 0;
      return {
        ...oi,
        name: product?.name,
        product_name: product?.name,
        products: product, // For compatibility
        quantity: oi.quantity,
        id: oi.id, // Keep order item ID
        points_used: points,
        ...comp
      };
    })
  });
});

app.put('/api/orders/:id/table', async (req, res) => {
  const orderId = req.params.id;
  const { new_table_id } = req.body;

  try {
    // 1. Get old table
    const { data: order } = await supabase.from('orders_espresso').select('table_id').eq('id', orderId).single();
    const oldTableId = order?.table_id;

    // 2. Update order with new table
    await supabase.from('orders_espresso').update({ table_id: new_table_id }).eq('id', orderId);

    // 3. Mark old table available (if empty)
    if (oldTableId && oldTableId !== new_table_id) {
      const { count } = await supabase.from('orders_espresso').select('*', { count: 'exact', head: true }).eq('table_id', oldTableId).eq('status', 'open');
      if (count === 0) {
        await supabase.from('tables_espresso').update({ status: 'available' }).eq('id', oldTableId);
      }
    }

    // 4. Mark new table occupied
    if (new_table_id) {
      await supabase.from('tables_espresso').update({ status: 'occupied' }).eq('id', new_table_id);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id/notes', async (req, res) => {
  const { notes } = req.body;
  try {
    const { error } = await supabase.from('orders_espresso').update({ notes }).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to dynamically recalculate order subtotal and total from actual items in DB
async function recalculateOrderTotals(orderId: string | number) {
  const { data: items } = await supabase
    .from('order_items_espresso')
    .select('price, quantity, is_complimentary, notes')
    .eq('order_id', orderId);

  let newSubtotal = 0;
  if (items && items.length > 0) {
    items.forEach((item: any) => {
      const isComp = item.is_complimentary || item.notes?.includes('[COMPLIMENTARY');
      if (!isComp) {
        newSubtotal += (item.price || 0) * (item.quantity || 1);
      }
    });
  }

  await supabase
    .from('orders_espresso')
    .update({ subtotal: newSubtotal, total: newSubtotal })
    .eq('id', orderId);

  return newSubtotal;
}

// Add items to existing order
app.post('/api/orders/:id/items', async (req, res) => {
  const orderId = req.params.id;
  const { items } = req.body;
  
  const orderItems = items.map((item: any) => {
    let finalNotes = item.notes || '';
    if (item.is_complimentary) {
        const details = {
            recipient: item.complimentary_recipient,
            authorizedBy: item.complimentary_authorized_by,
            server: item.complimentary_server,
            slipNumber: item.complimentary_slip_number || null
        };
        const tag = `[COMPLIMENTARY:${JSON.stringify(details)}]`;
        finalNotes = finalNotes ? `${finalNotes} ${tag}` : tag;
    }

    return {
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      notes: finalNotes,
      status: 'ordered',
      discount_id: item.discount_id || null,
      discount_amount: item.discount_amount || 0,
      is_vat_exempt: item.is_vat_exempt || false
    };
  });

  const { error: insertError } = await supabase.from('order_items_espresso').insert(orderItems);
  if (insertError) {
    console.error('Order items append error:', insertError.message);
    return res.status(500).json({ error: insertError.message });
  }
  
  // Recalculate true subtotal & total directly from DB order items
  await recalculateOrderTotals(orderId);

  res.json({ success: true });
});

// Delete item from existing order
app.delete('/api/orders/:order_id/items/:item_id', async (req, res) => {
  const { order_id, item_id } = req.params;

  try {
    // 1. Delete the item
    const { error: delError } = await supabase.from('order_items_espresso').delete().eq('id', item_id);
    if (delError) return res.status(500).json({ error: delError.message });

    // 2. Recalculate the order subtotal & total directly from remaining DB order items
    await recalculateOrderTotals(order_id);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Pay Order
app.post('/api/orders/:id/pay', async (req, res) => {
  const orderId = req.params.id;
  const {
    discount_id,
    discount_amount,
    tax_amount,
    service_charge,
    total,
    payment_method,
    amount_tendered,
    change,
    reference_number,
    discount_customer_name,
    discount_customer_id_no,
    discount_customer_tin,
    discount_child_name,
    discount_child_birthdate,
    discount_child_age
  } = req.body;

  // Fetch the order to get the branch_id
  const { data: orderOriginal } = await supabase.from('orders_espresso').select('branch_id').eq('id', orderId).single();
  const branchId = orderOriginal?.branch_id || 1;

  // Generate tax-compliant sequential gapless receipt_number only after payment successfully completes
  const nextReceiptNo = await generateNextReceiptNumber(orderId, branchId);

  const updatePayload: any = {
    status: 'paid',
    discount_id: discount_id,
    discount_amount: discount_amount,
    tax_amount: tax_amount,
    service_charge: service_charge,
    total: total,
    payment_method: payment_method,
    amount_tendered: amount_tendered,
    change: change,
    receipt_number: nextReceiptNo, // Update column if schema supports it
    discount_customer_name: discount_customer_name || null,
    discount_customer_id_no: discount_customer_id_no || null,
    discount_customer_tin: discount_customer_tin || null,
    discount_child_name: discount_child_name || null,
    discount_child_birthdate: discount_child_birthdate || null,
    discount_child_age: discount_child_age !== undefined && discount_child_age !== '' ? Number(discount_child_age) : null,
    updated_at: new Date().toISOString()
  };

  let { error } = await supabase.from('orders_espresso').update(updatePayload).eq('id', orderId);

  if (error && (error.message.includes("'service_charge' column") || error.message.includes("column \"service_charge\""))) {
    delete updatePayload.service_charge;
    const { error: retryError } = await supabase.from('orders_espresso').update(updatePayload).eq('id', orderId);
    error = retryError;
  }

  // Gracefully fallback if table does not contain new discount columns yet
  if (error && (
    error.message.includes("discount_customer_name") ||
    error.message.includes("discount_customer_id_no") ||
    error.message.includes("discount_customer_tin") ||
    error.message.includes("discount_child_name") ||
    error.message.includes("discount_child_birthdate") ||
    error.message.includes("discount_child_age")
  )) {
    console.warn("BIR Compliance warning: Orders table is missing discount customer columns. Please run migration script add-discount-customer-columns.sql.");
    delete updatePayload.discount_customer_name;
    delete updatePayload.discount_customer_id_no;
    delete updatePayload.discount_customer_tin;
    delete updatePayload.discount_child_name;
    delete updatePayload.discount_child_birthdate;
    delete updatePayload.discount_child_age;
    const { error: retryError } = await supabase.from('orders_espresso').update(updatePayload).eq('id', orderId);
    error = retryError;
  }

  if (error) {
    if (error.message.includes("receipt_number")) {
       // Graceful fallback if orders table does not contain receipt_number column yet
       delete updatePayload.receipt_number;
       const { error: fallbackErr } = await supabase.from('orders_espresso').update(updatePayload).eq('id', orderId);
       if (fallbackErr) return res.status(500).json({ error: fallbackErr.message });
    } else {
       return res.status(500).json({ error: error.message });
    }
  }

  // 1. Mark store credit as used if paid via store credit
  if (payment_method === 'store_credit' && reference_number) {
    const scId = parseInt(reference_number, 10);
    if (!isNaN(scId)) {
      await supabase.from('store_credits_espresso').update({
        status: 'used',
        used_on_order_id: parseInt(orderId),
        updated_at: new Date().toISOString()
      }).eq('id', scId);
    }
  }

  // 2. Update Grand Accumulating Total (GAT)
  try {
    const { data: gatData } = await supabase.from('grand_accumulating_total_espresso').select('*').eq('branch_id', branchId);
    if (gatData && gatData.length > 0) {
      const newTotalSales = Number(gatData[0].total_sales) + Number(total || 0);
      const newTotalReceipts = Number(gatData[0].total_receipts) + 1;
      await supabase.from('grand_accumulating_total_espresso').update({
        total_sales: newTotalSales,
        total_receipts: newTotalReceipts,
        updated_at: new Date().toISOString()
      }).eq('branch_id', branchId);
    } else {
      await supabase.from('grand_accumulating_total_espresso').insert([{
        branch_id: branchId,
        total_sales: total || 0,
        total_receipts: 1,
        updated_at: new Date().toISOString()
      }]);
    }
  } catch (gatErr) {
    console.error("Error updating Grand Accumulating Total:", gatErr);
  }

  // Free up table
  const { data: order } = await supabase.from('orders_espresso').select('table_id').eq('id', orderId).single();
  if (order && order.table_id) {
    await supabase.from('tables_espresso').update({ status: 'available' }).eq('id', order.table_id);
  }

  // Deduct Inventory
  const { data: items } = await supabase.from('order_items_espresso').select('product_id, quantity, notes').eq('order_id', orderId);
  if (items) {
    for (const item of items) {
      // 1. Fetch current product name and stock
      const { data: product } = await supabase.from('products_espresso').select('name, stock').eq('id', item.product_id).single();
      const newStock = (product?.stock || 0) - item.quantity;
      await supabase.from('products_espresso').update({ stock: newStock }).eq('id', item.product_id);
      
      await supabase.from('inventory_transactions_espresso').insert([{
        product_id: item.product_id,
        type: 'out',
        quantity: item.quantity,
        remarks: `Sales Order #${orderId}`
      }]);

      // 2. Fetch and deduct recipe ingredients if defined
      const { data: recipe } = await supabase.from('product_recipes').select('ingredient_id, quantity').eq('product_id', item.product_id);
      if (recipe && recipe.length > 0) {
        for (const recItem of recipe) {
          const { data: ing } = await supabase.from('products_espresso').select('name, stock').eq('id', recItem.ingredient_id).single();
          
          let factor = 1.0;
          // Dynamically scale sugar usage based on POS customization notes
          if (ing && ing.name.toLowerCase().includes('sugar') && item.notes) {
            const notes = item.notes;
            if (notes.includes('[Sugar: 50%]') || notes.includes('Sugar: 50%') || notes.includes('Sugar Level: 50%')) factor = 0.5;
            else if (notes.includes('[Sugar: 25%]') || notes.includes('Sugar: 25%') || notes.includes('Sugar Level: 25%')) factor = 0.25;
            else if (notes.includes('[Sugar: 75%]') || notes.includes('Sugar: 75%') || notes.includes('Sugar Level: 75%')) factor = 0.75;
            else if (notes.includes('[Sugar: 0%]') || notes.includes('Sugar: 0%') || notes.includes('Sugar Level: 0%') || notes.includes('Sugar Level: No Sugar')) factor = 0.0;
          }

          const deductQty = recItem.quantity * item.quantity * factor;
          const newIngStock = (ing?.stock || 0) - deductQty;
          
          await supabase.from('products_espresso').update({ stock: newIngStock }).eq('id', recItem.ingredient_id);
          await supabase.from('inventory_transactions_espresso').insert([{
            product_id: recItem.ingredient_id,
            type: 'out',
            quantity: deductQty,
            remarks: `Recipe usage for Order #${orderId} (${product?.name || 'Item'})` + (factor !== 1.0 ? ` (Sugar: ${(factor * 100).toFixed(0)}%)` : '')
          }]);
        }
      }
    }
  }

  // Fetch full order for receipt
  const { data: receiptOrder } = await supabase
    .from('orders_espresso')
    .select('*, tables:tables_espresso(name), branches:branches_espresso(name, address)')
    .eq('id', orderId)
    .single();

  const { data: receiptItems } = await supabase
    .from('order_items_espresso')
    .select('*, products:products_espresso(name)')
    .eq('order_id', orderId);

  let discountName = null;
  if (discount_id) {
    const { data: discount } = await supabase.from('discounts_espresso').select('name').eq('id', discount_id).single();
    if (discount) discountName = discount.name;
  }

  const receiptOrderRaw = receiptOrder;
  const receiptWithNo = await attachReceiptNumbers(receiptOrderRaw);
  const rTable = Array.isArray(receiptOrderRaw?.tables) ? receiptOrderRaw.tables[0] : receiptOrderRaw?.tables;
  const rBranch = Array.isArray(receiptOrderRaw?.branches) ? receiptOrderRaw.branches[0] : receiptOrderRaw?.branches;

  res.json({
    success: true,
    receipt: {
      ...receiptWithNo,
      table_name: rTable?.name || (receiptOrderRaw?.table_id ? 'Dine In' : 'Takeout'),
      branch_name: rBranch?.name,
      branch_address: rBranch?.address,
      items: receiptItems?.map((oi: any) => {
        const product = Array.isArray(oi.products) ? oi.products[0] : oi.products;
        const comp = parseItemNotes(oi.notes);
        return { 
          ...oi, 
          name: product?.name,
          products: product, // Compatibility
          ...comp
        };
      }),
      discount_name: discountName,
      reference_number: reference_number
    }
  });
});

// Kitchen Display System (KDS)
app.get('/api/kds', async (req, res) => {
  const { branch_id } = req.query;
  
  // Workaround: We query order_items and join orders & products
  let query = supabase
    .from('order_items_espresso')
    .select('*, products:products_espresso(name, category_id, categories:categories_espresso(name)), orders:orders_espresso!inner(id, table_id, created_at, status, branch_id, tables:tables_espresso(name))')
    .in('status', ['ordered', 'cooking', 'served'])
    .in('orders.status', ['open', 'paid'])
    .order('id', { ascending: false })
    .limit(300);

  if (branch_id) {
    query = query.eq('orders.branch_id', branch_id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Attach receipt/predicted number to each order
  const rawOrders = data.map((item: any) => Array.isArray(item.orders) ? item.orders[0] : item.orders).filter(Boolean);
  const uniqueOrdersMap = new Map();
  for (const o of rawOrders) {
    uniqueOrdersMap.set(o.id, o);
  }
  const deduplicatedOrders = Array.from(uniqueOrdersMap.values());
  const attachedOrders = await attachReceiptNumbers(deduplicatedOrders);
  const attachedOrdersMap = new Map<any, any>(attachedOrders.map((o: any) => [o.id, o]));

  // Map to expected flat structure
  const items = data
    .map((item: any) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      const category = Array.isArray(product?.categories) ? product.categories[0] : product?.categories;
      const orderRaw = Array.isArray(item.orders) ? item.orders[0] : item.orders;
      const order: any = orderRaw ? attachedOrdersMap.get(orderRaw.id) : null;
      const table = Array.isArray(order?.tables) ? order.tables[0] : order?.tables;
      const comp = parseItemNotes(item.notes);

      return {
        ...item,
        order_id: item.order_id,
        product_name: product?.name,
        category_name: category?.name,
        table_id: order?.table_id,
        table_name: table?.name,
        order_time: order?.created_at,
        order_status: order?.status,
        branch_id: order?.branch_id,
        products: product, // For compatibility
        ...comp
      };
    })
    .sort((a, b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime());

  res.json(items);
});

app.get('/api/kds/archived', async (req, res) => {
  const { branch_id } = req.query;
  let query = supabase
    .from('order_items_espresso')
    .select('*, products:products_espresso(name), orders:orders_espresso!inner(id, table_id, created_at, status, branch_id, tables:tables_espresso(name))')
    .eq('status', 'archived');

  if (branch_id) {
    query = query.eq('orders.branch_id', branch_id);
  }

  const { data, error } = await query.order('id', { ascending: false }).limit(500);
  if (error) return res.status(500).json({ error: error.message });

  // Attach receipt/predicted number to each order
  const rawOrders = data.map((item: any) => Array.isArray(item.orders) ? item.orders[0] : item.orders).filter(Boolean);
  const uniqueOrdersMap = new Map();
  for (const o of rawOrders) {
    uniqueOrdersMap.set(o.id, o);
  }
  const deduplicatedOrders = Array.from(uniqueOrdersMap.values());
  const attachedOrders = await attachReceiptNumbers(deduplicatedOrders);
  const attachedOrdersMap = new Map<any, any>(attachedOrders.map((o: any) => [o.id, o]));

  const items = data.map((item: any) => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    const orderRaw = Array.isArray(item.orders) ? item.orders[0] : item.orders;
    const order: any = orderRaw ? attachedOrdersMap.get(orderRaw.id) : null;
    const table = Array.isArray(order?.tables) ? order.tables[0] : order?.tables;

    const comp = parseItemNotes(item.notes);

    return {
      ...item,
      order_id: item.order_id,
      product_name: product?.name,
      table_name: table?.name,
      order_time: order?.created_at,
      branch_id: order?.branch_id,
      ...comp
    };
  });

  res.json(items);
});

app.put('/api/kds/:id/status', async (req, res) => {
  const { status } = req.body;
  const { error } = await supabase.from('order_items_espresso').update({ status }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Inventory
app.get('/api/inventory', async (req, res) => {
  const { branch_id } = req.query;
  let query = supabase.from('products_espresso').select('*, categories:categories_espresso(name, division)').eq('is_active', 1);
  if (branch_id) query = query.eq('branch_id', branch_id);
  
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  
  const products = data.map((p: any) => ({ ...p, category_name: p.categories?.name, division: p.categories?.division || 'coffee' }));
  res.json(products);
});

app.post('/api/inventory/transaction', async (req, res) => {
  const { product_id, type, quantity, remarks } = req.body;
  
  await supabase.from('inventory_transactions_espresso').insert([{
    product_id, type, quantity, remarks
  }]);
  
  if (type === 'in' || type === 'out' || type === 'adjustment') {
    const { data: product } = await supabase.from('products_espresso').select('stock').eq('id', product_id).single();
    let newStock = product?.stock || 0;
    
    if (type === 'in') newStock += quantity;
    else if (type === 'out') newStock -= quantity;
    else if (type === 'adjustment') newStock = quantity;

    await supabase.from('products_espresso').update({ stock: newStock }).eq('id', product_id);
  }

  res.json({ success: true });
});

// --- NEW WAREHOUSE, TRANSFERS, AND AUDITING API ---

const WAREHOUSE_DB_FILE = path.join(process.cwd(), 'warehouse_db.json');

function loadWarehouseDb() {
  if (!fs.existsSync(WAREHOUSE_DB_FILE)) {
    const defaultDb = {
      warehouses: [
        { id: "wh-1", name: "Main Kitchen Warehouse", description: "Bulk ingredients and supplies" },
        { id: "wh-2", name: "Beverage Storage Room", description: "Soft drinks, beer, wine, and cups" },
        { id: "wh-3", name: "Annex Back-office Pantry", description: "Non-perishables and dry goods" }
      ],
      stocks: {}, // warehouseId_productId -> qty
      transfers: [],
      cycle_counts: []
    };
    fs.writeFileSync(WAREHOUSE_DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf8');
    return defaultDb;
  }
  try {
    const content = fs.readFileSync(WAREHOUSE_DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Error reading warehouse_db.json', e);
    return { warehouses: [], stocks: {}, transfers: [], cycle_counts: [] };
  }
}

function saveWarehouseDb(db: any) {
  try {
    fs.writeFileSync(WAREHOUSE_DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing warehouse_db.json', e);
  }
}

// Get all inventory transaction logs combined from Supabase
app.get('/api/inventory/transactions', async (req, res) => {
  try {
    const { branch_id } = req.query;
    
    let query = supabase
      .from('inventory_transactions_espresso')
      .select('*, products:products_espresso!inner(name, branch_id)')
      .order('created_at', { ascending: false });

    if (branch_id) {
      query = query.eq('products.branch_id', branch_id);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get Warehouses
app.get('/api/warehouses', (req, res) => {
  const db = loadWarehouseDb();
  res.json(db.warehouses || []);
});

// Create Warehouse
app.post('/api/warehouses', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Warehouse name is required' });
  
  const db = loadWarehouseDb();
  const newWh = {
    id: 'wh-' + Date.now(),
    name,
    description: description || ''
  };
  if (!db.warehouses) db.warehouses = [];
  db.warehouses.push(newWh);
  saveWarehouseDb(db);
  res.json(newWh);
});

// Get Warehouse Stocks
app.get('/api/warehouse/stocks', (req, res) => {
  const db = loadWarehouseDb();
  res.json(db.stocks || {});
});

// Update Warehouse Stock manually / initialization
app.post('/api/warehouse/stocks/update', (req, res) => {
  const { warehouse_id, product_id, stock } = req.body;
  if (!warehouse_id || !product_id) return res.status(400).json({ error: 'Missing parameters' });
  
  const db = loadWarehouseDb();
  if (!db.stocks) db.stocks = {};
  db.stocks[`${warehouse_id}_${product_id}`] = parseInt(stock, 10) || 0;
  saveWarehouseDb(db);
  res.json({ success: true });
});

// Transfer warehouse to warehouse
app.post('/api/warehouse/transfer', (req, res) => {
  const { product_id, product_name, from_warehouse_id, from_warehouse_name, to_warehouse_id, to_warehouse_name, quantity, remarks, user } = req.body;
  if (!product_id || !from_warehouse_id || !to_warehouse_id || !quantity) {
    return res.status(400).json({ error: 'Missing transfer details' });
  }

  const qty = parseInt(quantity, 10);
  if (qty <= 0) return res.status(400).json({ error: 'Quantity must be greater than zero' });

  const db = loadWarehouseDb();
  if (!db.stocks) db.stocks = {};

  const sourceKey = `${from_warehouse_id}_${product_id}`;
  const destKey = `${to_warehouse_id}_${product_id}`;

  const currentSourceStock = db.stocks[sourceKey] || 0;
  if (currentSourceStock < qty) {
    return res.status(400).json({ error: `Insufficient stock in ${from_warehouse_name}. Available: ${currentSourceStock}` });
  }

  db.stocks[sourceKey] = currentSourceStock - qty;
  db.stocks[destKey] = (db.stocks[destKey] || 0) + qty;

  const newTransfer = {
    id: 'tr-' + Date.now(),
    product_id,
    product_name: product_name || 'Product',
    from_warehouse_id,
    from_warehouse_name,
    to_warehouse_id,
    to_warehouse_name,
    quantity: qty,
    remarks: remarks || '',
    user: user || 'Staff',
    created_at: new Date().toISOString()
  };

  if (!db.transfers) db.transfers = [];
  db.transfers.unshift(newTransfer);
  saveWarehouseDb(db);

  res.json({ success: true, transfer: newTransfer });
});

// Get Warehouse Transfers History
app.get('/api/warehouse/transfers', (req, res) => {
  const db = loadWarehouseDb();
  res.json(db.transfers || []);
});

// Get Cycle Counts history
app.get('/api/cycle-counts', (req, res) => {
  const db = loadWarehouseDb();
  res.json(db.cycle_counts || []);
});

// Log and adjust Cycle Count
app.post('/api/cycle-counts', async (req, res) => {
  try {
    const { title, items, remarks, user, commit_to_main } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'No items in cycle count' });

    const db = loadWarehouseDb();
    if (!db.cycle_counts) db.cycle_counts = [];

    const newCycleCount = {
      id: 'cc-' + Date.now(),
      title: title || `Cycle Count`,
      remarks: remarks || '',
      user: user || 'Staff',
      created_at: new Date().toISOString(),
      status: commit_to_main ? 'committed' : 'calculated',
      items // array of { product_id, name, expected, actual, discrepancy }
    };

    db.cycle_counts.unshift(newCycleCount);
    saveWarehouseDb(db);

    if (commit_to_main) {
      for (const item of items) {
        if (item.discrepancy !== 0) {
          // Update product stock in main DB
          await supabase.from('products_espresso').update({ stock: item.actual }).eq('id', item.product_id);
          
          // Log inside inventory transactions in Supabase
          await supabase.from('inventory_transactions_espresso').insert([{
            product_id: item.product_id,
            type: 'adjustment',
            quantity: item.actual,
            remarks: `Cycle Count Adjustment (${title}): Hand-count matched expected stock. Discrepancy: ${item.discrepancy > 0 ? '+' : ''}${item.discrepancy} units.`
          }]);
        }
      }
    }

    res.json({ success: true, cycle_count: newCycleCount });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Vouchers
app.get('/api/voucher-items', async (req, res) => {
  try {
    // Attempt to fetch with new_price first
    const { data, error } = await supabase
      .from('voucher_items_espresso')
      .select('*, products:products_espresso(name, price, branch_id)')
      .eq('is_active', 1);
    
    if (error) {
      // If error is about the missing column, try fetching without it
      if (error.message.includes("column 'new_price' does not exist") || 
          error.message.includes("Could not find the 'new_price' column")) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('voucher_items_espresso')
          .select('id, product_id, points_required, is_active, created_at, products:products_espresso(name, price, branch_id)')
          .eq('is_active', 1);
        
        if (fallbackError) return res.status(500).json({ error: fallbackError.message });
        
        // Add default new_price as 0
        const mapped = fallbackData.map((v: any) => {
          const product = Array.isArray(v.products) ? v.products[0] : v.products;
          return { ...v, new_price: 0, products: product };
        });
        return res.json(mapped);
      }
      return res.status(500).json({ error: error.message });
    }
    const flattened = (data || []).map((v: any) => {
      const product = Array.isArray(v.products) ? v.products[0] : v.products;
      return { ...v, products: product };
    });
    res.json(flattened);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/voucher-items', async (req, res) => {
  const { product_id, points_required, new_price } = req.body;
  if (!product_id || points_required === undefined) {
    return res.status(400).json({ error: 'Product and points are required' });
  }

  const payload: any = { 
    product_id: parseInt(product_id), 
    points_required: parseInt(points_required), 
    is_active: 1 
  };
  
  // Only add new_price if we are sure it won't crash or we try and catch
  payload.new_price = parseFloat(new_price) || 0;

  const { data, error } = await supabase
    .from('voucher_items_espresso')
    .insert([payload])
    .select();
  
  if (error) {
    // If new_price failed, try without it
    if (error.message.includes('column "new_price" of relation "voucher_items" does not exist') || 
        error.message.includes("Could not find the 'new_price' column")) {
       delete payload.new_price;
       const { data: retryData, error: retryError } = await supabase
        .from('voucher_items_espresso')
        .insert([payload])
        .select();
       
       if (retryError) return res.status(500).json({ error: retryError.message });
       return res.json({ id: retryData ? retryData[0]?.id : null, success: true });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json({ id: data ? data[0]?.id : null, success: true });
});

app.put('/api/voucher-items/:id', async (req, res) => {
  const { points_required, new_price } = req.body;
  const updates: any = {};
  if (points_required !== undefined) updates.points_required = parseInt(points_required);
  if (new_price !== undefined) updates.new_price = parseFloat(new_price);
  
  const { error } = await supabase.from('voucher_items_espresso').update(updates).eq('id', parseInt(req.params.id));
  
  if (error) {
    if (error.message.includes('column "new_price"') || error.message.includes("Could not find the 'new_price' column")) {
        delete updates.new_price;
        if (Object.keys(updates).length > 0) {
            const { error: retryError } = await supabase.from('voucher_items_espresso').update(updates).eq('id', parseInt(req.params.id));
            if (retryError) return res.status(500).json({ error: retryError.message });
        }
        return res.json({ success: true, warning: 'new_price was not updated as the column is missing in DB' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
});

app.delete('/api/voucher-items/:id', async (req, res) => {
  const { error } = await supabase.from('voucher_items_espresso').update({ is_active: 0 }).eq('id', parseInt(req.params.id));
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/voucher-redemptions', async (req, res) => {
  const { 
    branch_id, 
    order_id, 
    items, 
    reference_number,
    is_complimentary,
    complimentary_recipient,
    complimentary_authorized_by,
    complimentary_server,
    complimentary_slip_number
  } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Redemption items are required' });
  }

  try {
    let finalOrderId = order_id;

    // 1. If no order_id provided, create a new "paid" order for this redemption
    if (!finalOrderId) {
      const { data: newOrder, error: oError } = await supabase
        .from('orders_espresso')
        .insert([{
          branch_id,
          status: 'paid',
          order_type: 'dine-in',
          payment_method: is_complimentary ? 'Complimentary' : 'Voucher',
          subtotal: 0,
          total: 0,
          amount_tendered: 0,
          change: 0,
          discount_amount: 0,
          tax_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (oError) {
        console.error('Voucher order creation error:', oError.message);
        return res.status(500).json({ error: oError.message });
      }
      finalOrderId = newOrder.id;
    }

    const redemptionRecords = [];
    const orderItems = [];

    for (const item of items) {
      const { product_id, points_used, quantity } = item;
      
      // Fetch product details for each item to deduct stock
      const { data: product, error: pError } = await supabase
        .from('products_espresso')
        .select('name, price, stock')
        .eq('id', product_id)
        .single();
      
      if (pError || !product) continue;

      let notes = `(Voucher) Ref# ${reference_number}`;
      if (is_complimentary) {
        const details = {
          recipient: complimentary_recipient || 'VIP',
          authorizedBy: complimentary_authorized_by || 'Manager',
          server: complimentary_server || 'System',
          slipNumber: complimentary_slip_number || reference_number || null
        };
        const tag = `[COMPLIMENTARY:${JSON.stringify(details)}]`;
        notes = `(Complimentary Voucher) ${tag}`;
      }

      // Add to order items
      orderItems.push({
        order_id: finalOrderId,
        product_id,
        quantity: quantity || 1,
        price: item.new_price || 0, // Store the voucher price
        notes: notes,
        status: 'ordered' // Auto-approved
      });

      // Add to redemption records
      redemptionRecords.push({ 
        branch_id, 
        order_id: finalOrderId, 
        product_id, 
        quantity: quantity || 1, 
        points_used: points_used, 
        reference_number: reference_number || complimentary_slip_number || 'Complimentary',
        price: item.new_price || 0
      });

      // Deduct inventory
      const newStock = (product.stock || 0) - (quantity || 1);
      await supabase.from('products_espresso').update({ stock: newStock }).eq('id', product_id);
      
      await supabase.from('inventory_transactions_espresso').insert([{
        product_id,
        type: 'out',
        quantity: quantity || 1,
        remarks: is_complimentary 
          ? `Complimentary Voucher - Ref# ${complimentary_slip_number || reference_number || 'N/A'}`
          : `Voucher Redemption - Ref# ${reference_number}`
      }]);
    }

    // Insert all order items and redemptions
    if (orderItems.length > 0) {
      const { error: itemError } = await supabase.from('order_items_espresso').insert(orderItems);
      if (itemError) console.error('Order items insert error:', itemError.message);
      
      const { error: redError } = await supabase.from('voucher_redemptions_espresso').insert(redemptionRecords);
      if (redError) {
        if (redError.message.includes('column') || redError.message.includes('not found')) {
          // Retry without possibly missing columns
          const cleanedRecords = redemptionRecords.map(({ branch_id, price, ...rest }: any) => rest);
          await supabase.from('voucher_redemptions_espresso').insert(cleanedRecords);
        } else {
          console.error('Voucher redemptions insert error:', redError.message);
        }
      }
    }

    // 6. Fetch full order for receipt
    const { data: receiptOrder } = await supabase
      .from('orders_espresso')
      .select('*, tables:tables_espresso(name), branches:branches_espresso(name, address)')
      .eq('id', finalOrderId)
      .single();

    const { data: receiptItems } = await supabase
      .from('order_items_espresso')
      .select('*, products:products_espresso(name, price)')
      .eq('order_id', finalOrderId);

    const { data: redemptions } = await supabase
      .from('voucher_redemptions_espresso')
      .select('product_id, points_used')
      .eq('order_id', finalOrderId);

    res.json({ 
      order_id: finalOrderId, 
      success: true,
      receipt: {
        ...receiptOrder,
        table_name: receiptOrder?.tables?.name || 'Voucher',
        branch_name: receiptOrder?.branches?.name,
        branch_address: receiptOrder?.branches?.address,
        items: receiptItems?.map((oi: any) => {
          const product = Array.isArray(oi.products) ? oi.products[0] : oi.products;
          const comp = parseItemNotes(oi.notes);
          return { 
            ...oi, 
            name: product?.name,
            regular_price: product?.price,
            products: product, // Compatibility
            points_used: redemptions?.find(r => r.product_id === oi.product_id)?.points_used || 0,
            ...comp
          };
        }),
        cashier_name: complimentary_server || 'System'
      }
    });
  } catch (err: any) {
    console.error('Voucher Redemption Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/vouchers', async (req, res) => {
  const { branch_id, start_date, end_date, start_time, end_time } = req.query;
  
  try {
    // 1. Fetch core data first (most stable columns)
    const { data: redemptions, error } = await supabase
      .from('voucher_redemptions_espresso')
      .select('id, product_id, points_used, created_at, products:products_espresso(name, branch_id)');
    
    if (error) {
      console.error('Voucher report fetch error:', error.message);
      if (error.message.includes('Could not find the table')) return res.json([]);
      return res.status(500).json({ error: error.message });
    }

    // 2. Try to fetch optional/newer columns
    let detailsMap: Record<number, any> = {};
    try {
      const { data: details } = await supabase
        .from('voucher_redemptions_espresso')
        .select('id, price, reference_number, quantity');
      
      if (details) {
        details.forEach((d: any) => {
          detailsMap[d.id] = d;
        });
      }
    } catch (e) {
       console.warn('Voucher details fetch failed (likely missing columns):', e);
    }

    // 3. Process and filter in memory
    const filteredResults = (redemptions || []).map((r: any) => {
      const d = detailsMap[r.id] || {};
      return {
        ...r,
        price: d.price || 0,
        reference_number: d.reference_number || '',
        quantity: d.quantity || 1
      };
    }).filter((r: any) => {
      // Branch filter
      const bId = branch_id ? parseInt(branch_id as string) : null;
      const matchesBranch = !bId || r.branch_id === bId || r.products?.branch_id === bId;
      if (!matchesBranch) return false;

      // Date & Time filter
      if (!start_date && !end_date) return true;
      const utDate = new Date(r.created_at);
      const sDate = start_date as string;
      const eDate = end_date as string;
      let voucherStartTime = (start_time as string) || '00:00';
      let voucherEndTime = (end_time as string) || '23:59';
      
      const startBoundary = new Date(`${sDate || '2020-01-01'}T${voucherStartTime}:00`);
      const endBoundary = new Date(`${eDate || '2030-12-31'}T${voucherEndTime}:00`);
      return utDate >= startBoundary && utDate <= endBoundary;
    });

    res.json(filteredResults);
  } catch (err: any) {
    console.error('Voucher report critical error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Approval / Rejection
app.post('/api/order-items/:id/approve', async (req, res) => {
  const { error } = await supabase.from('order_items_espresso').update({ status: 'ordered' }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/order-items/:id/reject', async (req, res) => {
  // Option 1: Just delete it
  // Option 2: Status 'rejected'
  // User says "reject", so let's use 'rejected' status or delete.
  // Deleting is cleaner for the KDS/Orders if it was a mistake.
  // But let's use status 'rejected' and filter it out.
  const { error } = await supabase.from('order_items_espresso').update({ status: 'rejected' }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Branch-wide Sales Overview for Admin Dashboard
app.get('/api/reports/branches-sales', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const { data: branches, error: branchError } = await supabase.from('branches_espresso').select('*');
    if (branchError) return res.status(500).json({ error: branchError.message });
    
    const { data: orders, error: orderError } = await supabase.from('orders_espresso').select('branch_id, total, status, updated_at').eq('status', 'paid');
    if (orderError) return res.status(500).json({ error: orderError.message });

    const manilaOffset = 8 * 60 * 60 * 1000;
    const todayStr = new Date(Date.now() + manilaOffset).toISOString().split('T')[0];

    const branchSalesMap = new Map();
    branches.forEach(b => {
      branchSalesMap.set(b.id, {
        id: b.id,
        name: b.name,
        todaySales: 0,
        totalSales: 0,
        orderCount: 0
      });
    });

    orders.forEach(o => {
      const branchData = branchSalesMap.get(o.branch_id);
      if (branchData) {
        const orderDate = new Date(new Date(o.updated_at).getTime() + manilaOffset).toISOString().split('T')[0];
        
        if (start_date && end_date) {
          if (orderDate >= start_date && orderDate <= end_date) {
            branchData.totalSales += o.total || 0;
            branchData.orderCount += 1;
          }
        } else {
          branchData.totalSales += o.total || 0;
          branchData.orderCount += 1;
        }

        if (orderDate === todayStr) {
          branchData.todaySales += o.total || 0;
        }
      }
    });

    const result = Array.from(branchSalesMap.values());
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Reports (BIR & Sales)
app.get('/api/reports/sales', async (req, res) => {
  const { start_date, end_date, branch_id, start_time, end_time, user_id } = req.query;
  
  let query = supabase.from('orders_espresso').select(`
    *, 
    discounts:discounts_espresso (id, name), 
    order_items:order_items_espresso (*, products:products_espresso (id, name, price, categories:categories_espresso(id, name, division)))
  `).in('status', ['paid', 'voided']);
  
  if (branch_id) query = query.eq('branch_id', branch_id);
  
  const { data: orders, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Get settings for report hours
  let reportStartTime = (start_time as string) || '06:00';
  let reportEndTime = (end_time as string) || '05:59';
  
  if (!start_time && !end_time) {
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        if (settings.report_start_time) reportStartTime = settings.report_start_time;
        if (settings.report_end_time) reportEndTime = settings.report_end_time;
      } catch (e) {}
    }
  }

  const isNextDayEnd = reportEndTime < reportStartTime;

  let userShifts: any[] = [];
  if (user_id) {
    const { data: shifts } = await supabase
      .from('shifts_espresso')
      .select('*')
      .eq('user_id', parseInt(user_id as string, 10))
      .eq('branch_id', branch_id);
    if (shifts) {
      userShifts = shifts;
    }
  }

  // Filter dates manually to ensure timezone safety and respect operating hours
  const filteredOrders = orders.filter((o: any) => {
    if (!start_date && !end_date) return true;
    
    // Convert order updated_at to Manila Date
    const utDate = new Date(o.updated_at);
    // We want to check if utDate is between [start_date T startTime] and [end_date T endTime]
    // If endTime < startTime, the end range for a 'day' is actually D+1 T endTime
    
    const sDate = start_date as string;
    const eDate = end_date as string;

    const startBoundary = new Date(`${sDate}T${reportStartTime}:00`);
    let endBoundary = new Date(`${eDate}T${reportEndTime}:00`);
    if (isNextDayEnd) {
      endBoundary.setDate(endBoundary.getDate() + 1);
    }

    const matchesPeriod = utDate >= startBoundary && utDate <= endBoundary;
    if (!matchesPeriod) return false;

    if (user_id) {
      return userShifts.some((s: any) => {
        const tIn = new Date(s.time_in);
        const tOut = s.time_out ? new Date(s.time_out) : new Date();
        return utDate >= tIn && utDate <= tOut;
      });
    }

    return true;
  });

  // Calculate voucher points mapping for the filtered orders to get correct points values for voided/vouchers
  const orderIds = filteredOrders.map((o: any) => o.id);
  const redMap = new Map();
  const vMap = new Map();
  if (orderIds.length > 0) {
    const { data: redemptions } = await supabase
      .from('voucher_redemptions_espresso')
      .select('product_id, points_used, order_id')
      .in('order_id', orderIds);

    const { data: voucherItems } = await supabase
      .from('voucher_items_espresso')
      .select('product_id, points_required');

    if (redemptions) {
      redemptions.forEach((r: any) => {
        redMap.set(`${r.order_id}_${r.product_id}`, r.points_used);
      });
    }

    if (voucherItems) {
      voucherItems.forEach((vi: any) => {
        vMap.set(vi.product_id, vi.points_required);
      });
    }
  }

  const mappedOrders = filteredOrders.map((o: any) => {
    const isVoucherOrder = o.payment_method?.toUpperCase() === 'VOUCHER';
    let voucherPointsSum = 0;
    const oItems = o.order_items || [];
    const itemsWithPoints = oItems.map((oi: any) => {
      const product = Array.isArray(oi.products) ? oi.products[0] : oi.products;
      const comp = parseItemNotes(oi.notes);
      const isVoucherItem = isVoucherOrder || oi.notes?.includes('Voucher') || oi.notes?.includes('(Voucher)');
      const points = redMap.get(`${o.id}_${oi.product_id}`) || (isVoucherItem ? vMap.get(oi.product_id) : 0) || 0;
      voucherPointsSum += points * (oi.quantity || 1);
      return {
        ...oi,
        name: product?.name,
        price: oi.price,
        quantity: oi.quantity,
        id: oi.id,
        points_used: points,
        division: product?.categories?.division || 'coffee',
        ...comp
      };
    });
    return {
      ...o,
      order_items: itemsWithPoints,
      voucher_points_sum: voucherPointsSum
    };
  });

  const mappedOrdersWithNo = await attachReceiptNumbers(mappedOrders);
  const paidOrders = mappedOrdersWithNo.filter((o: any) => o.status === 'paid');
  const voidedOrders = mappedOrdersWithNo.filter((o: any) => o.status === 'voided');

  // 1. Core Summary + Beginning/Ending ORs for Paid Orders
  let min_or = null;
  let max_or = null;
  let total_sales = 0;
  let gross_sales = 0;
  let total_discounts = 0;
  let total_vat = 0;
  let total_service_charge = 0;
  let vat_exempt_sales = 0;
  let vatable_sales = 0;
  
  let coffee_sales_total = 0;
  let laundry_sales_total = 0;
  
  const discountStats: Record<string, { amount: number, count: number }> = {};
  const paymentStats: Record<string, { amount: number, count: number }> = {};
  
  const dailyDetailedMap: Record<string, { gross: number; discounts: number; net: number; count: number }> = {};

  paidOrders.forEach((o: any) => {
    total_sales += o.total || 0;
    gross_sales += o.subtotal || 0;
    total_discounts += o.discount_amount || 0;
    total_vat += o.tax_amount || 0;
    total_service_charge += o.service_charge || 0;

    const oItems = o.order_items || [];
    oItems.forEach((oi: any) => {
      const itemTotal = (oi.price || 0) * (oi.quantity || 1);
      if (oi.division === 'laundry') {
        laundry_sales_total += itemTotal;
      } else {
        coffee_sales_total += itemTotal;
      }
    });
    
    if (o.tax_amount === 0 && o.discount_amount > 0) {
      vat_exempt_sales += (o.subtotal || 0);
    }
    if (o.tax_amount > 0) {
      vatable_sales += ((o.subtotal || 0) - (o.discount_amount || 0));
    }

    const payMethod = (o.payment_method || 'cash').toLowerCase();
    if (!paymentStats[payMethod]) paymentStats[payMethod] = { amount: 0, count: 0 };
    paymentStats[payMethod].amount += o.total;
    paymentStats[payMethod].count += 1;

    const currentOR = o.receipt_number || o.id;
    if (!min_or || currentOR < min_or) min_or = currentOR;
    if (!max_or || currentOR > max_or) max_or = currentOR;

    // Discounts Breakdown
    if (o.discount_amount > 0 && o.discounts?.name) {
      const name = o.discounts.name;
      if (!discountStats[name]) discountStats[name] = { amount: 0, count: 0 };
      discountStats[name].amount += o.discount_amount;
      discountStats[name].count += 1;
    }

    // Daily Detailed Map - use operating day
    const dObj = new Date(o.updated_at);
    const [h, m] = reportStartTime.split(':').map(Number);
    dObj.setHours(dObj.getHours() - h);
    dObj.setMinutes(dObj.getMinutes() - m);
    const d = dObj.toISOString().split('T')[0];

    if (!dailyDetailedMap[d]) {
      dailyDetailedMap[d] = { gross: 0, discounts: 0, net: 0, count: 0 };
    }
    dailyDetailedMap[d].gross += (o.subtotal || 0);
    dailyDetailedMap[d].discounts += (o.discount_amount || 0);
    dailyDetailedMap[d].net += (o.total || 0);
    dailyDetailedMap[d].count += 1;
  });

  // Calculate voided orders statistics
  let total_voided_amount = 0;
  let voided_cash_total = 0;
  let voided_card_total = 0;
  let voided_vouchers_total_pts = 0;

  voidedOrders.forEach((o: any) => {
    const pm = (o.payment_method || 'CASH').toUpperCase();
    if (pm === 'VOUCHER') {
      voided_vouchers_total_pts += o.voucher_points_sum || 0;
    } else {
      total_voided_amount += o.total || 0;
      if (pm === 'CASH') {
        voided_cash_total += o.total || 0;
      } else {
        voided_card_total += o.total || 0;
      }
    }
  });

  // Calculate accumulated up to the end date for Z-count and Accumulated Grand Total
  let agtQuery = supabase.from('orders_espresso').select('updated_at, total').eq('status', 'paid');
  if (branch_id) agtQuery = agtQuery.eq('branch_id', branch_id);
  const { data: allOrders } = await agtQuery;

  let accumulated_grand_total = 0;
  const uniqueDates = new Set<string>();
  
  if (allOrders) {
    allOrders.forEach((o: any) => {
      const utDate = new Date(o.updated_at);
      const eDate = end_date as string || start_date as string;
      if (!eDate) {
        accumulated_grand_total += o.total;
        return;
      }
      
      const endBoundary = new Date(`${eDate}T${reportEndTime}:00`);
      if (isNextDayEnd) {
        endBoundary.setDate(endBoundary.getDate() + 1);
      }
      
      if (utDate <= endBoundary) {
        accumulated_grand_total += o.total;
        const d = new Date(utDate);
        const [h, m] = reportStartTime.split(':').map(Number);
        d.setHours(d.getHours() - h);
        d.setMinutes(d.getMinutes() - m);
        uniqueDates.add(d.toISOString().split('T')[0]);
      }
    });
  }

  const discounts = Object.keys(discountStats).map(name => ({
    name,
    amount: discountStats[name].amount,
    count: discountStats[name].count
  }));

  const payments = Object.keys(paymentStats).map(method => ({
    method,
    amount: paymentStats[method].amount,
    count: paymentStats[method].count
  }));

  const dailySales = Object.entries(dailyDetailedMap)
    .map(([date, stats]) => ({
      date,
      total: stats.net,
      gross: stats.gross,
      discounts: stats.discounts,
      net: stats.net,
      count: stats.count
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    summary: {
      min_or, max_or, total_sales, gross_sales, total_discounts, total_vat, total_service_charge,
      vat_exempt_sales, vatable_sales, total_transactions: paidOrders.length,
      coffee_sales_total, laundry_sales_total,
      // Voided summaries
      total_voided_transactions: voidedOrders.length,
      total_voided_amount,
      voided_cash_total,
      voided_card_total,
      voided_vouchers_total_pts
    },
    discounts,
    payments,
    accumulated_grand_total,
    z_counter: uniqueDates.size || 1,
    dailySales,
    voided_orders: voidedOrders
  });
});

app.get('/api/reports/voided', async (req, res) => {
  const { start_date, end_date, branch_id, start_time, end_time } = req.query;
  
  let query = supabase.from('orders_espresso').select(`
    *, 
    discounts:discounts_espresso (id, name), 
    order_items:order_items_espresso (*, products:products_espresso (id, name, price))
  `).eq('status', 'voided');
  
  if (branch_id) query = query.eq('branch_id', branch_id);
  
  const { data: orders, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Get settings for report hours
  let reportStartTime = (start_time as string) || '06:00';
  let reportEndTime = (end_time as string) || '05:59';
  
  if (!start_time && !end_time) {
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        if (settings.report_start_time) reportStartTime = settings.report_start_time;
        if (settings.report_end_time) reportEndTime = settings.report_end_time;
      } catch (e) {}
    }
  }

  const isNextDayEnd = reportEndTime < reportStartTime;

  const filteredOrders = orders.filter((o: any) => {
    if (!start_date && !end_date) return true;
    
    const utDate = new Date(o.updated_at);
    const sDate = start_date as string;
    const eDate = end_date as string;

    const startBoundary = new Date(`${sDate}T${reportStartTime}:00`);
    let endBoundary = new Date(`${eDate}T${reportEndTime}:00`);
    if (isNextDayEnd) {
      endBoundary.setDate(endBoundary.getDate() + 1);
    }

    return utDate >= startBoundary && utDate <= endBoundary;
  });

  const orderIds = filteredOrders.map((o: any) => o.id);
  const redMap = new Map();
  const vMap = new Map();
  if (orderIds.length > 0) {
    const { data: redemptions } = await supabase
      .from('voucher_redemptions_espresso')
      .select('product_id, points_used, order_id')
      .in('order_id', orderIds);

    const { data: voucherItems } = await supabase
      .from('voucher_items_espresso')
      .select('product_id, points_required');

    if (redemptions) {
      redemptions.forEach((r: any) => {
        redMap.set(`${r.order_id}_${r.product_id}`, r.points_used);
      });
    }

    if (voucherItems) {
      voucherItems.forEach((vi: any) => {
        vMap.set(vi.product_id, vi.points_required);
      });
    }
  }

  const mappedOrders = filteredOrders.map((o: any) => {
    const isVoucherOrder = o.payment_method?.toUpperCase() === 'VOUCHER';
    let voucherPointsSum = 0;
    const oItems = o.order_items || [];
    const itemsWithPoints = oItems.map((oi: any) => {
      const product = Array.isArray(oi.products) ? oi.products[0] : oi.products;
      const comp = parseItemNotes(oi.notes);
      const isVoucherItem = isVoucherOrder || oi.notes?.includes('Voucher') || oi.notes?.includes('(Voucher)');
      const points = redMap.get(`${o.id}_${oi.product_id}`) || (isVoucherItem ? vMap.get(oi.product_id) : 0) || 0;
      voucherPointsSum += points * (oi.quantity || 1);
      return {
        ...oi,
        name: product?.name,
        price: oi.price,
        quantity: oi.quantity,
        id: oi.id,
        points_used: points,
        ...comp
      };
    });
    return {
      ...o,
      items: itemsWithPoints,
      voucher_points_sum: voucherPointsSum
    };
  });

  const ordersWithNo = await attachReceiptNumbers(mappedOrders);
  res.json(ordersWithNo);
});

app.get('/api/reports/ejournal', async (req, res) => {
  const { start_date, end_date, branch_id, start_time, end_time } = req.query;
  
  let query = supabase.from('orders_espresso').select(`
    *,
    tables:tables_espresso (*),
    order_items:order_items_espresso (*, products:products_espresso (*)),
    discounts:discounts_espresso (name)
  `).order('created_at', { ascending: true });
  if (branch_id) query = query.eq('branch_id', branch_id);
  
  const { data: orders, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Get settings for report hours
  let reportStartTime = (start_time as string) || '06:00';
  let reportEndTime = (end_time as string) || '05:59';
  
  if (!start_time && !end_time) {
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        if (settings.report_start_time) reportStartTime = settings.report_start_time;
        if (settings.report_end_time) reportEndTime = settings.report_end_time;
      } catch (e) {}
    }
  }
  const isNextDayEnd = reportEndTime < reportStartTime;

  const filteredOrders = orders.filter((o: any) => {
    if (!start_date && !end_date) return true;
    
    const utDate = new Date(o.updated_at || o.created_at);
    const sDate = start_date as string;
    const eDate = end_date as string;

    const startBoundary = new Date(`${sDate}T${reportStartTime}:00`);
    let endBoundary = new Date(`${eDate}T${reportEndTime}:00`);
    if (isNextDayEnd) {
      endBoundary.setDate(endBoundary.getDate() + 1);
    }

    return utDate >= startBoundary && utDate <= endBoundary;
  }).map((order: any) => {
    const table = Array.isArray(order.tables) ? order.tables[0] : order.tables;
    const discount = Array.isArray(order.discounts) ? order.discounts[0] : order.discounts;
    const oItemsRaw = order.order_items || [];
    const oItems = Array.isArray(oItemsRaw) ? oItemsRaw : [oItemsRaw];
    
    return {
      ...order,
      table_name: table?.name,
      discount_name: discount?.name,
      items: oItems.map((oi: any) => {
        const product = Array.isArray(oi.products) ? oi.products[0] : oi.products;
        const comp = parseItemNotes(oi.notes);
        return { 
          ...oi, 
          name: product?.name,
          product_name: product?.name,
          products: product, // Compatibility
          ...comp
        };
      })
    };
  });

  const ordersWithNo = await attachReceiptNumbers(filteredOrders);
  res.json(ordersWithNo);
});

app.get('/api/reports/complimentary', async (req, res) => {
  const { start_date, end_date, branch_id, start_time, end_time } = req.query;
  
  let query = supabase
    .from('order_items_espresso')
    .select('*, orders:orders_espresso!inner(id, branch_id, created_at, status), products:products_espresso(name)')
    .ilike('notes', '%[COMPLIMENTARY%')
    .order('id', { ascending: false });

  if (branch_id) query = query.eq('orders.branch_id', branch_id);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Get settings for report hours
  let reportStartTime = (start_time as string) || '10:00';
  let reportEndTime = (end_time as string) || '06:00';
  
  if (!start_time && !end_time) {
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        if (settings.report_start_time) reportStartTime = settings.report_start_time;
        if (settings.report_end_time) reportEndTime = settings.report_end_time;
      } catch (e) {}
    }
  }
  const isNextDayEnd = reportEndTime < reportStartTime;

  const rawOrders = data.map((item: any) => Array.isArray(item.orders) ? item.orders[0] : item.orders).filter(Boolean);
  const uniqueOrdersMap = new Map();
  for (const o of rawOrders) {
    uniqueOrdersMap.set(o.id, o);
  }
  const deduplicatedOrders = Array.from(uniqueOrdersMap.values());
  const attachedOrders = await attachReceiptNumbers(deduplicatedOrders);
  const attachedOrdersMap = new Map<any, any>(attachedOrders.map((o: any) => [o.id, o]));

  const filtered = data.filter((item: any) => {
    const orderData = Array.isArray(item.orders) ? item.orders[0] : item.orders;
    if (!orderData) return false;
    
    if (!start_date && !end_date) return true;
    
    const utDate = new Date(orderData.created_at);
    const sDate = start_date as string;
    const eDate = end_date as string;

    const startBoundary = new Date(`${sDate}T${reportStartTime}:00`);
    let endBoundary = new Date(`${eDate}T${reportEndTime}:00`);
    if (isNextDayEnd) {
      endBoundary.setDate(endBoundary.getDate() + 1);
    }

    return utDate >= startBoundary && utDate <= endBoundary;
  }).map((item: any) => {
    const orderDataRaw = Array.isArray(item.orders) ? item.orders[0] : item.orders;
    const orderData = orderDataRaw ? attachedOrdersMap.get(orderDataRaw.id) : null;
    const comp = parseItemNotes(item.notes);
    return {
      ...item,
      ...comp,
      product_name: Array.isArray(item.products) ? item.products[0]?.name : item.products?.name,
      created_at: orderData?.created_at,
      receipt_number: orderData?.receipt_number
    };
  });

  res.json(filtered);
});

// BIR Annex E-2 to E-5: Discount Orders per type (Senior, PWD, Athlete, Solo Parent)
app.get('/api/reports/discount-orders', async (req, res) => {
  const { branch_id, discount_type, start_date, end_date, start_time, end_time } = req.query;

  try {
    let query = supabase
      .from('orders_espresso')
      .select('*, discounts:discounts_espresso (id, name), order_items:order_items_espresso (*, products:products_espresso (id, name, price))')
      .eq('status', 'paid')
      .gt('discount_amount', 0);

    if (branch_id) query = query.eq('branch_id', branch_id);

    const { data: orders, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // Get report hours from settings
    let reportStartTime = (start_time as string) || '10:00';
    let reportEndTime   = (end_time   as string) || '06:00';
    if (!start_time && !end_time && fs.existsSync(SETTINGS_FILE)) {
      try {
        const s = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        if (s.report_start_time) reportStartTime = s.report_start_time;
        if (s.report_end_time)   reportEndTime   = s.report_end_time;
      } catch (e) {}
    }
    const isNextDayEnd = reportEndTime < reportStartTime;

    // Filter by date range
    const filtered = (orders || []).filter((o: any) => {
      if (!start_date && !end_date) return true;
      const utDate = new Date(o.updated_at);
      const startBoundary = new Date(`${start_date}T${reportStartTime}:00`);
      const endBoundary   = new Date(`${end_date}T${reportEndTime}:00`);
      if (isNextDayEnd) endBoundary.setDate(endBoundary.getDate() + 1);
      return utDate >= startBoundary && utDate <= endBoundary;
    });

    const typeKeywords: Record<string, string[]> = {
      senior:  ['senior', 'sc', 'osca'],
      pwd:     ['pwd', 'disability', 'disabled'],
      athlete: ['athlete', 'coach', 'naac', 'pnstm', 'national athlete'],
      solo:    ['solo', 'solo parent'],
      valor:   ['valor', 'medal', 'medal of valor', 'mov'],
      regular: ['regular', 'discount'],
    };
    const keywords = typeKeywords[(discount_type as string)?.toLowerCase()] || [];

    const typeFiltered = keywords.length === 0 ? filtered : filtered.filter((o: any) => {
      const dName = (o.discounts?.name || o.discount_name || '').toLowerCase();
      return keywords.some(k => dName.includes(k));
    });

    const withReceiptNumbers = await attachReceiptNumbers(typeFiltered);

    const result = withReceiptNumbers.map((o: any) => {
      const discountName = o.discounts?.name || o.discount_name || '';
      const subtotal     = o.subtotal || 0;
      const taxAmount    = o.tax_amount || 0;
      const discountAmt  = o.discount_amount || 0;
      const netSales     = o.total || 0;

      // VAT Exempt Sales = subtotal / 1.12 (pre-VAT amount)
      const vatExemptSales = taxAmount > 0 ? (subtotal / 1.12) : subtotal;
      // 5% Senior/PWD discount = VAT relief on exempt portion
      const discount5 = taxAmount > 0 ? taxAmount : 0;
      // 20% discount = the actual discount_amount recorded
      const discount20 = discountAmt;

      return {
        id:           o.id,
        receipt_number: o.receipt_number,
        date:         o.updated_at,
        discount_name: discountName,
        subtotal,
        tax_amount:   taxAmount,
        vat_exempt_sales: vatExemptSales,
        discount_5:   discount5,
        discount_20:  discount20,
        discount_amount: discountAmt,
        net_sales:    netSales,
        // Customer identity fields — to be populated when POS captures them
        customer_name:    o.discount_customer_name    || '',
        customer_id_no:   o.discount_customer_id_no   || '',
        customer_tin:     o.discount_customer_tin      || '',
        // Solo Parent extra fields
        child_name:       o.discount_child_name        || '',
        child_birthdate:  o.discount_child_birthdate   || '',
        child_age:        o.discount_child_age          || '',
      };
    });

    res.json(result);
  } catch (err: any) {
    console.error('Discount orders report error:', err);
    res.status(500).json({ error: err.message });
  }
});

const AUDIT_LOGS_FILE = path.join(process.cwd(), 'audit_logs.json');

// Initialize audit logs file if not exists
if (!fs.existsSync(AUDIT_LOGS_FILE)) {
  try {
    fs.writeFileSync(AUDIT_LOGS_FILE, '[]', 'utf8');
  } catch (err) {
    console.error('Failed to initialize audit logs file:', err);
  }
}

app.get('/api/audit-logs', (req, res) => {
  try {
    const { user, start_date, end_date } = req.query;
    let logs = [];
    
    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      const data = fs.readFileSync(AUDIT_LOGS_FILE, 'utf8');
      try {
        logs = data ? JSON.parse(data) : [];
      } catch (e) {
        logs = [];
      }
    }

    if (user) {
      logs = logs.filter((log: any) => log.user === user);
    }

    if (start_date || end_date) {
      logs = logs.filter((log: any) => {
        if (!log.timestamp) return false;
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        const s = start_date as string;
        const e = end_date as string;
        if (s && e) return logDate >= s && logDate <= e;
        if (s) return logDate >= s;
        if (e) return logDate <= e;
        return true;
      });
    }

    res.json(logs);
  } catch (error: any) {
    console.error('Audit Log GET Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/audit-logs', (req, res) => {
  try {
    const logEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      user: req.body.user || 'System',
      activity: req.body.activity || 'Unknown Action',
      details: req.body.details || ''
    };
    
    let logs = [];
    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      const data = fs.readFileSync(AUDIT_LOGS_FILE, 'utf8');
      try {
        logs = data ? JSON.parse(data) : [];
      } catch (e) {
        logs = [];
      }
    }
    
    logs.unshift(logEntry); // Add to beginning
    if (logs.length > 1000) logs = logs.slice(0, 1000); // Keep last 1000
    
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
    res.json(logEntry);
  } catch (error: any) {
    console.error('Audit Log POST Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function syncSettingsFromSupabase() {
  try {
    console.log('Syncing settings from Supabase...');
    const { data: dbBranches, error } = await supabase
      .from('branches_espresso')
      .select('*')
      .eq('name', '__SYSTEM_CONFIG__');
      
    if (error) {
      console.error('Failed to select config from branches table:', error.message);
      return;
    }
    
    if (dbBranches && dbBranches.length > 0) {
      const configStr = dbBranches[0].address;
      if (configStr) {
        try {
          const dbSettings = JSON.parse(configStr);
          console.log('Found persistent business settings in Supabase:', dbSettings);
          
          let localSettings: any = {};
          if (fs.existsSync(SETTINGS_FILE)) {
            try {
              const fileData = fs.readFileSync(SETTINGS_FILE, 'utf8');
              localSettings = JSON.parse(fileData);
            } catch (e) {
              localSettings = {};
            }
          }
          
          // database settings are the single source of truth across all Cloud Run instances
          const mergedSettings = dbSettings;
          
          fs.writeFileSync(SETTINGS_FILE, JSON.stringify(mergedSettings, null, 2), 'utf8');
          console.log('Successfully synced settings from Supabase branches to local file.');
        } catch (parseErr) {
          console.error('Failed to parse persistent config JSON:', parseErr);
        }
      }
    } else {
      console.log('No persistent business config row found in branches. Seeding it from local file...');
      if (fs.existsSync(SETTINGS_FILE)) {
        try {
          const fileData = fs.readFileSync(SETTINGS_FILE, 'utf8');
          const localSettings = JSON.parse(fileData);
          
          await supabase.from('branches_espresso').insert([
            { name: '__SYSTEM_CONFIG__', address: JSON.stringify(localSettings) }
          ]);
          console.log('Seeded business configuration to branches table in Supabase.');
        } catch (e: any) {
          console.error('Failed to seed business configuration:', e.message);
        }
      }
    }
  } catch (error: any) {
    console.error('Error in syncSettingsFromSupabase:', error);
  }
}

app.get('/api/settings', async (req, res) => {
  try {
    const { branch_id } = req.query;
    
    if (branch_id) {
      const bId = parseInt(branch_id as string, 10);
      const { data: branchData, error } = await supabase
        .from('branches_espresso')
        .select('*')
        .eq('id', bId)
        .single();
        
      if (!error && branchData) {
        try {
          if (branchData.address && branchData.address.trim().startsWith('{')) {
            const dbSettings = JSON.parse(branchData.address);
            return res.json(dbSettings);
          } else {
            return res.json({
              company_name: branchData.name,
              address: branchData.address || '',
              tin: '899-352-898-00000',
              service_charge_percentage: 0
            });
          }
        } catch (parseError) {
          return res.json({
            company_name: branchData.name,
            address: branchData.address || '',
            tin: '899-352-898-00000',
            service_charge_percentage: 0
          });
        }
      }
    }

    const { data: dbBranches, error: globalError } = await supabase
      .from('branches_espresso')
      .select('*')
      .eq('name', '__SYSTEM_CONFIG__');
      
    if (!globalError && dbBranches && dbBranches.length > 0 && dbBranches[0].address) {
      try {
        const dbSettings = JSON.parse(dbBranches[0].address);
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(dbSettings, null, 2), 'utf8');
        return res.json(dbSettings);
      } catch (parseError) {
        console.error('Failed to parse database system configuration:', parseError);
      }
    }
    
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.json({});
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const config = req.body;
    const { branch_id } = req.query;

    if (branch_id) {
      const bId = parseInt(branch_id as string, 10);
      const { error: updateError } = await supabase
        .from('branches_espresso')
        .update({ address: JSON.stringify(config) })
        .eq('id', bId);

      if (updateError) {
        console.error(`Failed to update config for branch ${bId}:`, updateError.message);
        return res.status(500).json({ error: updateError.message });
      }
      return res.json({ success: true });
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(config, null, 2), 'utf8');
    
    try {
      const { data: dbBranches, error: selectError } = await supabase
        .from('branches_espresso')
        .select('*')
        .eq('name', '__SYSTEM_CONFIG__');
        
      if (!selectError) {
        if (dbBranches && dbBranches.length > 0) {
          const { error: updateError } = await supabase
            .from('branches_espresso')
            .update({ address: JSON.stringify(config) })
            .eq('name', '__SYSTEM_CONFIG__');
          if (updateError) {
            console.error('Failed to update config in branches table:', updateError.message);
          } else {
            console.log('Successfully updated settings in Supabase branches table.');
          }
        } else {
          const { error: insertError } = await supabase
            .from('branches_espresso')
            .insert([{ name: '__SYSTEM_CONFIG__', address: JSON.stringify(config) }]);
          if (insertError) {
            console.error('Failed to insert config into branches table:', insertError.message);
          } else {
            console.log('Successfully inserted settings into Supabase branches table.');
          }
        }
      } else {
        console.error('Failed to check config row in branches:', selectError.message);
      }
    } catch (dbError: any) {
      console.error('Error during database settings sync:', dbError.message);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log('Server running on port ' + PORT);
    
    // Sync users if they are on local but Supabase is empty
    await syncUsersToSupabase();
    
    // Sync settings from Supabase database
    await syncSettingsFromSupabase();
    
    // Check for required tables on startup to warn if schema is missing
    const tablesToCheck = ['branches_espresso', 'categories_espresso', 'products_espresso', 'tables_espresso', 'orders_espresso', 'order_items_espresso', 'voucher_items_espresso', 'voucher_redemptions_espresso', 'shifts_espresso'];
    for (const table of tablesToCheck) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.message.includes('Could not find the table')) {
          console.warn(`[SCHEMA WARNING] Table '${table}' is missing in Supabase.`);
        } else if (error.message.includes('column')) {
          console.warn(`[SCHEMA WARNING] A column is missing in table '${table}': ${error.message}`);
        }
      }
    }
  });
}

startServer();
