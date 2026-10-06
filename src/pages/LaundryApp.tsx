import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Bike, CheckCircle2, ChevronLeft, Clock, Lock, MapPin, MessageCircle, Phone, RefreshCw, Scale, Send, Smartphone, Star, Store, Truck, XCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../App';
import Swal, { swalAlert, swalConfirm } from '../lib/swal';

// Staff side of the S1p & Sp1n customer app (Davao laundry branch). Data: /api/laundry-staff (laundry-staff-api.ts)

type Tab = 'pickups' | 'status' | 'chat' | 'reviews' | 'notify';

const PICKUP_LABEL: Record<string, string> = {
  requested: 'New request',
  accepted: 'Accepted',
  rider_on_the_way: 'Rider on the way',
  picked_up: 'Picked up',
  not_picked_up: 'Not picked up',
  converted: 'Weighed (order made)',
  rejected: 'Declined',
  cancelled: 'Cancelled',
};
const PICKUP_TONE: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-700 border-amber-200',
  accepted: 'bg-sky-100 text-sky-700 border-sky-200',
  rider_on_the_way: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  picked_up: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  not_picked_up: 'bg-rose-100 text-rose-700 border-rose-200',
  converted: 'bg-slate-100 text-slate-600 border-slate-200',
  rejected: 'bg-rose-50 text-rose-600 border-rose-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUS_LABEL: Record<string, string> = {
  received: 'Received',
  washing: 'Washing',
  drying: 'Drying',
  folding: 'Folding',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  claimed: 'Claimed',
  cancelled: 'Cancelled',
};
const STATUS_TONE: Record<string, string> = {
  received: 'bg-slate-100 text-slate-700',
  washing: 'bg-sky-100 text-sky-700',
  drying: 'bg-cyan-100 text-cyan-700',
  folding: 'bg-violet-100 text-violet-700',
  ready: 'bg-emerald-100 text-emerald-700',
  out_for_delivery: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-slate-100 text-slate-600',
  claimed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-rose-50 text-rose-600',
};
const NEXT_STATUS: Record<string, string[]> = {
  received: ['washing'],
  washing: ['drying'],
  drying: ['folding'],
  folding: ['ready'],
  ready: ['claimed', 'out_for_delivery'],
  out_for_delivery: ['delivered'],
};

const staffName = () => {
  try {
    const u = JSON.parse(localStorage.getItem('resto_active_user') || 'null');
    return u?.full_name || u?.username || 'Staff';
  } catch {
    return 'Staff';
  }
};

async function call(path: string, body?: any) {
  const res = await fetch(`/api/laundry-staff${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify({ ...body, by: staffName() }) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function askText(title: string, placeholder: string, required = false): Promise<string | null> {
  const r = await Swal.fire({
    title,
    input: 'text',
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: 'Save',
    confirmButtonColor: '#10b981',
    inputValidator: v => (required && !v?.trim() ? 'Please fill this in' : undefined),
  });
  return r.isConfirmed ? String(r.value || '').trim() : null;
}

const peso = (n: number) => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ago = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true });

export default function LaundryApp() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('pickups');
  const [summary, setSummary] = useState({ newPickups: 0, unreadMessages: 0 });
  const [chatWith, setChatWith] = useState<number | null>(null);

  const loadSummary = useCallback(() => {
    call('/summary')
      .then(d => setSummary({ newPickups: Number(d.newPickups) || 0, unreadMessages: Number(d.unreadMessages) || 0 }))
      .catch(() => {});
  }, []);
  useEffect(() => {
    loadSummary();
    const t = setInterval(loadSummary, 10000);
    return () => clearInterval(t);
  }, [loadSummary]);

  const openChat = (customerId: number) => {
    setChatWith(customerId);
    setTab('chat');
  };

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'pickups', label: 'Pickup Requests', badge: summary.newPickups },
    { id: 'status', label: 'Laundry Status' },
    { id: 'chat', label: 'Chat', badge: summary.unreadMessages },
    { id: 'reviews', label: 'Reviews' },
    { id: 'notify', label: 'Send notification' },
  ];

  return (
    <div className="p-3 md:p-5 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Smartphone size={22} className="text-emerald-600" /> Laundry App
          </h1>
          <p className="text-xs text-slate-500 font-semibold">Customer app requests, status updates, chat and reviews · S1p and Sp1n Laundry (Buhangin)</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'relative shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition',
              tab === t.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            {t.label}
            {!!t.badge && <span className="ml-2 inline-flex min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] items-center justify-center">{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'pickups' && <Pickups onChanged={loadSummary} onChat={openChat} onWeigh={id => navigate(`/pos?laundry_pickup=${id}`)} />}
      {tab === 'status' && <StatusBoard />}
      {tab === 'chat' && <Inbox selected={chatWith} onSelect={setChatWith} onRead={loadSummary} />}
      {tab === 'reviews' && <Reviews />}
      {tab === 'notify' && <Announcements />}
    </div>
  );
}

// ---------------- Pickup requests ----------------
function Pickups({ onChanged, onChat, onWeigh }: { onChanged: () => void; onChat: (customerId: number) => void; onWeigh: (id: number) => void }) {
  const [view, setView] = useState<'active' | 'done'>('active');
  const [pickups, setPickups] = useState<any[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const lastNew = useRef<number>(-1);

  const load = useCallback(async () => {
    try {
      const d = await call(`/pickups?view=${view}`);
      setPickups(Array.isArray(d.pickups) ? d.pickups : []);
      if (view === 'active') {
        const newCount = (Array.isArray(d.pickups) ? d.pickups : []).filter((p: any) => p.status === 'requested').length;
        if (lastNew.current >= 0 && newCount > lastNew.current) beep();
        lastNew.current = newCount;
      }
    } catch (e: any) {
      setPickups([]);
      swalAlert('Could not load pickups', e.message, 'error');
    }
  }, [view]);

  useEffect(() => {
    setPickups(null);
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (p: any, status: string) => {
    let extra: any = {};
    if (status === 'rider_on_the_way') {
      const rider = await askText('Who is the rider?', 'Rider name', true);
      if (rider === null) return;
      extra.rider = rider;
    }
    if (status === 'rejected' || status === 'not_picked_up') {
      const note = await askText(status === 'rejected' ? 'Why decline this pickup?' : 'Why was it not picked up?', 'The customer will see this in chat', true);
      if (note === null) return;
      extra.note = note;
    }
    if (status === 'cancelled' && !(await swalConfirm('Cancel this pickup?'))) return;
    setBusy(p.id);
    try {
      await call(`/pickups/${p.id}/status`, { status, ...extra });
      await load();
      onChanged();
    } catch (e: any) {
      swalAlert('Update failed', e.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Segmented value={view} onChange={setView} options={[['active', 'Open'], ['done', 'Done / declined']]} />
        <button onClick={load} className="ml-auto p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {pickups === null ? (
        <Empty text="Loading pickup requests…" />
      ) : pickups.length === 0 ? (
        <Empty text={view === 'active' ? 'No open pickup requests. New requests from the app appear here with a sound.' : 'Nothing here yet.'} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pickups.map(p => {
            const prefs = p.preferences || {};
            const c = p.customer || {};
            const quick = prefs.quick || !Object.keys(prefs.services || {}).length;
            return (
              <div key={p.id} className={cn('bg-white rounded-2xl border p-4 flex flex-col', p.status === 'requested' ? 'border-amber-300 shadow-md shadow-amber-100' : 'border-slate-200')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-black text-slate-800">PR-{p.id}</div>
                    <div className="text-[11px] text-slate-400 font-semibold">{ago(p.created_at)} · from {p.source === 'app' ? 'app' : p.source}</div>
                  </div>
                  <span className={cn('text-[11px] font-bold px-2 py-1 rounded-full border whitespace-nowrap', PICKUP_TONE[p.status] || 'bg-slate-100')}>{PICKUP_LABEL[p.status] || p.status}</span>
                </div>

                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="font-bold text-slate-800">{c.full_name || 'Customer'}</div>
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Phone size={14} /> {c.phone}
                    </a>
                  )}
                  <div className="flex gap-1.5 text-slate-600">
                    <MapPin size={14} className="shrink-0 mt-0.5 text-slate-400" />
                    <a className="hover:underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`}>
                      {p.address}
                    </a>
                  </div>
                  <div className="flex gap-1.5 text-slate-600">
                    <Clock size={14} className="shrink-0 mt-0.5 text-slate-400" />
                    {p.preferred_date ? format(new Date(p.preferred_date + 'T00:00'), 'EEE, MMM d') : ''} · {p.preferred_time}
                  </div>
                  <div className="flex gap-1.5 text-slate-600">
                    {prefs.return_mode === 'claim' ? <Store size={14} className="shrink-0 mt-0.5 text-slate-400" /> : <Truck size={14} className="shrink-0 mt-0.5 text-slate-400" />}
                    {prefs.return_mode === 'claim' ? 'Customer will claim at the shop' : 'Deliver back to customer'}
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 space-y-1">
                  {quick ? (
                    <div className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Scale size={13} /> Quick pickup: staff choose services when weighing
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-slate-700">Customer's estimate:</span> {peso(prefs.estimate || 0)}
                    </div>
                  )}
                  {prefs.rush && <div className="font-bold text-amber-600">Rush service</div>}
                  {prefs.preferences?.length > 0 && <div>Preferences: {prefs.preferences.join(', ')}</div>}
                  {p.service_notes && <div className="italic">“{p.service_notes}”</div>}
                  {p.assigned_rider && <div>Rider: {p.assigned_rider}</div>}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 mt-auto">
                  {p.status === 'requested' && (
                    <>
                      <ActBtn tone="emerald" busy={busy === p.id} onClick={() => act(p, 'accepted')} icon={<CheckCircle2 size={15} />}>Accept</ActBtn>
                      <ActBtn tone="rose" busy={busy === p.id} onClick={() => act(p, 'rejected')} icon={<XCircle size={15} />}>Decline</ActBtn>
                    </>
                  )}
                  {p.status === 'accepted' && (
                    <>
                      <ActBtn tone="indigo" busy={busy === p.id} onClick={() => act(p, 'rider_on_the_way')} icon={<Bike size={15} />}>Rider on the way</ActBtn>
                      <ActBtn tone="slate" busy={busy === p.id} onClick={() => act(p, 'picked_up')}>Picked up</ActBtn>
                    </>
                  )}
                  {p.status === 'rider_on_the_way' && (
                    <>
                      <ActBtn tone="emerald" busy={busy === p.id} onClick={() => act(p, 'picked_up')} icon={<CheckCircle2 size={15} />}>Picked up</ActBtn>
                      <ActBtn tone="rose" busy={busy === p.id} onClick={() => act(p, 'not_picked_up')}>Not picked up</ActBtn>
                    </>
                  )}
                  {p.status === 'not_picked_up' && (
                    <>
                      <ActBtn tone="indigo" busy={busy === p.id} onClick={() => act(p, 'rider_on_the_way')} icon={<Bike size={15} />}>Try again</ActBtn>
                      <ActBtn tone="slate" busy={busy === p.id} onClick={() => act(p, 'cancelled')}>Cancel</ActBtn>
                    </>
                  )}
                  {p.status === 'picked_up' && (
                    <>
                      <ActBtn tone="emerald" onClick={() => onWeigh(p.id)} icon={<Scale size={15} />}>
                        Weigh now
                      </ActBtn>
                      <ActBtn tone="slate" busy={busy === p.id} onClick={() => act(p, 'cancelled')}>
                        Cancel
                      </ActBtn>
                    </>
                  )}
                  {c.id && (
                    <button onClick={() => onChat(c.id)} className="ml-auto px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5">
                      <MessageCircle size={14} /> Message
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------- Laundry status board ----------------
function StatusBoard() {
  const [view, setView] = useState<'active' | 'done'>('active');
  const [orders, setOrders] = useState<any[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await call(`/orders?view=${view}`);
      setOrders(Array.isArray(d.orders) ? d.orders : []);
    } catch (e: any) {
      setOrders([]);
      swalAlert('Could not load laundry orders', e.message, 'error');
    }
  }, [view]);

  useEffect(() => {
    setOrders(null);
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const setStatus = async (o: any, status: string) => {
    setBusy(o.id);
    try {
      await call(`/orders/${o.id}/status`, { status });
      await load();
    } catch (e: any) {
      swalAlert('Update failed', e.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Segmented value={view} onChange={setView} options={[['active', 'In the shop'], ['done', 'Claimed / delivered']]} />
        <button onClick={load} className="ml-auto p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-3">Each step is shown to the customer in the app. Laundry orders from the last 60 days.</p>

      {orders === null ? (
        <Empty text="Loading laundry orders…" />
      ) : orders.length === 0 ? (
        <Empty text="No laundry orders here." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {orders.map(o => (
            <div key={o.id} className="p-3 flex flex-wrap items-center gap-3">
              <div className="min-w-[180px] flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800">{o.code}</span>
                  {o.fromApp && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">APP</span>}
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', o.paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>{o.paid ? 'PAID' : 'UNPAID'}</span>
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  {o.customerName}
                  {o.phone && <span className="text-slate-400 font-normal"> · {o.phone}</span>}
                </div>
                <div className="text-xs text-slate-500 truncate max-w-[420px]">{o.services}</div>
                <div className="text-[11px] text-slate-400">
                  {format(new Date(o.createdAt), 'MMM d, h:mm a')}
                  {o.pickupDate && ` · claim ${o.pickupDate}${o.pickupTime ? ' ' + o.pickupTime : ''}`}
                </div>
              </div>
              <div className="font-black text-slate-800 tabular-nums w-24 text-right">{peso(o.total)}</div>
              <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap', STATUS_TONE[o.status])}>{STATUS_LABEL[o.status] || o.status}</span>
              <div className="flex gap-1.5 flex-wrap">
                {(NEXT_STATUS[o.status] || []).map(s => (
                  <React.Fragment key={s}>
                    <ActBtn tone={s === 'claimed' || s === 'delivered' ? 'emerald' : 'slate'} busy={busy === o.id} onClick={() => setStatus(o, s)}>
                      {`${STATUS_LABEL[s]} →`}
                    </ActBtn>
                  </React.Fragment>
                ))}
                <select
                  aria-label="Set status"
                  value=""
                  onChange={e => e.target.value && setStatus(o, e.target.value)}
                  className="px-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 bg-white"
                >
                  <option value="">Set…</option>
                  {Object.keys(STATUS_LABEL).map(s => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Chat inbox ----------------
function Inbox({ selected, onSelect, onRead }: { selected: number | null; onSelect: (id: number | null) => void; onRead: () => void }) {
  const [convos, setConvos] = useState<any[] | null>(null);
  const [thread, setThread] = useState<{ customer: any; messages: any[] } | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConvos = useCallback(async () => {
    try {
      const d = await call('/conversations');
      setConvos(Array.isArray(d.conversations) ? d.conversations : []);
    } catch {
      setConvos([]);
    }
  }, []);

  const loadThread = useCallback(async () => {
    if (!selected) return setThread(null);
    try {
      const d = await call(`/messages/${selected}`);
      const next = { customer: d.customer || null, messages: Array.isArray(d.messages) ? d.messages : [] };
      setThread(prev => {
        if (prev && prev.messages.length === next.messages.length && prev.customer?.id === next.customer?.id) return prev;
        return next;
      });
      onRead();
    } catch {
      /* keep last */
    }
  }, [selected, onRead]);

  useEffect(() => {
    loadConvos();
    const t = setInterval(loadConvos, 10000);
    return () => clearInterval(t);
  }, [loadConvos]);

  useEffect(() => {
    setThread(null);
    loadThread();
    const t = setInterval(loadThread, 5000);
    return () => clearInterval(t);
  }, [loadThread]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [thread?.messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || !selected) return;
    setSending(true);
    try {
      await call(`/messages/${selected}`, { body });
      setText('');
      await loadThread();
      loadConvos();
    } catch (e: any) {
      swalAlert('Message not sent', e.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const quickReplies = useMemo(() => ['Hi! How can we help you?', 'Your laundry is ready for pickup.', 'Our rider is on the way.', 'Thank you! We received your payment.'], []);

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-3 h-[calc(100vh-220px)] min-h-[480px]">
      <div className={cn('bg-white rounded-2xl border border-slate-200 overflow-y-auto', selected && 'hidden md:block')}>
        {convos === null ? (
          <div className="p-4 text-sm text-slate-400">Loading…</div>
        ) : convos.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">No messages from customers yet.</div>
        ) : (
          convos.map(c => (
            <button
              key={c.customerId}
              onClick={() => onSelect(c.customerId)}
              className={cn('w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 flex gap-3', selected === c.customerId && 'bg-emerald-50')}
            >
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white grid place-items-center font-bold shrink-0">{String(c.name)[0]?.toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn('truncate text-sm', c.unread ? 'font-black text-slate-900' : 'font-semibold text-slate-700')}>{c.name}</span>
                  <span className="ml-auto text-[10px] text-slate-400 whitespace-nowrap">{ago(c.lastAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('truncate text-xs', c.unread ? 'text-slate-800 font-semibold' : 'text-slate-500')}>
                    {c.lastSender === 'staff' ? 'You: ' : ''}
                    {c.lastBody}
                  </span>
                  {c.unread > 0 && <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center">{c.unread}</span>}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className={cn('bg-white rounded-2xl border border-slate-200 flex flex-col min-h-0', !selected && 'hidden md:flex')}>
        {!selected ? (
          <div className="m-auto text-sm text-slate-400">Select a customer to read and reply.</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <button onClick={() => onSelect(null)} className="md:hidden p-1 -ml-1 text-slate-500" aria-label="Back to list">
                <ChevronLeft size={20} />
              </button>
              <div className="min-w-0">
                <div className="font-black text-slate-800 truncate">{thread?.customer?.full_name || thread?.customer?.phone || 'Customer'}</div>
                <div className="text-xs text-slate-500 truncate">
                  {thread?.customer?.phone}
                  {thread?.customer?.default_address ? ` · ${thread.customer.default_address}` : ''}
                </div>
              </div>
              {thread?.customer?.phone && (
                <a href={`tel:${thread.customer.phone}`} className="ml-auto p-2 rounded-full bg-emerald-50 text-emerald-700" title="Call">
                  <Phone size={16} />
                </a>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
              {(thread?.messages || []).map(m => (
                <div key={m.id} className={cn('flex', m.sender === 'staff' ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[75%] px-3.5 py-2 rounded-2xl text-sm', m.sender === 'staff' ? 'bg-emerald-600 text-white rounded-br-md' : 'bg-white border border-slate-200 rounded-bl-md')}>
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    <div className={cn('text-[10px] mt-1 text-right', m.sender === 'staff' ? 'text-emerald-100' : 'text-slate-400')}>
                      {m.sender === 'staff' && m.sender_name ? `${m.sender_name} · ` : ''}
                      {format(new Date(m.created_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="p-3 border-t border-slate-100">
              <div className="flex gap-1.5 overflow-x-auto pb-2">
                {quickReplies.map(q => (
                  <button key={q} onClick={() => setText(q)} className="shrink-0 px-2.5 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    {q}
                  </button>
                ))}
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  send();
                }}
                className="flex gap-2"
              >
                <input
                  id="laundry-chat-input"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type a reply"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                />
                <button type="submit" disabled={!text.trim() || sending} className="px-4 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1.5 disabled:opacity-40">
                  <Send size={16} /> Send
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------- Send notification (push to customers' phones) ----------------
const TEMPLATES = [
  { title: 'Promo today! 🎉', body: '7 kg and up, 2 kg free on regular clothes. Book a pickup in the app now!' },
  { title: 'Need laundry today? 🧺', body: 'Our rider can pick it up. Open the S1p & Sp1n app and book in seconds.' },
  { title: 'We miss you! 💙', body: "It's laundry day! Book a pickup and we'll take care of the rest." },
  { title: 'Rainy day? ☔', body: "Don't worry about drying. Book a pickup and we'll wash, dry and fold for you." },
];

function Announcements() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'all' | 'inactive'>('all');
  const [info, setInfo] = useState<{ announcements: any[]; audienceCount: number; pushReady: boolean; notReady?: boolean } | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await call(`/announcements?audience=${audience}`);
      // Normalise: an older server (without these routes) can answer with a different shape
      setInfo({
        announcements: Array.isArray(d.announcements) ? d.announcements : [],
        audienceCount: Number(d.audienceCount) || 0,
        pushReady: !!d.pushReady,
        notReady: !!d.notReady || !Array.isArray(d.announcements),
      });
    } catch {
      setInfo({ announcements: [], audienceCount: 0, pushReady: false });
    }
  }, [audience]);
  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    if (!title.trim() || !body.trim()) return;
    const ok = await swalConfirm(`Send to ${info?.audienceCount ?? 0} customer(s)?`, `"${title.trim()}" will pop up on their phones now.`);
    if (!ok) return;
    setSending(true);
    try {
      const r = await call('/announcements', { title, body, audience });
      swalAlert('Notification sent', `Delivered to ${r.delivered} phone(s) of ${r.recipients} customer(s).`, 'success');
      setTitle('');
      setBody('');
      load();
    } catch (e: any) {
      swalAlert('Not sent', e.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-4">
      <div className="space-y-4">
        {info && !info.pushReady && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Push notifications are not set up on the server yet. Add the Firebase key (FIREBASE_SERVICE_ACCOUNT) to Cloud Run to start sending.
          </div>
        )}
        {info?.notReady && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Run add-laundry-push.sql in Supabase to enable notifications.</div>
        )}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div>
            <label htmlFor="push-title" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Title <span className="font-normal normal-case text-slate-400">({title.length}/65)</span>
            </label>
            <input
              id="push-title"
              value={title}
              maxLength={65}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Promo today! 🎉"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none font-semibold"
            />
          </div>
          <div>
            <label htmlFor="push-body" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Message <span className="font-normal normal-case text-slate-400">({body.length}/240)</span>
            </label>
            <textarea
              id="push-body"
              value={body}
              maxLength={240}
              rows={3}
              onChange={e => setBody(e.target.value)}
              placeholder="e.g. 7 kg and up, 2 kg free. Book a pickup in the app now!"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none resize-none"
            />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Send to</div>
            <Segmented value={audience} onChange={setAudience} options={[['all', 'All app customers'], ['inactive', 'No order in 30 days']]} />
            <div className="text-xs text-slate-500 mt-1.5">{info ? `${info.audienceCount} customer(s) with notifications on` : 'Counting…'}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Examples (tap to use)</div>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map(t => (
                <button
                  key={t.title}
                  onClick={() => {
                    setTitle(t.title);
                    setBody(t.body);
                  }}
                  className="px-2.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={send}
            disabled={!title.trim() || !body.trim() || sending || !info?.pushReady}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Bell size={17} /> {sending ? 'Sending…' : 'Send notification'}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-700 text-sm">Sent notifications</div>
          {!info?.announcements?.length ? (
            <div className="p-4 text-sm text-slate-400">Nothing sent yet.</div>
          ) : (
            info.announcements.map(a => (
              <div key={a.id} className="px-4 py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">{a.title}</span>
                  <span className="ml-auto text-[11px] text-slate-400">{format(new Date(a.created_at), 'MMM d, h:mm a')}</span>
                </div>
                <div className="text-sm text-slate-600">{a.body}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {a.audience === 'inactive' ? 'No order in 30 days' : 'All app customers'} · {a.delivered} phone(s) · by {a.sent_by || 'Staff'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lock-screen preview */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preview on a locked phone</div>
        <div className="rounded-[36px] bg-gradient-to-b from-slate-800 to-slate-900 p-4 pt-8 min-h-[420px] text-white shadow-xl">
          <div className="text-center">
            <Lock size={16} className="mx-auto text-white/70" />
            <div className="text-5xl font-light mt-2 tabular-nums">{format(new Date(), 'h:mm')}</div>
            <div className="text-sm text-white/70">{format(new Date(), 'EEEE, MMMM d')}</div>
          </div>
          <div className="mt-8 rounded-2xl bg-white/90 text-slate-900 p-3 shadow-lg">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
              <img src="/s1p and sp1n.jpg" alt="" className="w-4 h-4 rounded" /> S1p &amp; Sp1n · now
            </div>
            <div className="font-bold text-sm mt-1 break-words">{title || 'Your title'}</div>
            <div className="text-sm text-slate-700 break-words">{body || 'Your message to customers.'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Reviews ----------------
function Reviews() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    call('/reviews')
      .then(d => setData({ ...d, reviews: Array.isArray(d.reviews) ? d.reviews : [], notReady: !!d.notReady || !Array.isArray(d.reviews) }))
      .catch(() => setData({ reviews: [], average: null, count: 0 }));
  }, []);
  if (!data) return <Empty text="Loading reviews…" />;
  if (data.notReady) return <Empty text="Reviews are not set up yet. Run add-laundry-reviews.sql in Supabase." />;
  return (
    <div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 mb-3">
        <div className="text-4xl font-black text-slate-800 tabular-nums">{data.average ?? '–'}</div>
        <div>
          <Stars n={Math.round(data.average || 0)} />
          <div className="text-xs text-slate-500 font-semibold mt-0.5">
            {data.count} review{data.count === 1 ? '' : 's'} from the app
          </div>
        </div>
      </div>
      {data.reviews.length === 0 ? (
        <Empty text="No reviews yet. Customers are asked for a review when their laundry is claimed or delivered." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.reviews.map((r: any) => (
            <div key={r.id} className={cn('bg-white rounded-2xl border p-4', r.rating <= 3 ? 'border-rose-200' : 'border-slate-200')}>
              <div className="flex items-center justify-between gap-2">
                <Stars n={r.rating} />
                <span className="text-[11px] text-slate-400">{format(new Date(r.created_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
              <div className="text-sm font-bold text-slate-800 mt-1.5">
                {r.customer?.full_name || 'Customer'} <span className="text-slate-400 font-normal">· {r.order_code}</span>
              </div>
              {r.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.tags.map((t: string) => (
                    <span key={t} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {r.comment && <p className="text-sm text-slate-600 mt-2">“{r.comment}”</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- small parts ----------------
function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 text-amber-400" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={16} fill={i <= n ? 'currentColor' : 'none'} className={i <= n ? '' : 'text-slate-200'} />
      ))}
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-slate-200/70">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition', value === v ? 'bg-white shadow text-slate-900' : 'text-slate-500')}>
          {label}
        </button>
      ))}
    </div>
  );
}

function ActBtn({ children, onClick, tone, busy, icon }: { children: React.ReactNode; onClick: () => void; tone: 'emerald' | 'rose' | 'indigo' | 'slate'; busy?: boolean; icon?: React.ReactNode }) {
  const tones = {
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
    indigo: 'bg-indigo-600 text-white hover:bg-indigo-700',
    slate: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
  };
  return (
    <button disabled={busy} onClick={onClick} className={cn('px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50', tones[tone])}>
      {icon}
      {children}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{text}</div>;
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [0, 0.18].forEach(t => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.16);
    });
  } catch {
    /* sound not available */
  }
}
