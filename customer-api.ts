/**
 * S1p & Sp1n Laundry — Customer mobile app API  (mounted at /api/customer)
 *
 * Scope is deliberately narrow:
 *  - Only the Davao laundry branch (LAUNDRY_BRANCH_ID). No other branch is readable or writable.
 *  - Customers only see their own pickup requests, laundry orders and messages.
 *  - Writes go only to the laundry_* tables. orders_espresso is read-only here.
 *
 * Login is by SMS code:
 *  - SEMAPHORE_API_KEY set     → a random 6-digit code is sent by SMS (Semaphore).
 *  - CUSTOMER_TEST_PHONES       → comma-separated numbers (e.g. staff phones) that may log in with 123456
 *                                 while SMS is not set up. Everyone else is refused.
 *  - CUSTOMER_DEV_OTP=1         → any number may use 123456. Local testing only (customer-api-dev.ts), never in production.
 * Production (Cloud Run) must set CUSTOMER_TOKEN_SECRET: it signs logins and protects the login codes stored in
 * laundry_otp_codes, so every server copy accepts the same login and logins survive restarts.
 */
import express from 'express';
import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export const LAUNDRY_BRANCH_ID = 27;

const TIME_SLOTS = ['8:00 – 10:00 AM', '10:00 AM – 12:00 NN', '1:00 – 3:00 PM', '3:00 – 5:00 PM', '5:00 – 7:00 PM'];
const RUSH_PRICE = 100;
const DEV_OTP = '123456';
const TOKEN_TTL_MS = 60 * 24 * 3600 * 1000; // 60 days

const TOKEN_SECRET = process.env.CUSTOMER_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.CUSTOMER_TOKEN_SECRET) {
  console.warn('[customer-api] CUSTOMER_TOKEN_SECRET not set: customer logins reset when the server restarts.');
}

// ---------- helpers ----------

/** Normalise a PH mobile number to +639XXXXXXXXX, or null if it isn't one. */
export function normalizePhone(raw: unknown): string | null {
  const digits = String(raw || '').replace(/\D/g, '');
  const last10 = digits.slice(-10);
  if (!/^9\d{9}$/.test(last10)) return null;
  if (digits.length > 10 && !/^(63|0)$/.test(digits.slice(0, digits.length - 10))) return null;
  return '+63' + last10;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function sign(customerId: number): string {
  const payload = `${customerId}.${Date.now() + TOKEN_TTL_MS}`;
  const mac = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${mac}`;
}

function verify(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [id, exp, mac] = parts;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(`${id}.${exp}`).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now()) return null;
  return Number(id) || null;
}

// ---------- login codes ----------
// Stored in laundry_otp_codes (hashed) so they work across Cloud Run copies; falls back to memory
// when CUSTOMER_TOKEN_SECRET is not set or the table does not exist yet.
interface OtpEntry {
  codeHash: string;
  exp: number;
  tries: number;
  sentAt: number[];
}
const memOtps = new Map<string, OtpEntry>();
const hashCode = (phone: string, code: string) => crypto.createHmac('sha256', TOKEN_SECRET).update(`${phone}:${code}`).digest('hex');
const useDbOtps = () => !!process.env.CUSTOMER_TOKEN_SECRET;

async function getOtp(supabase: SupabaseClient, phone: string): Promise<OtpEntry | undefined> {
  if (useDbOtps()) {
    const { data, error } = await supabase.from('laundry_otp_codes').select('*').eq('phone', phone).maybeSingle();
    if (!error) return data ? { codeHash: data.code_hash, exp: new Date(data.expires_at).getTime(), tries: data.tries || 0, sentAt: data.sent_at || [] } : undefined;
  }
  return memOtps.get(phone);
}

async function saveOtp(supabase: SupabaseClient, phone: string, e: OtpEntry) {
  if (useDbOtps()) {
    const { error } = await supabase
      .from('laundry_otp_codes')
      .upsert([{ phone, code_hash: e.codeHash, expires_at: new Date(e.exp).toISOString(), tries: e.tries, sent_at: e.sentAt }], { onConflict: 'phone' });
    if (!error) return;
  }
  memOtps.set(phone, e);
}

async function deleteOtp(supabase: SupabaseClient, phone: string) {
  memOtps.delete(phone);
  if (useDbOtps()) await supabase.from('laundry_otp_codes').delete().eq('phone', phone);
}

const testPhones = () =>
  new Set(
    String(process.env.CUSTOMER_TEST_PHONES || '')
      .split(',')
      .map(p => normalizePhone(p))
      .filter(Boolean) as string[]
  );

async function sendSms(phone: string, message: string) {
  const body = new URLSearchParams({
    apikey: process.env.SEMAPHORE_API_KEY!,
    number: phone.replace('+63', '0'),
    message,
  });
  if (process.env.SEMAPHORE_SENDER_NAME) body.set('sendername', process.env.SEMAPHORE_SENDER_NAME);
  const res = await fetch('https://api.semaphore.co/api/v4/messages', { method: 'POST', body });
  if (!res.ok) throw new Error(`SMS provider error ${res.status}`);
}

// ---------- catalog (real products from the POS) ----------

type Unit = 'kg' | 'load' | 'pc';
interface CatalogService {
  id: string;
  category: 'wash_fold' | 'wash_only' | 'pressing' | 'dryclean' | 'other';
  name: string;
  price: number;
  unit: Unit;
  promo5plus2: boolean;
}
interface ShopSettings {
  contactPhone: string | null;
  gcashNumber: string | null;
  gcashName: string | null;
  promoTitle: string | null;
  promoText: string | null;
  facebookUrl: string | null;
}
interface Catalog {
  branch: { id: number; name: string; address: string };
  settings: ShopSettings;
  services: CatalogService[];
  addons: { id: string; name: string; price: number }[];
  rushPrice: number;
  timeSlots: string[];
}

let catalogCache: { at: number; data: Catalog } | null = null;

async function loadCatalog(supabase: SupabaseClient): Promise<Catalog> {
  if (catalogCache && Date.now() - catalogCache.at < 60 * 1000) return catalogCache.data;

  const [{ data: branch }, { data: products, error }, { data: settingsRow }] = await Promise.all([
    supabase.from('branches_espresso').select('id, name, address').eq('id', LAUNDRY_BRANCH_ID).single(),
    supabase
      .from('products_espresso')
      .select('id, name, price, unit, is_active, is_sellable, categories:categories_espresso(name, division)')
      .eq('branch_id', LAUNDRY_BRANCH_ID),
    // Shop phone, GCash and promo are typed by the owner in laundry_app_settings (add-laundry-app-settings.sql)
    supabase.from('laundry_app_settings').select('*').eq('branch_id', LAUNDRY_BRANCH_ID).maybeSingle(),
  ]);
  if (error) throw error;

  const services: CatalogService[] = [];
  const addons: Catalog['addons'] = [];
  const seen = new Set<string>();

  for (const p of products || []) {
    const cat: any = Array.isArray((p as any).categories) ? (p as any).categories[0] : (p as any).categories;
    if (!cat || cat.division !== 'laundry') continue;
    if ((p as any).is_active === 0 || (p as any).is_sellable === 0) continue;

    const name = String(p.name).trim().replace(/:$/, '').trim();
    const catName = String(cat.name || '').toLowerCase();
    const lower = name.toLowerCase();
    const key = `${catName}|${lower}`;
    if (seen.has(key)) continue; // the POS has a few duplicate entries (e.g. "Barong / Formal Shirt")
    seen.add(key);

    if (catName.includes('add on') || catName.includes('add-on') || catName.includes('detergent') || catName.includes('supplies')) {
      addons.push({ id: String(p.id), name, price: Number(p.price) || 0 });
      continue;
    }

    // Same per-kg / 5+2 rules as the POS laundry form (src/pages/POS.tsx)
    const unitField = String((p as any).unit || '').toLowerCase();
    const isWashOnly = catName.includes('wash only');
    const isPerKg = unitField === 'kg' || unitField === 'kilo' || lower.includes('/kg') || lower.includes('per kg') || lower.includes('kilo') || (catName.includes('everyday wear') && !isWashOnly);
    const category: CatalogService['category'] = isWashOnly
      ? 'wash_only'
      : catName.includes('everyday wear')
        ? 'wash_fold'
        : catName.includes('pressing') || catName.includes('iron')
          ? 'pressing'
          : catName.includes('dry clean')
            ? 'dryclean'
            : 'other';

    services.push({
      id: String(p.id),
      category,
      name,
      price: Number(p.price) || 0,
      unit: isPerKg ? 'kg' : isWashOnly ? 'load' : 'pc',
      promo5plus2: lower.includes('5+2') || lower.includes('5 + 2') || lower.includes('regular clothes') || lower.includes('towels & bedsheets'),
    });
  }

  services.sort((a, b) => a.category.localeCompare(b.category) || a.price - b.price);
  addons.sort((a, b) => a.name.localeCompare(b.name));

  const data: Catalog = {
    branch: { id: LAUNDRY_BRANCH_ID, name: branch?.name || 'S1p and Sp1n Laundry Shop', address: branch?.address || '' },
    settings: {
      contactPhone: settingsRow?.contact_phone || null,
      gcashNumber: settingsRow?.gcash_number || null,
      gcashName: settingsRow?.gcash_name || null,
      promoTitle: settingsRow?.promo_title || null,
      promoText: settingsRow?.promo_text || null,
      facebookUrl: settingsRow?.facebook_url || null,
    },
    services,
    addons,
    rushPrice: RUSH_PRICE,
    timeSlots: TIME_SLOTS,
  };
  catalogCache = { at: Date.now(), data };
  return data;
}

function estimateTotal(catalog: Catalog, services: Record<string, number>, addons: Record<string, number>, rush: boolean): number {
  let total = 0;
  for (const [id, q] of Object.entries(services)) {
    const s = catalog.services.find(x => x.id === id);
    const qty = Number(q) || 0;
    if (!s || qty <= 0) continue;
    const billed = s.promo5plus2 ? (qty <= 7 ? 5 : qty - 2) : qty;
    total += billed * s.price;
  }
  for (const [id, q] of Object.entries(addons)) {
    const a = catalog.addons.find(x => x.id === id);
    if (a && Number(q) > 0) total += a.price * Number(q);
  }
  return round2(total + (rush ? RUSH_PRICE : 0));
}

// ---------- order mapping ----------

export const ORDER_STATUS_MAP: Record<string, string> = {
  received: 'weighed', // order exists in the POS = laundry was weighed and priced at the counter
  washing: 'washing',
  drying: 'drying',
  folding: 'folding',
  ready: 'ready',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  claimed: 'claimed',
  cancelled: 'cancelled',
};

export function parseNotes(notes: any): any {
  if (!notes || typeof notes !== 'string' || !notes.trim().startsWith('{')) return null;
  try {
    return JSON.parse(notes);
  } catch {
    return null;
  }
}

export function billFromOrder(order: any, notes: any) {
  const lines = (notes?.services || []).map((s: any, i: number) => {
    const qty = Number(s.weight) || 0;
    const billed = s.billedWeight !== undefined ? Number(s.billedWeight) : qty;
    return {
      serviceId: String(s.id ?? i),
      name: String(s.name || 'Laundry service').replace(/:$/, ''),
      qty,
      billedQty: billed,
      freeQty: Math.max(0, round2(Number(s.freeKilos) || qty - billed)),
      unitPrice: Number(s.price) || 0,
      subtotal: round2(Number(s.subtotal) || billed * (Number(s.price) || 0)),
    };
  });
  let rush = 0;
  const addonLines: { id: string; name: string; qty: number; subtotal: number }[] = [];
  (notes?.addons || []).forEach((a: any, i: number) => {
    if (/rush/i.test(a.name || '')) rush += Number(a.price) || 0;
    else addonLines.push({ id: String(i), name: String(a.name || 'Add-on'), qty: 1, subtotal: round2(Number(a.price) || 0) });
  });
  const total = round2(Number(order.total) || 0);
  const sum = round2(lines.reduce((t: number, l: any) => t + l.subtotal, 0) + addonLines.reduce((t, a) => t + a.subtotal, 0) + rush);
  const discount = sum - total > 0.009 ? round2(sum - total) : 0;
  return { lines, addonLines, rush, discount, total, weighedAt: order.created_at };
}

// ---------- router ----------

export function createCustomerRouter(supabase: SupabaseClient) {
  const router = express.Router();
  router.use(express.json({ limit: '100kb' }));

  const auth: express.RequestHandler = async (req, res, next) => {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const id = token ? verify(token) : null;
    if (!id) return res.status(401).json({ error: 'Please log in again.' });
    const { data } = await supabase.from('laundry_customers').select('*').eq('id', id).maybeSingle();
    if (!data) return res.status(401).json({ error: 'Please log in again.' });
    (req as any).customer = data;
    next();
  };

  // --- login ---
  router.post('/otp/request', async (req, res) => {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) return res.status(400).json({ error: 'Enter a valid PH mobile number, e.g. 0917 123 4567.' });

    const smsReady = !!process.env.SEMAPHORE_API_KEY;
    const testCode = !smsReady && (process.env.CUSTOMER_DEV_OTP === '1' || testPhones().has(phone));
    if (!smsReady && !testCode) return res.status(503).json({ error: 'SMS login is not set up yet. Please try again soon.' });

    const prev = await getOtp(supabase, phone);
    const recent = (prev?.sentAt || []).filter(t => Date.now() - t < 3600 * 1000);
    if (recent.length >= 5) return res.status(429).json({ error: 'Too many codes requested. Try again in an hour.' });

    const code = smsReady ? String(crypto.randomInt(0, 1000000)).padStart(6, '0') : DEV_OTP;
    await saveOtp(supabase, phone, { codeHash: hashCode(phone, code), exp: Date.now() + 5 * 60 * 1000, tries: 0, sentAt: [...recent, Date.now()] });

    if (smsReady) {
      try {
        await sendSms(phone, `Your S1p & Sp1n Laundry code is ${code}. It expires in 5 minutes.`);
      } catch (e: any) {
        console.error('[customer-api] SMS send failed:', e.message);
        return res.status(502).json({ error: 'Could not send the SMS. Please try again.' });
      }
    }
    res.json({ sent: true, devCode: testCode });
  });

  router.post('/otp/verify', async (req, res) => {
    const phone = normalizePhone(req.body?.phone);
    const code = String(req.body?.code || '');
    const entry = phone ? await getOtp(supabase, phone) : undefined;
    if (!phone || !entry || entry.exp < Date.now()) return res.status(400).json({ error: 'The code expired. Request a new one.' });
    if (entry.tries >= 5) return res.status(429).json({ error: 'Too many wrong codes. Request a new one.' });
    const a = Buffer.from(hashCode(phone, code));
    const b = Buffer.from(entry.codeHash);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      await saveOtp(supabase, phone, { ...entry, tries: entry.tries + 1 });
      return res.status(400).json({ error: 'Wrong code. Please check the SMS and try again.' });
    }
    await deleteOtp(supabase, phone);

    let { data: customer } = await supabase.from('laundry_customers').select('*').eq('phone', phone).maybeSingle();
    if (!customer) {
      const { data: created, error } = await supabase.from('laundry_customers').insert([{ phone }]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      customer = created;
    }
    res.json({ token: sign(customer.id), customer, isNew: !customer.full_name });
  });

  // --- profile ---
  router.get('/me', auth, (req, res) => res.json({ customer: (req as any).customer }));

  router.put('/me', auth, async (req, res) => {
    const me = (req as any).customer;
    const updates: any = {};
    if (typeof req.body?.full_name === 'string') updates.full_name = req.body.full_name.trim().slice(0, 80);
    if (typeof req.body?.default_address === 'string') updates.default_address = req.body.default_address.trim().slice(0, 300);
    const d = req.body?.address_details;
    if (d && typeof d === 'object') {
      const clean: Record<string, string> = {};
      for (const k of ['province', 'city', 'barangay', 'zip', 'street', 'landmark']) clean[k] = String(d[k] || '').trim().slice(0, k === 'street' || k === 'landmark' ? 150 : 80);
      if (!clean.province || !clean.city || !clean.barangay || clean.street.length < 2) return res.status(400).json({ error: 'Please complete your address.' });
      updates.address_details = clean;
      updates.default_address = [clean.street, `Brgy. ${clean.barangay}`, clean.city, clean.province, clean.zip].filter(Boolean).join(', ');
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update.' });
    let { data, error } = await supabase.from('laundry_customers').update(updates).eq('id', me.id).select().single();
    if (error && error.message.includes('address_details')) {
      // Column not added yet (add-laundry-app-settings.sql): keep the address as text only
      delete updates.address_details;
      ({ data, error } = await supabase.from('laundry_customers').update(updates).eq('id', me.id).select().single());
    }
    if (error) return res.status(500).json({ error: error.message });
    res.json({ customer: data });
  });

  // --- catalog (public: prices are shown before login too) ---
  router.get('/catalog', async (_req, res) => {
    try {
      res.json(await loadCatalog(supabase));
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Could not load prices.' });
    }
  });

  // --- book a pickup ---
  router.post('/pickups', auth, async (req, res) => {
    const me = (req as any).customer;
    const b = req.body || {};
    const address = String(b.address || '').trim().slice(0, 300);
    const landmark = String(b.landmark || '').trim().slice(0, 120);
    const date = String(b.date || '');
    const slot = String(b.slot || '');
    const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10); // Manila date

    if (address.length < 5) return res.status(400).json({ error: 'Please enter your pickup address.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today) return res.status(400).json({ error: 'Please choose today or a later date.' });
    if (!TIME_SLOTS.includes(slot)) return res.status(400).json({ error: 'Please choose a time slot.' });

    const catalog = await loadCatalog(supabase);
    const services: Record<string, number> = {};
    for (const [id, q] of Object.entries(b.services || {})) {
      if (catalog.services.some(s => s.id === id) && Number(q) > 0 && Number(q) <= 100) services[id] = round2(Number(q));
    }
    const addons: Record<string, number> = {};
    for (const [id, q] of Object.entries(b.addons || {})) {
      if (catalog.addons.some(a => a.id === id) && Number(q) > 0 && Number(q) <= 50) addons[id] = Math.round(Number(q));
    }
    // Quick pickup: no services chosen; the staff choose them when they weigh the laundry at the shop
    const quick = !Object.keys(services).length;

    const rush = !!b.rush;
    const returnMode = b.returnMode === 'claim' ? 'claim' : 'deliver';
    const preferences = Array.isArray(b.preferences) ? b.preferences.map((p: any) => String(p).slice(0, 40)).slice(0, 10) : [];
    const estimate = estimateTotal(catalog, services, addons, rush);

    const { data, error } = await supabase
      .from('laundry_pickup_requests')
      .insert([
        {
          branch_id: LAUNDRY_BRANCH_ID,
          customer_id: me.id,
          address: landmark ? `${address} (Landmark: ${landmark})` : address,
          preferred_date: date,
          preferred_time: slot,
          service_notes: String(b.notes || '').trim().slice(0, 500) || null,
          preferences: { preferences, services, addons, rush, return_mode: returnMode, estimate, landmark, quick },
          source: 'app',
          status: 'requested',
        },
      ])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    await supabase.from('laundry_status_history').insert([{ pickup_request_id: data.id, status: 'requested', changed_by: 'Customer app' }]);
    res.json({ id: `req-${data.id}` });
  });

  router.post('/pickups/:id/cancel', auth, async (req, res) => {
    const me = (req as any).customer;
    const id = Number(String(req.params.id).replace('req-', ''));
    const { data: reqRow } = await supabase.from('laundry_pickup_requests').select('*').eq('id', id).eq('customer_id', me.id).maybeSingle();
    if (!reqRow) return res.status(404).json({ error: 'Pickup not found.' });
    if (reqRow.status !== 'requested') return res.status(400).json({ error: 'The shop already accepted this pickup. Please message the shop to cancel.' });
    await supabase.from('laundry_pickup_requests').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('laundry_status_history').insert([{ pickup_request_id: id, status: 'cancelled', changed_by: 'Customer app' }]);
    res.json({ success: true });
  });

  // --- my orders: pickup requests + laundry orders made at the counter with my phone number ---
  async function buildOrders(me: any): Promise<any[]> {
    const myLast10 = String(me.phone).slice(-10);

    const [{ data: requests }, { data: laundryOrders }] = await Promise.all([
      supabase.from('laundry_pickup_requests').select('*').eq('customer_id', me.id).eq('branch_id', LAUNDRY_BRANCH_ID).order('created_at', { ascending: false }).limit(50),
      supabase
        .from('orders_espresso')
        .select('id, status, total, notes, created_at, updated_at, payment_method, receipt_number, order_number')
        .eq('branch_id', LAUNDRY_BRANCH_ID)
        .in('status', ['paid', 'open'])
        .like('notes', '%"is_laundry":true%')
        .order('created_at', { ascending: false })
        .limit(1000),
    ]);

    // Orders whose phone on the laundry ticket matches this customer, or that came from their pickup requests
    const requestOrderIds = new Set((requests || []).map(r => r.order_id).filter(Boolean));
    const mine = (laundryOrders || []).filter(o => {
      if (requestOrderIds.has(o.id)) return true;
      const n = parseNotes(o.notes);
      const p = String(n?.phone || '').replace(/\D/g, '').slice(-10);
      return p.length === 10 && p === myLast10;
    });
    const orderIds = mine.map(o => o.id);

    // Tracking rows: link unclaimed ones to this customer, create missing ones
    const { data: tracking } = orderIds.length
      ? await supabase.from('laundry_order_tracking').select('*').in('order_id', orderIds)
      : { data: [] as any[] };
    const trackMap = new Map((tracking || []).map(t => [t.order_id, t]));
    const toInsert: any[] = [];
    for (const o of mine) {
      const t = trackMap.get(o.id);
      const n = parseNotes(o.notes);
      if (!t) {
        const row = { order_id: o.id, branch_id: LAUNDRY_BRANCH_ID, customer_id: me.id, laundry_status: n?.is_claimed ? 'claimed' : 'received', created_at: o.created_at };
        toInsert.push(row);
        trackMap.set(o.id, row);
      } else if (!t.customer_id) {
        await supabase.from('laundry_order_tracking').update({ customer_id: me.id }).eq('id', t.id);
      } else if (t.customer_id !== me.id) {
        trackMap.delete(o.id); // linked to someone else: never show it
      }
    }
    if (toInsert.length) await supabase.from('laundry_order_tracking').upsert(toInsert, { onConflict: 'order_id', ignoreDuplicates: true });

    // Status history for timelines
    const reqIds = (requests || []).map(r => r.id);
    const [{ data: histReq }, { data: histOrd }] = await Promise.all([
      reqIds.length ? supabase.from('laundry_status_history').select('*').in('pickup_request_id', reqIds).order('created_at') : Promise.resolve({ data: [] as any[] }),
      orderIds.length ? supabase.from('laundry_status_history').select('*').in('order_id', orderIds).order('created_at') : Promise.resolve({ data: [] as any[] }),
    ]);

    const ordersById = new Map(mine.filter(o => trackMap.has(o.id)).map(o => [o.id, o]));
    const result: any[] = [];

    const mapOrder = (o: any) => {
      const n = parseNotes(o.notes);
      const t = trackMap.get(o.id);
      let status = ORDER_STATUS_MAP[t?.laundry_status || 'received'] || 'weighed';
      // Staff use the POS "claimed" toggle (order notes); show that even before the status buttons exist
      if (n?.is_claimed && status !== 'delivered') status = 'claimed';
      const timeline = [
        { status: 'weighed', at: o.created_at },
        ...(histOrd || []).filter(h => h.order_id === o.id && ORDER_STATUS_MAP[h.status] && h.status !== 'received').map(h => ({ status: ORDER_STATUS_MAP[h.status], at: h.created_at })),
      ];
      if (status === 'claimed' && !timeline.some(x => x.status === 'claimed')) timeline.push({ status: 'claimed', at: n?.claimed_at || o.updated_at });
      return {
        status,
        timeline,
        final: billFromOrder(o, n),
        payment: o.status === 'paid' ? { method: String(o.payment_method || 'cash').toLowerCase(), status: 'paid', at: o.updated_at } : undefined,
        orderCode: 'SP-' + String(o.receipt_number || o.order_number || o.id),
        pickupDate: n?.pickup_date,
        pickupTime: n?.pickup_time,
        preferences: n?.preferences || [],
      };
    };

    for (const r of requests || []) {
      const p = r.preferences || {};
      const base = {
        id: `req-${r.id}`,
        code: `PR-${r.id}`,
        branchId: LAUNDRY_BRANCH_ID,
        createdAt: r.created_at,
        source: 'pickup',
        pickup: { address: r.address, landmark: p.landmark || '', date: r.preferred_date, slot: r.preferred_time, notes: r.service_notes || '' },
        returnMode: p.return_mode === 'claim' ? 'claim' : 'deliver',
        request: { services: p.services || {}, addons: p.addons || {}, rush: !!p.rush },
        quick: !!p.quick,
        preferences: p.preferences || [],
        estimate: Number(p.estimate) || 0,
        rider: r.assigned_rider || undefined,
      };
      const reqTimeline = (histReq || []).filter(h => h.pickup_request_id === r.id && h.status !== 'converted').map(h => ({ status: h.status, at: h.created_at }));
      if (!reqTimeline.length) reqTimeline.push({ status: 'requested', at: r.created_at });

      if (r.status === 'converted' && r.order_id && ordersById.has(r.order_id)) {
        const m = mapOrder(ordersById.get(r.order_id));
        ordersById.delete(r.order_id);
        result.push({ ...base, code: m.orderCode, status: m.status, timeline: [...reqTimeline, ...m.timeline], final: m.final, payment: m.payment });
      } else {
        result.push({ ...base, status: r.status === 'converted' ? 'picked_up' : r.status, timeline: reqTimeline });
      }
    }

    // Walk-in / counter orders with this customer's phone number
    for (const o of ordersById.values()) {
      const m = mapOrder(o);
      result.push({
        id: `ord-${o.id}`,
        code: m.orderCode,
        branchId: LAUNDRY_BRANCH_ID,
        createdAt: o.created_at,
        source: 'counter',
        status: m.status,
        timeline: m.timeline,
        pickup: { address: '', landmark: '', date: m.pickupDate || '', slot: m.pickupTime || '', notes: '' },
        returnMode: 'claim',
        request: { services: {}, addons: {}, rush: false },
        preferences: m.preferences,
        estimate: m.final.total,
        final: m.final,
        payment: m.payment,
      });
    }

    result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return result;
  }

  router.get('/orders', auth, async (req, res) => {
    const me = (req as any).customer;
    const orders = await buildOrders(me);
    // Attach this customer's reviews (table from add-laundry-reviews.sql; skipped if not created yet)
    const { data: reviews } = await supabase.from('laundry_reviews').select('order_key, rating, tags, comment, created_at').eq('customer_id', me.id);
    const byKey = new Map((reviews || []).map(r => [r.order_key, r]));
    res.json({ orders: orders.map(o => ({ ...o, review: byKey.get(o.id) || null })) });
  });

  // --- reviews: one per finished (delivered / claimed) order ---
  router.post('/reviews', auth, async (req, res) => {
    const me = (req as any).customer;
    const orderKey = String(req.body?.orderKey || '');
    const rating = Math.round(Number(req.body?.rating));
    if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'Please choose 1 to 5 stars.' });
    const tags = Array.isArray(req.body?.tags) ? req.body.tags.map((t: any) => String(t).slice(0, 40)).slice(0, 8) : [];
    const comment = String(req.body?.comment || '').trim().slice(0, 1000);

    const order = (await buildOrders(me)).find(o => o.id === orderKey);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (!['delivered', 'claimed'].includes(order.status)) return res.status(400).json({ error: 'You can review once your laundry is delivered or claimed.' });

    const { data, error } = await supabase
      .from('laundry_reviews')
      .insert([
        {
          branch_id: LAUNDRY_BRANCH_ID,
          customer_id: me.id,
          order_key: orderKey,
          order_code: order.code,
          order_id: orderKey.startsWith('ord-') ? Number(orderKey.slice(4)) : null,
          pickup_request_id: orderKey.startsWith('req-') ? Number(orderKey.slice(4)) : null,
          rating,
          tags,
          comment: comment || null,
        },
      ])
      .select('order_key, rating, tags, comment, created_at')
      .single();
    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'You already reviewed this order. Thank you!' });
      return res.status(500).json({ error: error.message });
    }
    res.json({ review: data });
  });

  // --- push notifications: remember this phone for the logged-in customer ---
  router.post('/push-token', auth, async (req, res) => {
    const me = (req as any).customer;
    const token = String(req.body?.token || '').trim();
    if (token.length < 20 || token.length > 4096) return res.status(400).json({ error: 'Invalid token.' });
    const platform = req.body?.platform === 'ios' ? 'ios' : 'android';
    const { error } = await supabase
      .from('laundry_push_tokens')
      .upsert([{ token, customer_id: me.id, platform, updated_at: new Date().toISOString() }], { onConflict: 'token' });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // On log out: stop sending to this phone
  router.post('/push-token/remove', auth, async (req, res) => {
    const me = (req as any).customer;
    await supabase.from('laundry_push_tokens').delete().eq('token', String(req.body?.token || '')).eq('customer_id', me.id);
    res.json({ success: true });
  });

  // --- chat ---
  router.get('/messages', auth, async (req, res) => {
    const me = (req as any).customer;
    const { data, error } = await supabase.from('laundry_messages').select('*').eq('customer_id', me.id).order('created_at', { ascending: true }).limit(300);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ messages: data || [] });
  });

  router.post('/messages', auth, async (req, res) => {
    const me = (req as any).customer;
    const body = String(req.body?.body || '').trim().slice(0, 1000);
    if (!body) return res.status(400).json({ error: 'Message is empty.' });
    const { data, error } = await supabase
      .from('laundry_messages')
      .insert([{ customer_id: me.id, sender: 'customer', sender_name: me.full_name || me.phone, body }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: data });
  });

  return router;
}
