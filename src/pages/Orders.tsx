import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../BranchContext';
import { useSettings } from '../SettingsContext';
import { Search, Calendar as CalendarIcon, Filter, ExternalLink, Printer, StopCircle, RefreshCw, HandCoins, CreditCard, ArrowRightLeft, X, Trash2, Plus } from 'lucide-react';
import { cn } from '../App';
import { logActivity } from '../lib/audit';
import { swalAlert, swalConfirm } from '../lib/swal';

type OrderItem = {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  notes?: string;
  status?: string;
  is_complimentary?: boolean;
  complimentary_recipient?: string;
  complimentary_authorized_by?: string;
  complimentary_server?: string;
};

type Order = {
  id: number;
  status: 'open' | 'paid' | 'voided' | 'refunded';
  total: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  discount_name?: string;
  service_charge?: number;
  created_at: string;
  table_name?: string;
  order_type?: string;
  payment_method?: string;
  items: OrderItem[];
};

import { computeOrderTotals } from '../lib/computationEngine';

export function getReceiptCalculations(receipt: any, settings?: any) {
  if (!receipt) {
    return { paxCount: 1, discountPaxCount: 0, vatableSales: 0, vatExemptSales: 0, vatAmount: 0, discountAmount: 0, vatRelief: 0, scDiscount: 0, total: 0, serviceChargeAmount: 0, netFoodAmount: 0 };
  }

  let pax = receipt.paxCount || 1;
  let spwdCount = receipt.discountPaxCount || 0;

  try {
    const saved = localStorage.getItem(`order_pax_${receipt.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      pax = parsed.paxCount || pax;
      spwdCount = parsed.discountPaxCount !== undefined ? parsed.discountPaxCount : spwdCount;
    }
  } catch (e) { }

  const subtotal = receipt.subtotal || 0;

  // Sum of non-complimentary items if available, else fallback to subtotal
  let nonCompSubtotal = 0;
  if (receipt.items && receipt.items.length > 0) {
    nonCompSubtotal = receipt.items
      .filter((item: any) => !item.is_complimentary)
      .reduce((sum: number, item: any) => sum + ((item.price || item.unit_price || 0) * item.quantity), 0);
  } else {
    nonCompSubtotal = subtotal;
  }

  let discountValue = receipt.discount_value;
  if ((discountValue === undefined || discountValue === null) && receipt.discounts) {
    discountValue = receipt.discounts.value;
  }
  if (discountValue === undefined || discountValue === null) {
    discountValue = 20; // Default Senior/PWD percent is 20
  }

  const basis = settings?.service_charge_basis || 'vat_exclusive';
  const scPercentage = settings?.service_charge_percentage || 0;

  const result = computeOrderTotals({
    subtotal: nonCompSubtotal,
    paxCount: pax,
    discountPaxCount: spwdCount,
    discountName: receipt.discount_name || (receipt.discounts?.name) || null,
    discountType: receipt.discount_type || (receipt.discounts?.type) || 'percentage',
    discountValue: parseFloat(discountValue as any),
    serviceChargePercentage: scPercentage,
    serviceChargeBasis: basis,
  });

  return {
    ...result,
    total: receipt.total || result.total
  };
}

export default function Orders() {
  const navigate = useNavigate();
  const { activeBranch } = useBranch();
  const { settings } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [typeFilter, setTypeFilter] = useState<'all' | 'complimentary' | 'vouchers' | 'normal'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'paid'>('all');

  // Custom Date
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Order details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Table Management
  const [tables, setTables] = useState<any[]>([]);
  const [isChangeTableOpen, setIsChangeTableOpen] = useState(false);

  useEffect(() => {
    if (activeBranch) {
      fetch(`/api/tables?branch_id=${activeBranch.id}`)
        .then(res => res.json())
        .then(setTables);
    }
  }, [activeBranch]);

  const fetchOrders = async () => {
    if (!activeBranch) return;

    let url = `/api/orders/history?branch_id=${activeBranch.id}&filter=${filter}`;
    if (filter === 'custom' && startDate && endDate) {
      url += `&start_date=${startDate}&end_date=${endDate}`;
    }

    const res = await fetch(url);
    if (res.ok) {
      let data = await res.json();

      // Secondary Client-side filtering for Type and Status
      data = data.filter((order: Order) => {
        // Status Filter
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;

        // Type Filter
        if (typeFilter === 'complimentary') {
          return order.items.some(i => i.is_complimentary);
        }
        if (typeFilter === 'vouchers') {
          const isVoucherPayment = order.payment_method?.toLowerCase() === 'voucher';
          const hasVoucherItem = order.items.some(i => i.notes?.includes('(Voucher)'));
          return isVoucherPayment || hasVoucherItem;
        }
        if (typeFilter === 'normal') {
          const isVoucher = (order.payment_method?.toLowerCase() === 'voucher') || order.items.some(i => i.notes?.includes('(Voucher)'));
          const isComplimentary = order.items.some(i => i.is_complimentary);
          return !isVoucher && !isComplimentary;
        }

        return true;
      });

      setOrders(data);
      if (selectedOrder) {
        const updated = data.find((o: any) => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeBranch, filter, startDate, endDate, typeFilter, statusFilter]);

  const handleChangeTable = async (newTableId: number) => {
    if (!selectedOrder) return;
    const res = await fetch(`/api/orders/${selectedOrder.id}/table`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_table_id: newTableId })
    });
    if (res.ok) {
      setIsChangeTableOpen(false);
      fetchOrders();

      // refresh tables
      fetch(`/api/tables?branch_id=${activeBranch?.id}`)
        .then(res => res.json())
        .then(setTables);
    }
  };

  const handleVoid = async (id: number) => {
    const isConfirm = await swalConfirm('Are you sure you want to VOID this order? This action cannot be undone.');
    if (!isConfirm) return;

    const res = await fetch(`/api/orders/${id}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Voided by user' })
    });

    if (res.ok) {
      const localUser = localStorage.getItem('resto_active_user');
      const activeUser = localUser ? JSON.parse(localUser) : null;
      logActivity(activeUser?.full_name || activeUser?.username || 'Unknown', 'Void Order', `Voided Order #${id}`);

      swalAlert('Success', "Order successfully voided!", 'success');
      fetchOrders();
      setSelectedOrder(null);
    } else {
      swalAlert('Error', 'Failed to void order.', 'error');
    }
  };

  const handleRefund = async (id: number) => {
    const isConfirm = await swalConfirm('Are you sure you want to REFUND this paid order? Inventory will be returned.');
    if (!isConfirm) return;

    const res = await fetch(`/api/orders/${id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Refunded by operator' })
    });

    if (res.ok) {
      const localUser = localStorage.getItem('resto_active_user');
      const activeUser = localUser ? JSON.parse(localUser) : null;
      logActivity(activeUser?.full_name || activeUser?.username || 'Unknown', 'Refund Order', `Refunded Order #${id}`);

      swalAlert('Success', "Order successfully refunded!", 'success');
      fetchOrders();
      setSelectedOrder(null);
    } else {
      swalAlert('Error', 'Failed to refund order. Only paid orders can be refunded.', 'error');
    }
  };

  const [receiptData, setReceiptData] = useState<any>(null);
  const [reprintOrder, setReprintOrder] = useState<Order | null>(null);
  const [showReprintModal, setShowReprintModal] = useState(false);
  const receiptCalculations = getReceiptCalculations(receiptData, settings);

  const handleRemoveItem = async (orderId: number, itemId: number) => {
    const isConfirm = await swalConfirm('Are you sure you want to remove this item from the order?');
    if (!isConfirm) return;
    const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchOrders(); // Refresh order details
    }
  };

  const handleReprint = (order: Order) => {
    setReprintOrder(order);
    setShowReprintModal(true);
  };

  const executeReprint = async (order: Order, isReprintChoice: boolean) => {
    // Fetch full order data to populate the receipt accurately (using POS payload format)
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (res.ok) {
        const data = await res.json();

        const localUser = localStorage.getItem('resto_active_user');
        const activeUser = localUser ? JSON.parse(localUser) : null;
        const cashierName = activeUser?.full_name || activeUser?.username || 'Staff';

        const subtotal = data.subtotal || 0;
        const discountAmount = data.discount_amount || 0;
        let serviceCharge = data.service_charge || 0;
        let taxAmount = data.tax_amount || 0;
        let total = data.total || 0;

        if (data.status === 'open') {
          const results = computeOrderTotals({
            subtotal,
            paxCount: data.paxCount || 1,
            discountPaxCount: data.discountPaxCount || 0,
            discountName: data.discount_name,
            discountType: data.discount_type || 'percentage',
            discountValue: data.discount_value || 0,
            serviceChargePercentage: settings?.service_charge_percentage || 0,
            serviceChargeBasis: settings?.service_charge_basis || 'vat_exclusive'
          });
          serviceCharge = results.serviceChargeAmount;
          taxAmount = results.vatAmount;
          total = results.total;
        }

        setReceiptData({
          ...data,
          service_charge: serviceCharge,
          tax_amount: taxAmount,
          total: total,
          branch_name: activeBranch?.name,
          branch_address: activeBranch?.address,
          items: data.items.map((i: any) => ({
            ...i,
            name: i.product_name,
            is_complimentary: i.is_complimentary,
            complimentary_recipient: i.complimentary_recipient,
            complimentary_authorized_by: i.complimentary_authorized_by,
            complimentary_server: i.complimentary_server
          })),
          cashier_name: cashierName,
          amount_tendered: data.amount_tendered || total,
          change: data.change || 0,
          is_reprint: isReprintChoice
        });
      }
    } catch (err) {
      console.error('Failed to reprint invoice.');
    }
  };

  const handlePrintReceipt = async () => {
    if (receiptData?.is_reprint) {
      try {
        await fetch(`/api/orders/${receiptData.id}/reprint`, { method: 'POST' });
        fetchOrders();
      } catch (err) { }
    }
    window.print();
    setReceiptData(null);
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* Left side - Order List */}
      <div className="flex-1 flex flex-col h-full overflow-hidden print:hidden">
        <div className="p-8 pb-4">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
              <p className="text-slate-500">View history, refunds, and reprints.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button onClick={() => setFilter('today')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", filter === 'today' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>Today</button>
              <button onClick={() => setFilter('week')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", filter === 'week' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>This Week</button>
              <button onClick={() => setFilter('month')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", filter === 'month' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>This Month</button>
              <button onClick={() => setFilter('custom')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", filter === 'custom' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}><CalendarIcon size={14} /> Custom</button>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button onClick={() => setTypeFilter('all')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", typeFilter === 'all' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>All Types</button>
              <button onClick={() => setTypeFilter('normal')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", typeFilter === 'normal' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>Normal</button>
              <button onClick={() => setTypeFilter('complimentary')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", typeFilter === 'complimentary' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>Complimentary</button>
              <button onClick={() => setTypeFilter('vouchers')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", typeFilter === 'vouchers' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>Vouchers</button>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button onClick={() => setStatusFilter('all')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", statusFilter === 'all' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>All Status</button>
              <button onClick={() => setStatusFilter('open')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", statusFilter === 'open' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>Open Bill</button>
              <button onClick={() => setStatusFilter('paid')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", statusFilter === 'paid' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>Paid</button>
            </div>
          </div>

          {filter === 'custom' && (
            <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 w-max">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">Start:</span>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">End:</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
          )}

        </div>

        <div className="flex-1 overflow-auto px-8 pb-8">
          <div className="grid gap-4">
            {orders.map(order => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={cn(
                  "w-full text-left bg-white p-5 rounded-2xl border transition-all flex items-center justify-between",
                  selectedOrder?.id === order.id ? "border-emerald-500 shadow-md ring-1 ring-emerald-500" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                )}
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex flex-col">
                      <span className="font-bold text-base text-slate-900">Order #{order.id.toString().padStart(6, '0')}</span>
                      {order.receipt_number !== undefined && order.receipt_number !== null ? (
                        <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">Invoice #{order.receipt_number.toString().padStart(6, '0')}</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Invoice: Unpaid/Open</span>
                      )}
                    </div>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase",
                      order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'open' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'refunded' ? 'bg-purple-100 text-purple-700' :
                            'bg-red-100 text-red-700'
                    )}>
                      {order.status}
                    </span>
                    {order.items.some(i => i.is_complimentary) && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase">
                        Complimentary
                      </span>
                    )}
                    {order.table_name ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase">
                        Dine In - {order.table_name}
                      </span>
                    ) : (
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase",
                        (order.order_type === 'takeout' && order.payment_method !== 'Voucher' && !order.items.some(i => i.notes?.includes('(Voucher)')))
                          ? "bg-orange-100 text-orange-700"
                          : "bg-emerald-100 text-emerald-700"
                      )}>
                        {(order.order_type === 'takeout' && order.payment_method !== 'Voucher' && !order.items.some(i => i.notes?.includes('(Voucher)'))) ? 'Takeaway' : 'Walk-In'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-4">
                    <span>{new Date(order.created_at).toLocaleString()}</span>
                    {order.payment_method && <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>{order.payment_method.toUpperCase()}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl text-slate-900">
                    {order.payment_method?.toUpperCase() === 'VOUCHER' ? (
                      `${order.items?.reduce((sum: number, item: any) => sum + (item.points_used || 0) * (item.quantity || 1), 0) || 0} PTS`
                    ) : (
                      `₱${(order.total || 0).toFixed(2)}`
                    )}
                  </div>
                  <div className="text-sm text-slate-500">{order.items.length} items</div>
                </div>
              </button>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                No orders found for the selected filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Order Details */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10 print:hidden">
        {selectedOrder ? (
          <>
            <div className="p-6 border-b border-slate-100">
              <div className="mb-2">
                <h2 className="text-xl font-bold text-slate-900">Order #{selectedOrder.id.toString().padStart(6, '0')}</h2>
                {selectedOrder.receipt_number !== undefined && selectedOrder.receipt_number !== null ? (
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">Invoice #{selectedOrder.receipt_number.toString().padStart(6, '0')}</p>
                ) : (
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Invoice: Unpaid/Open</p>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-4">{new Date(selectedOrder.created_at).toLocaleString()}</p>

              <div className="flex gap-2">
                {selectedOrder.status === 'open' && (
                  <button onClick={() => navigate(`/pos?order_id=${selectedOrder.id}`)} className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-sm font-bold flex flex-col items-center justify-center transition-colors">
                    <CreditCard size={18} className="mb-1" />
                    Pay
                  </button>
                )}

                {selectedOrder.status === 'open' && selectedOrder.table_name && (
                  <button onClick={() => setIsChangeTableOpen(true)} className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-bold flex flex-col items-center justify-center transition-colors">
                    <ArrowRightLeft size={18} className="mb-1" />
                    Change Table
                  </button>
                )}

                {selectedOrder.status === 'open' && (
                  <button onClick={() => handleReprint(selectedOrder)} className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-sm font-bold flex flex-col items-center justify-center transition-colors">
                    <Printer size={18} className="mb-1" />
                    Summary
                  </button>
                )}

                {(selectedOrder.status === 'paid' || selectedOrder.status === 'refunded' || selectedOrder.status === 'voided') && (
                  <button onClick={() => handleReprint(selectedOrder)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold flex flex-col items-center justify-center transition-colors">
                    <Printer size={18} className="mb-1" />
                    Reprint
                  </button>
                )}

                {(selectedOrder.status === 'open' || selectedOrder.status === 'paid') && (
                  <button onClick={() => handleVoid(selectedOrder.id)} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold flex flex-col items-center justify-center transition-colors">
                    <StopCircle size={18} className="mb-1" />
                    Void
                  </button>
                )}

                {selectedOrder.status === 'paid' && (
                  <button onClick={() => handleRefund(selectedOrder.id)} className="flex-1 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-sm font-bold flex flex-col items-center justify-center transition-colors">
                    <HandCoins size={18} className="mb-1" />
                    Refund
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Order Items</h3>
                {selectedOrder.status === 'open' && (
                  <button
                    onClick={() => navigate(`/pos?order_id=${selectedOrder.id}`)}
                    className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} /> Add Items
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start group">
                    <div>
                      <div className="font-medium text-slate-900">
                        {item.product_name}
                        {item.is_complimentary && (
                          <span className="ml-2 font-bold text-amber-600">(COMPLIMENTARY)</span>
                        )}
                        {item.notes?.includes('(Voucher)') && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded border border-emerald-200 align-middle">
                            VOUCHER
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        {item.quantity}x @ {item.is_complimentary ? '₱0.00' : (item.notes?.includes('(Voucher)') ? `${item.points_used || 0} PTS` : `₱${item.price.toFixed(2)}`)}
                        {item.is_complimentary && <span className="ml-1 line-through opacity-50">₱{item.price.toFixed(2)}</span>}
                      </div>
                      {item.is_complimentary && (
                        <div className="mt-1 text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-100 italic space-y-0.5">
                          {item.complimentary_recipient && <div>Recipient: {item.complimentary_recipient}</div>}
                          {item.complimentary_authorized_by && <div>Auth By: {item.complimentary_authorized_by}</div>}
                          {item.complimentary_slip_number && <div>Slip #: {item.complimentary_slip_number}</div>}
                        </div>
                      )}
                      {item.notes && item.notes.includes('(Voucher)') && item.notes.replace(/\(Complimentary Voucher\)\s*/g, '').replace(/\(Voucher\)\s*/g, '').replace(/\[COMPLIMENTARY:.*?\]/g, '').replace(/\[COMPLIMENTARY\]/g, '').trim() !== '' && (
                        <div className="mt-2 text-xs font-bold text-emerald-800 bg-emerald-100 p-3 rounded-lg border-l-4 border-emerald-500 shadow-sm rotate-1 flex flex-col gap-1">
                          <div className="text-[10px] uppercase font-black opacity-50">Voucher Ref</div>
                          {item.notes.replace(/\(Complimentary Voucher\)\s*/g, '').replace(/\(Voucher\)\s*/g, '').replace(/\[COMPLIMENTARY:.*?\]/g, '').replace(/\[COMPLIMENTARY\]/g, '')}
                        </div>
                      )}
                      {!item.notes?.includes('(Voucher)') && item.notes && item.notes.replace(/\[COMPLIMENTARY:.*?\]/g, '').replace(/\[COMPLIMENTARY\]/g, '').trim() !== '' && (
                        <div className="mt-2 text-xs font-bold text-amber-900 bg-amber-100 p-3 rounded-lg border-l-4 border-amber-400 shadow-sm -rotate-1 flex flex-col gap-1">
                          <div className="text-[10px] uppercase font-black opacity-50">Sticky Note</div>
                          {item.notes.replace(/\[COMPLIMENTARY:.*?\]/g, '').replace(/\[COMPLIMENTARY\]/g, '')}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        {item.status === 'rejected' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded uppercase">
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-slate-900">
                        {item.is_complimentary ? '₱0.00' : (item.notes?.includes('(Voucher)') ? `${(item.points_used || 0) * item.quantity} PTS` : `₱${(item.quantity * item.price).toFixed(2)}`)}
                      </div>
                      {selectedOrder.status === 'open' && (
                        <button
                          onClick={() => handleRemoveItem(selectedOrder.id, item.id)}
                          className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex justify-between text-slate-500 text-sm">
                <span>Subtotal</span>
                <span>₱{selectedOrder.subtotal?.toFixed(2)}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                selectedOrder.discount_name && (
                  selectedOrder.discount_name.includes('VAT Exempt') ||
                  selectedOrder.discount_name.includes('Senior') ||
                  selectedOrder.discount_name.includes('PWD')
                ) ? (
                  <>
                    <div className="flex justify-between text-amber-600 text-sm">
                      <span>VAT Exemption</span>
                      <span>-₱{getReceiptCalculations(selectedOrder).vatRelief.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-amber-600 text-sm">
                      <span>Discount (Senior/PWD 20%)</span>
                      <span>-₱{getReceiptCalculations(selectedOrder).scDiscount.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-amber-600 text-sm">
                    <span>Discount ({selectedOrder.discount_name || 'Promo'})</span>
                    <span>-₱{selectedOrder.discount_amount?.toFixed(2)}</span>
                  </div>
                )
              )}
              <div className="flex justify-between text-slate-500 text-sm">
                <span>VAT (12%)</span>
                <span>
                  ₱{(selectedOrder.status === 'open'
                    ? (((selectedOrder.subtotal || 0) - (selectedOrder.discount_amount || 0)) - (((selectedOrder.subtotal || 0) - (selectedOrder.discount_amount || 0)) / 1.12))
                    : (selectedOrder.tax_amount || 0)
                  ).toFixed(2)}
                </span>
              </div>
              {((selectedOrder.status === 'open' && (settings?.service_charge_percentage || 0) > 0) || selectedOrder.service_charge > 0) && (
                <div className="flex justify-between text-slate-500 text-sm font-bold">
                  <span>Service Charge ({selectedOrder.status === 'open' ? settings?.service_charge_percentage : 0}%)</span>
                  <span>
                    ₱{(selectedOrder.status === 'open'
                      ? (selectedOrder.subtotal || 0) * ((settings?.service_charge_percentage || 0) / 100)
                      : selectedOrder.service_charge
                    ).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-lg">Total</span>
                <span className="font-bold text-slate-900 text-2xl mb-1">
                  {selectedOrder.payment_method?.toUpperCase() === 'VOUCHER' ? (
                    `${selectedOrder.items?.reduce((sum: number, item: any) => sum + (item.points_used || 0) * (item.quantity || 1), 0) || 0} PTS`
                  ) : (
                    `₱${(selectedOrder.status === 'open'
                      ? ((selectedOrder.subtotal || 0) - (selectedOrder.discount_amount || 0)) + ((selectedOrder.subtotal || 0) * ((settings?.service_charge_percentage || 0) / 100))
                      : selectedOrder.total
                    ).toFixed(2)}`
                  )}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Filter size={48} className="mb-4 opacity-20" />
            <p>Select an order from the list to view its details, reprint receipts, or process refunds.</p>
          </div>
        )}
      </div>

      {/* Change Table Modal */}
      {isChangeTableOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">Change Table</h3>
              <button onClick={() => setIsChangeTableOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">Select a new available table to move this order to.</p>
              <div className="grid grid-cols-3 gap-3">
                {tables.filter(t => t.status === 'available').map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleChangeTable(table.id)}
                    className="p-3 border border-slate-200 rounded-xl text-center hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    <div className="font-bold">{table.name}</div>
                  </button>
                ))}
                {tables.filter(t => t.status === 'available').length === 0 && (
                  <div className="col-span-3 text-center text-slate-500 p-4 bg-slate-50 rounded-xl">No available tables found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal Overlay */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 print:bg-white print:items-start print:justify-center backdrop-blur-sm">
          <div className="bg-white p-4 rounded-lg shadow-2xl max-w-[360px] w-full max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:shadow-none print:w-[80mm] print:p-0 print:m-0 printable-area">
            <style type="text/css" media="print">
              {`
                @page { size: 80mm auto; margin: 0; } 
                html, body { 
                  margin: 0; 
                  padding: 0;
                  print-color-adjust: exact; 
                  -webkit-print-color-adjust: exact;
                  color-scheme: light !important;
                  background-color: white !important;
                  background: white !important;
                  color: black !important;
                  width: 80mm !important;
                } 
                .print\\:hidden { display: none !important; }
                .printable-area { 
                  width: 80mm !important; 
                  max-width: 80mm !important; 
                  margin: 0 auto !important; 
                  padding: 6px !important; 
                  border: none !important;
                  box-shadow: none !important;
                  background: white !important;
                }
                .printable-area * {
                  font-size: 9.5pt !important; 
                  line-height: 1.2 !important; 
                  color: black !important;
                  font-family: Arial, Helvetica, sans-serif !important;
                  font-weight: 400 !important;
                }
                .printable-area p, .printable-area div, .printable-area span {
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .printable-area .row-item {
                  margin-top: 2.5px !important;
                  margin-bottom: 2.5px !important;
                }
                .printable-area .section-block {
                  margin-top: 5px !important;
                  margin-bottom: 5px !important;
                }
                .printable-area .section-header {
                  font-size: 10.5pt !important;
                  font-weight: 700 !important;
                  border-top: 1px dashed black !important;
                  border-bottom: 1px dashed black !important;
                  padding-top: 3px !important;
                  padding-bottom: 3px !important;
                  margin-top: 6px !important;
                  margin-bottom: 6px !important;
                  text-align: center;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                }
                .printable-area .receipt-logo {
                  max-width: 280px !important;
                  max-height: 85px !important;
                  height: auto !important;
                  display: block !important;
                  margin: 0 auto 4px auto !important;
                  object-fit: contain !important;
                }
                .printable-area .company-name {
                  font-size: 11.5pt !important;
                  font-weight: 700 !important;
                  display: block;
                  text-align: center;
                  text-transform: uppercase;
                  margin-bottom: 2px !important;
                }
                .printable-area .receipt-title {
                  font-size: 10.5pt !important;
                  font-weight: 700 !important;
                  display: block;
                  text-align: center;
                  text-transform: uppercase;
                  margin-bottom: 2px !important;
                }
                .printable-area .print-total,
                .printable-area .print-total * {
                  font-size: 13pt !important;
                  font-weight: 700 !important;
                  line-height: 1.4 !important;
                }
                .printable-area .print-change,
                .printable-area .print-change * {
                  font-size: 11.5pt !important;
                  font-weight: 700 !important;
                  line-height: 1.3 !important;
                }
                .printable-area .font-bold,
                .printable-area .font-black,
                .printable-area .font-semibold,
                .printable-area .print-bold-text {
                  font-weight: 700 !important;
                }
              `}
            </style>
            <style type="text/css">
              {`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  .printable-area, .printable-area * {
                    visibility: visible !important;
                  }
                  .printable-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 80mm !important;
                    max-width: 80mm !important;
                    background: white !important;
                  }
                }
                .printable-area { 
                  padding: 6px !important; 
                }
                .printable-area * {
                  font-size: 9.5pt !important;
                  line-height: 1.2 !important;
                  font-family: Arial, Helvetica, sans-serif !important;
                  font-weight: 400 !important;
                }
                .printable-area p, .printable-area div, .printable-area span {
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .printable-area .row-item {
                  margin-top: 2.5px !important;
                  margin-bottom: 2.5px !important;
                }
                .printable-area .section-block {
                  margin-top: 5px !important;
                  margin-bottom: 5px !important;
                }
                .printable-area .section-header {
                  font-size: 10.5pt !important;
                  font-weight: 700 !important;
                  border-top: 1px dashed black !important;
                  border-bottom: 1px dashed black !important;
                  padding-top: 3px !important;
                  padding-bottom: 3px !important;
                  margin-top: 6px !important;
                  margin-bottom: 6px !important;
                  text-align: center;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                }
                .printable-area .receipt-logo {
                  max-width: 280px !important;
                  max-height: 85px !important;
                  height: auto !important;
                  display: block !important;
                  margin: 0 auto 4px auto !important;
                  object-fit: contain !important;
                }
                .printable-area .company-name {
                  font-size: 11.5pt !important;
                  font-weight: 700 !important;
                  display: block;
                  text-align: center;
                  text-transform: uppercase;
                  margin-bottom: 2px !important;
                }
                .printable-area .receipt-title {
                  font-size: 10.5pt !important;
                  font-weight: 700 !important;
                  display: block;
                  text-align: center;
                  text-transform: uppercase;
                  margin-bottom: 2px !important;
                }
                .printable-area .print-total,
                .printable-area .print-total * {
                  font-size: 13pt !important;
                  font-weight: 700 !important;
                  line-height: 1.4 !important;
                }
                .printable-area .print-change,
                .printable-area .print-change * {
                  font-size: 11.5pt !important;
                  font-weight: 700 !important;
                  line-height: 1.3 !important;
                }
                .printable-area .font-bold,
                .printable-area .font-black,
                .printable-area .font-semibold,
                .printable-area .print-bold-text {
                  font-weight: 700 !important;
                }
                .void-watermark { 
                  position: absolute; 
                  top: 35%; 
                  left: 5%; 
                  width: 90%; 
                  text-align: center; 
                  font-size: 64px !important; 
                  font-weight: 900 !important; 
                  color: rgba(220, 38, 38, 0.18) !important; 
                  border: 6px solid rgba(220, 38, 38, 0.18) !important; 
                  padding: 8px !important; 
                  transform: rotate(-25deg); 
                  z-index: 10; 
                  text-transform: uppercase;
                  pointer-events: none;
                }
              `}
            </style>



            {(() => {
              const rawSubtotal = receiptData.items?.reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0;
              const isVoucherOrCompOrder = (receiptData.subtotal === 0 || !receiptData.subtotal) && rawSubtotal > 0 && (receiptData.payment_method?.toUpperCase() === 'COMPLIMENTARY' || receiptData.payment_method?.toUpperCase() === 'VOUCHER');
              const displaySubtotal = isVoucherOrCompOrder ? rawSubtotal : (receiptData.subtotal || 0);
              const receiptCalculations = getReceiptCalculations(receiptData, settings);
              const compTotal = receiptData.items?.filter((i: any) => i.is_complimentary || i.notes?.includes('[COMPLIMENTARY')).reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0;

              return (
                <div className="relative print:relative">
                  {/* VOID Watermark overlay */}
                  {receiptData.status === 'voided' && (
                    <div className="void-watermark select-none pointer-events-none">VOID</div>
                  )}

                  {/* Company Details */}
                  <div className="text-center section-block">
                    <div className="flex justify-center mb-1 text-center">
                      <img src="/logo.png" alt="Logo" className="receipt-logo" />
                    </div>
                    <p className="company-name">{settings?.company_name || 'ESPRESSO YOURSELF & TEA HOUSE'}</p>
                    <p>{settings?.address || 'Room 1 Crown Bldg., North Road 6, Mabolo, Cebu City'}</p>
                    <p>TIN: {settings?.tin || '899-352-898-00000'}</p>
                  </div>

                  {/* Receipt Header Title & Metadata */}
                  <div className="text-center section-block border-t border-dashed border-black pt-1.5">
                    <p className="receipt-title font-bold text-[11pt]">
                      {receiptData.status === 'open' ? 'ORDER SUMMARY' :
                        receiptData.status === 'voided' ? (activeBranch?.is_bir_compliant ? 'VOIDED SALES INVOICE' : 'VOIDED RECEIPT') :
                          receiptData.status === 'refunded' ? (activeBranch?.is_bir_compliant ? 'REFUNDED SALES INVOICE' : 'REFUNDED RECEIPT') :
                            (activeBranch?.is_bir_compliant ? 'SALES INVOICE' : 'RECEIPT')}
                    </p>
                    {receiptData.status !== 'open' && (
                      <p className="print-bold-text mt-0.5">- REPRINT -</p>
                    )}
                  </div>

                  <div className="section-block pt-1">
                    <div className="flex justify-between row-item">
                      <span>Invoice: {receiptData.receipt_number !== undefined && receiptData.receipt_number !== null ? `INV-${receiptData.receipt_number.toString().padStart(6, '0')}` : 'PENDING'}</span>
                    </div>
                    <div className="flex justify-between row-item">
                      <span>{new Date(receiptData.created_at || receiptData.updated_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }).replace(',', '')}</span>
                    </div>
                    <div className="flex justify-between row-item">
                      <span>Order: #{receiptData.id.toString().padStart(6, '0')}</span>
                    </div>
                    <div className="flex justify-between row-item">
                      <span>Cashier: {receiptData.cashier_name || 'Staff'}</span>
                    </div>
                  </div>

                  {/* Receipt Items list */}
                  <div className="section-block border-t border-dashed border-black pt-1.5 mt-1">
                    <div className="flex justify-between font-semibold border-b border-black pb-1 mb-1">
                      <span>Qty &nbsp;&nbsp; Item</span>
                      <span>Amount</span>
                    </div>
                    {receiptData.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between row-item">
                        <span className="flex flex-col max-w-[75%]">
                          <span>{item.quantity} &nbsp;&nbsp; {item.name || item.product_name} {item.is_complimentary && <span className="print-bold-text">(COMP)</span>}</span>
                          {item.notes && item.notes.replace(/\[DINE-IN\]\s*/g, '').replace(/\(Complimentary Voucher\)\s*/g, '').replace('(Voucher) ', '').replace(/\[COMPLIMENTARY:.*?\]/g, '').replace(/\[COMPLIMENTARY\]/g, '').trim() !== '' && (
                            <span className="text-[8pt] text-slate-600 italic">
                              {item.notes.replace(/\[DINE-IN\]\s*/g, '').replace(/\(Complimentary Voucher\)\s*/g, '').replace('(Voucher) ', '').replace(/\[COMPLIMENTARY:.*?\]/g, '').replace(/\[COMPLIMENTARY\]/g, '')}
                            </span>
                          )}
                        </span>
                        <span className="text-right">
                          ₱{((item.price * item.quantity)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Calculations & Totals */}
                  <div className="section-block border-t border-dashed border-black pt-1.5 mt-1">
                    <div className="flex justify-between row-item">
                      <span>Subtotal</span>
                      <span>₱{displaySubtotal.toFixed(2)}</span>
                    </div>
                    {receiptData.discount_amount > 0 && (
                      <div className="flex justify-between row-item">
                        <span>Discount ({receiptData.discount_name})</span>
                        <span>-₱{receiptData.discount_amount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between print-total row-item pt-1 mt-1 font-bold text-[13pt]">
                      <span>TOTAL</span>
                      <span>₱{(receiptData.total || 0).toFixed(2)}</span>
                    </div>
                    {receiptData.status !== 'open' && (
                      <>
                        <div className="flex justify-between row-item text-[10.5pt]">
                          <span>{receiptData.payment_method || 'CASH'}</span>
                          <span>₱{(receiptData.amount_tendered || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between print-bold-text print-change row-item font-bold text-[11.5pt]">
                          <span>Change</span>
                          <span>₱{(receiptData.change || 0).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* VAT Breakdown details */}
                  <div className="section-block pt-1">
                    <div className="flex justify-between row-item">
                      <span>VATable Sales</span>
                      <span>₱{receiptCalculations.vatableSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between row-item">
                      <span>VAT (12%)</span>
                      <span>₱{receiptCalculations.vatAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Dine In • Guests • Items summary */}
                  <div className="section-block pt-1 text-center">
                    <p className="row-item text-center">
                      {receiptData.table_name || 'Dine In'} • Guests: {receiptCalculations.paxCount || 1} • Items: {receiptData.items?.reduce((acc: number, item: any) => acc + item.quantity, 0)}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="text-center section-block border-t border-dashed border-black pt-1.5 mt-2">

                    <p className="font-bold print-bold-text mt-0.5">Thank you for your visit!</p>
                    <p className="font-bold print-bold-text mt-0.5">Enjoy!</p>
                    <p className="mt-1 text-[8pt]">
                      {receiptData.status === 'open' ? 'THIS IS NOT AN OFFICIAL RECEIPT' :
                        receiptData.status === 'voided' ? '*** VOIDED TRANSACTION ***' :
                          receiptData.status === 'refunded' ? '*** REFUNDED TRANSACTION ***' :
                            (activeBranch?.is_bir_compliant ? 'This serves as your Sales Invoice.' : 'This serves as your Receipt.')}
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="mt-8 flex gap-3 print:hidden">
              <button
                onClick={() => setReceiptData(null)}
                className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors"
              >
                Close
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-3 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold transition-colors"
              >
                {receiptData.status === 'open' ? 'Print Summary' : 'Print Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reprint Selector Modal */}
      {showReprintModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 flex flex-col font-sans">
            <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Print Copy Type</h3>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">
              This order has already been processed. Under BIR compliance rules, duplicate prints must be labeled as <strong className="text-slate-800">REPRINT</strong>.
              If the first print failed (e.g. printer jam, out of paper), you may select <strong className="text-slate-800">ORIGINAL</strong> to reprint without the label.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowReprintModal(false);
                  if (reprintOrder) {
                    executeReprint(reprintOrder, true);
                  }
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md"
              >
                Print REPRINT (Duplicate Copy)
              </button>
              <button
                onClick={() => {
                  setShowReprintModal(false);
                  if (reprintOrder) {
                    executeReprint(reprintOrder, false);
                  }
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md"
              >
                Print ORIGINAL (Jam / Failed Print)
              </button>
              <button
                onClick={() => {
                  setShowReprintModal(false);
                  setReprintOrder(null);
                }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
