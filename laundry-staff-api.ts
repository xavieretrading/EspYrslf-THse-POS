/**
 * S1p & Sp1n Laundry — staff side of the customer app  (mounted at /api/laundry-staff)
 * Used by the POS "Laundry App" page: pickup requests, laundry status, chat inbox, reviews.
 * Davao laundry branch only. Reads/writes the laundry_* tables; on orders_espresso it only
 * updates the notes "claimed" flag, exactly like the existing Claimed button on the Orders page.
 */
import express from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LAUNDRY_BRANCH_ID, parseNotes, billFromOrder } from './customer-api';
import { notifyCustomer, pushEnabled, pushToCustomers } from './push';

const PICKUP_ACTIVE = ['requested', 'accepted', 'rider_on_the_way', 'picked_up'];
const PICKUP_NEXT: Record<string, string[]> = {
  requested: ['accepted', 'rejected'],
  accepted: ['rider_on_the_way', 'picked_up', 'rejected'],
  rider_on_the_way: ['picked_up', 'not_picked_up'],
  not_picked_up: ['rider_on_the_way', 'cancelled'],
  picked_up: ['cancelled'],
};
export const LAUNDRY_STATUSES = ['received', 'washing', 'drying', 'folding', 'ready', 'out_for_delivery', 'delivered', 'claimed', 'cancelled'];
const FINISHED = ['claimed', 'delivered', 'cancelled'];

const staffName = (req: express.Request) => String(req.body?.by || 'Staff').slice(0, 60);

export function createLaundryStaffRouter(supabase: SupabaseClient) {
  const router = express.Router();
  router.use(express.json({ limit: '100kb' }));

  const history = (row: Record<string, any>) => supabase.from('laundry_status_history').insert([row]);

  // Badge counts for the sidebar
  router.get('/summary', async (_req, res) => {
    const [{ count: newPickups }, { count: unreadMessages }] = await Promise.all([
      supabase.from('laundry_pickup_requests').select('id', { count: 'exact', head: true }).eq('branch_id', LAUNDRY_BRANCH_ID).eq('status', 'requested'),
      supabase.from('laundry_messages').select('id', { count: 'exact', head: true }).eq('sender', 'customer').is('read_at', null),
    ]);
    res.json({ newPickups: newPickups || 0, unreadMessages: unreadMessages || 0 });
  });

  // ---------- pickup requests ----------
  const PICKUP_SELECT = '*, customer:laundry_customers(id, full_name, phone, default_address)';

  router.get('/pickups', async (req, res) => {
    const active = req.query.view !== 'done';
    let q = supabase.from('laundry_pickup_requests').select(PICKUP_SELECT).eq('branch_id', LAUNDRY_BRANCH_ID);
    q = active ? q.in('status', [...PICKUP_ACTIVE, 'not_picked_up']) : q.not('status', 'in', `(${[...PICKUP_ACTIVE, 'not_picked_up'].join(',')})`);
    const { data, error } = await q.order('created_at', { ascending: !active }).limit(active ? 200 : 60);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ pickups: data || [] });
  });

  router.get('/pickups/:id', async (req, res) => {
    const { data, error } = await supabase.from('laundry_pickup_requests').select(PICKUP_SELECT).eq('id', req.params.id).eq('branch_id', LAUNDRY_BRANCH_ID).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Pickup not found.' });
    res.json({ pickup: data });
  });

  router.post('/pickups/:id/status', async (req, res) => {
    const status = String(req.body?.status || '');
    const { data: p } = await supabase.from('laundry_pickup_requests').select('*').eq('id', req.params.id).eq('branch_id', LAUNDRY_BRANCH_ID).maybeSingle();
    if (!p) return res.status(404).json({ error: 'Pickup not found.' });
    if (!(PICKUP_NEXT[p.status] || []).includes(status)) return res.status(400).json({ error: `Cannot change "${p.status}" to "${status}".` });
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (typeof req.body?.rider === 'string' && req.body.rider.trim()) updates.assigned_rider = req.body.rider.trim().slice(0, 60);
    const { error } = await supabase.from('laundry_pickup_requests').update(updates).eq('id', p.id);
    if (error) return res.status(500).json({ error: error.message });
    await history({ pickup_request_id: p.id, status, changed_by: staffName(req), note: req.body?.note ? String(req.body.note).slice(0, 300) : null });
    // Tell the customer in chat when declined or missed, with the reason
    if ((status === 'rejected' || status === 'not_picked_up') && p.customer_id) {
      const reason = req.body?.note ? ` Reason: ${String(req.body.note).slice(0, 300)}` : '';
      const text = status === 'rejected' ? `Sorry, we can't accept your pickup request PR-${p.id}.${reason}` : `Our rider couldn't pick up your laundry for PR-${p.id}.${reason} Please message us to reschedule.`;
      await supabase.from('laundry_messages').insert([{ customer_id: p.customer_id, sender: 'staff', sender_name: staffName(req), body: text }]);
    }
    // Phone notification for each pickup step
    const pickupPush: Record<string, { title: string; body: string }> = {
      accepted: { title: 'Pickup accepted ✅', body: `We'll pick up your laundry ${p.preferred_time ? `at ${p.preferred_time}` : 'soon'}.` },
      rider_on_the_way: { title: 'Rider on the way 🛵', body: `${updates.assigned_rider || p.assigned_rider || 'Our rider'} is coming. Please prepare your laundry.` },
      picked_up: { title: 'Laundry picked up', body: "Your laundry is on its way to the shop. We'll send the price after weighing." },
      rejected: { title: 'Pickup not accepted', body: 'Sorry, we could not accept your pickup. Open the app for details.' },
      not_picked_up: { title: 'Pickup missed', body: "Our rider couldn't pick up your laundry. Open the app to reschedule." },
    };
    if (pickupPush[status]) notifyCustomer(supabase, p.customer_id, { ...pickupPush[status], data: { type: 'order', orderKey: `req-${p.id}` } });
    res.json({ success: true });
  });

  // Called by the POS laundry form after it saves the order for a pickup ("Weigh now")
  router.post('/pickups/:id/link-order', async (req, res) => {
    const orderId = Number(req.body?.order_id);
    const { data: p } = await supabase.from('laundry_pickup_requests').select('*').eq('id', req.params.id).eq('branch_id', LAUNDRY_BRANCH_ID).maybeSingle();
    if (!p) return res.status(404).json({ error: 'Pickup not found.' });
    const { data: order } = await supabase.from('orders_espresso').select('id, branch_id, total, notes, created_at, receipt_number, order_number').eq('id', orderId).maybeSingle();
    if (!order || order.branch_id !== LAUNDRY_BRANCH_ID) return res.status(400).json({ error: 'Order not found in the laundry branch.' });

    await supabase.from('laundry_pickup_requests').update({ status: 'converted', order_id: orderId, updated_at: new Date().toISOString() }).eq('id', p.id);
    const { data: t } = await supabase.from('laundry_order_tracking').select('id').eq('order_id', orderId).maybeSingle();
    if (t) await supabase.from('laundry_order_tracking').update({ customer_id: p.customer_id, pickup_request_id: p.id }).eq('id', t.id);
    else await supabase.from('laundry_order_tracking').insert([{ order_id: orderId, branch_id: LAUNDRY_BRANCH_ID, customer_id: p.customer_id, pickup_request_id: p.id, laundry_status: 'received' }]);
    await history({ pickup_request_id: p.id, status: 'converted', changed_by: staffName(req), note: `Order #${orderId}` });

    // Tell the customer exactly what the shop chose and the total (important for Quick pickups)
    if (p.customer_id) {
      const bill = billFromOrder(order, parseNotes(order.notes));
      const peso = (n: number) => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const lines = [
        ...bill.lines.map((l: any) => `• ${l.name}: ${l.qty}${l.freeQty > 0 ? ` (${l.freeQty} kg free)` : ''} = ${peso(l.subtotal)}`),
        ...bill.addonLines.map(a => `• ${a.name} = ${peso(a.subtotal)}`),
        ...(bill.rush ? [`• Rush service = ${peso(bill.rush)}`] : []),
        ...(bill.discount ? [`• Discount = -${peso(bill.discount)}`] : []),
      ];
      const code = 'SP-' + String(order.receipt_number || order.order_number || order.id);
      await supabase.from('laundry_messages').insert([
        {
          customer_id: p.customer_id,
          sender: 'staff',
          sender_name: staffName(req),
          body: [`Your laundry (PR-${p.id}) has been weighed. Order ${code}:`, ...lines, `Total: ${peso(bill.total)}`].join('\n'),
        },
      ]);
      notifyCustomer(supabase, p.customer_id, {
        title: 'Your laundry has been weighed ⚖️',
        body: `Total: ${peso(bill.total)}. Tap to see the services and pay.`,
        data: { type: 'order', orderKey: `req-${p.id}` },
      });
    }
    res.json({ success: true });
  });

  // ---------- laundry orders + status ----------
  router.get('/orders', async (req, res) => {
    const active = req.query.view !== 'done';
    const since = new Date(Date.now() - 60 * 86400000).toISOString();
    const { data: orders, error } = await supabase
      .from('orders_espresso')
      .select('id, status, total, notes, created_at, updated_at, payment_method, receipt_number, order_number')
      .eq('branch_id', LAUNDRY_BRANCH_ID)
      .in('status', ['paid', 'open'])
      .like('notes', '%"is_laundry":true%')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(400);
    if (error) return res.status(500).json({ error: error.message });

    const ids = (orders || []).map(o => o.id);
    const { data: tracking } = ids.length ? await supabase.from('laundry_order_tracking').select('*').in('order_id', ids) : { data: [] as any[] };
    const tMap = new Map((tracking || []).map(t => [t.order_id, t]));

    const list = (orders || []).map(o => {
      const n = parseNotes(o.notes) || {};
      const t = tMap.get(o.id);
      let status = t?.laundry_status || 'received';
      if (n.is_claimed && status !== 'delivered') status = 'claimed';
      const bill = billFromOrder(o, n);
      return {
        id: o.id,
        code: 'SP-' + String(o.receipt_number || o.order_number || o.id),
        customerName: n.customer_name || 'Walk-in',
        phone: n.phone || '',
        total: bill.total,
        paid: o.status === 'paid',
        createdAt: o.created_at,
        pickupDate: n.pickup_date || null,
        pickupTime: n.pickup_time || null,
        services: bill.lines.map((l: any) => `${l.name} ${l.qty}`).join(', ') || n.service_name || '',
        status,
        fromApp: !!(t?.customer_id || t?.pickup_request_id),
      };
    });
    res.json({ orders: list.filter(o => (active ? !FINISHED.includes(o.status) : FINISHED.includes(o.status))) });
  });

  router.post('/orders/:id/status', async (req, res) => {
    const status = String(req.body?.status || '');
    if (!LAUNDRY_STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status.' });
    const { data: order } = await supabase.from('orders_espresso').select('id, branch_id, notes').eq('id', req.params.id).maybeSingle();
    if (!order || order.branch_id !== LAUNDRY_BRANCH_ID) return res.status(404).json({ error: 'Laundry order not found.' });

    const now = new Date().toISOString();
    const { data: t } = await supabase.from('laundry_order_tracking').select('id, customer_id, pickup_request_id').eq('order_id', order.id).maybeSingle();
    const { error } = t
      ? await supabase.from('laundry_order_tracking').update({ laundry_status: status, updated_at: now }).eq('id', t.id)
      : await supabase.from('laundry_order_tracking').insert([{ order_id: order.id, branch_id: LAUNDRY_BRANCH_ID, laundry_status: status }]);
    if (error) return res.status(500).json({ error: error.message });
    await history({ order_id: order.id, status, changed_by: staffName(req) });

    const statusPush: Record<string, { title: string; body: string }> = {
      washing: { title: 'Washing now 🫧', body: 'Your laundry is in the machine.' },
      drying: { title: 'Drying now', body: 'Almost there!' },
      folding: { title: 'Folding now', body: 'Your laundry is being folded and packed.' },
      ready: { title: 'Your laundry is ready ✅', body: 'Clean, folded and packed. Open the app for details.' },
      out_for_delivery: { title: 'Out for delivery 🛵', body: 'Our rider is bringing your laundry back.' },
      delivered: { title: 'Delivered 💙', body: 'Thank you! Tap to rate your laundry.' },
      claimed: { title: 'Thank you for claiming 💙', body: 'Tap to rate your laundry.' },
    };
    if (statusPush[status] && t?.customer_id) {
      notifyCustomer(supabase, t.customer_id, {
        ...statusPush[status],
        data: { type: 'order', orderKey: t.pickup_request_id ? `req-${t.pickup_request_id}` : `ord-${order.id}` },
      });
    }

    // Keep the Orders page "Claimed" flag in sync (notes only, same as the existing Claimed button)
    const n = parseNotes(order.notes);
    if (n) {
      const claimed = status === 'claimed' || status === 'delivered';
      if (!!n.is_claimed !== claimed) {
        await supabase
          .from('orders_espresso')
          .update({ notes: JSON.stringify({ ...n, is_claimed: claimed, claimed_at: claimed ? now : null }) })
          .eq('id', order.id);
      }
    }
    res.json({ success: true });
  });

  // ---------- chat inbox ----------
  router.get('/conversations', async (_req, res) => {
    const { data: msgs, error } = await supabase
      .from('laundry_messages')
      .select('customer_id, sender, body, created_at, read_at, customer:laundry_customers(id, full_name, phone)')
      .order('created_at', { ascending: false })
      .limit(2000);
    if (error) return res.status(500).json({ error: error.message });
    const byCustomer = new Map<number, any>();
    for (const m of msgs || []) {
      const c: any = Array.isArray(m.customer) ? m.customer[0] : m.customer;
      if (!byCustomer.has(m.customer_id)) {
        byCustomer.set(m.customer_id, {
          customerId: m.customer_id,
          name: c?.full_name || c?.phone || 'Customer',
          phone: c?.phone || '',
          lastBody: m.body,
          lastAt: m.created_at,
          lastSender: m.sender,
          unread: 0,
        });
      }
      if (m.sender === 'customer' && !m.read_at) byCustomer.get(m.customer_id).unread++;
    }
    res.json({ conversations: [...byCustomer.values()] });
  });

  router.get('/messages/:customerId', async (req, res) => {
    const customerId = Number(req.params.customerId);
    const [{ data: customer }, { data: msgs, error }] = await Promise.all([
      supabase.from('laundry_customers').select('id, full_name, phone, default_address').eq('id', customerId).maybeSingle(),
      supabase.from('laundry_messages').select('*').eq('customer_id', customerId).order('created_at', { ascending: true }).limit(500),
    ]);
    if (error) return res.status(500).json({ error: error.message });
    await supabase.from('laundry_messages').update({ read_at: new Date().toISOString() }).eq('customer_id', customerId).eq('sender', 'customer').is('read_at', null);
    res.json({ customer, messages: msgs || [] });
  });

  router.post('/messages/:customerId', async (req, res) => {
    const body = String(req.body?.body || '').trim().slice(0, 1000);
    if (!body) return res.status(400).json({ error: 'Message is empty.' });
    const { data, error } = await supabase
      .from('laundry_messages')
      .insert([{ customer_id: Number(req.params.customerId), sender: 'staff', sender_name: staffName(req), body }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    notifyCustomer(supabase, Number(req.params.customerId), { title: 'S1p & Sp1n Laundry', body: body.length > 140 ? body.slice(0, 137) + '…' : body, data: { type: 'chat' } });
    res.json({ message: data });
  });

  // ---------- announcements (push to many customers) ----------
  async function audienceIds(audience: string): Promise<number[]> {
    const { data: tokens } = await supabase.from('laundry_push_tokens').select('customer_id');
    let ids = [...new Set((tokens || []).map(t => t.customer_id).filter(Boolean))] as number[];
    if (audience === 'inactive' && ids.length) {
      // No pickup and no laundry order in the last 30 days
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [{ data: recentPickups }, { data: recentOrders }] = await Promise.all([
        supabase.from('laundry_pickup_requests').select('customer_id').gte('created_at', since).in('customer_id', ids),
        supabase.from('laundry_order_tracking').select('customer_id').gte('created_at', since).in('customer_id', ids),
      ]);
      const active = new Set([...(recentPickups || []), ...(recentOrders || [])].map(r => r.customer_id));
      ids = ids.filter(id => !active.has(id));
    }
    return ids;
  }

  router.get('/announcements', async (req, res) => {
    const audience = req.query.audience === 'inactive' ? 'inactive' : 'all';
    const [{ data, error }, ids] = await Promise.all([
      supabase.from('laundry_announcements').select('*').eq('branch_id', LAUNDRY_BRANCH_ID).order('created_at', { ascending: false }).limit(50),
      audienceIds(audience),
    ]);
    res.json({ announcements: error ? [] : data || [], audienceCount: ids.length, pushReady: pushEnabled(), notReady: !!error });
  });

  router.post('/announcements', async (req, res) => {
    const title = String(req.body?.title || '').trim().slice(0, 65);
    const body = String(req.body?.body || '').trim().slice(0, 240);
    const audience = req.body?.audience === 'inactive' ? 'inactive' : 'all';
    if (!title || !body) return res.status(400).json({ error: 'Please type a title and a message.' });
    if (!pushEnabled()) return res.status(503).json({ error: 'Push notifications are not set up on the server yet (FIREBASE_SERVICE_ACCOUNT).' });
    const ids = await audienceIds(audience);
    if (!ids.length) return res.status(400).json({ error: 'No customers can receive notifications yet. They need the app with notifications allowed.' });
    const delivered = await pushToCustomers(supabase, ids, { title, body, data: { type: 'promo' } });
    await supabase.from('laundry_announcements').insert([{ branch_id: LAUNDRY_BRANCH_ID, title, body, audience, recipients: ids.length, delivered, sent_by: staffName(req) }]);
    res.json({ recipients: ids.length, delivered });
  });

  // ---------- reviews ----------
  router.get('/reviews', async (_req, res) => {
    const { data, error } = await supabase
      .from('laundry_reviews')
      .select('*, customer:laundry_customers(full_name, phone)')
      .eq('branch_id', LAUNDRY_BRANCH_ID)
      .order('created_at', { ascending: false })
      .limit(300);
    if (error) return res.json({ reviews: [], average: null, count: 0, notReady: true });
    const list = data || [];
    const average = list.length ? Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10 : null;
    res.json({ reviews: list, average, count: list.length });
  });

  return router;
}
