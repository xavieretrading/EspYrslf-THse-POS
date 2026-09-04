import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import qz from 'qz-tray';
import { useBranch } from '../BranchContext';
import { useSettings } from '../SettingsContext';
import { Calendar as CalendarIcon, Filter, Printer, StopCircle, HandCoins, CreditCard, ArrowRightLeft, X, Trash2, Plus, RefreshCw } from 'lucide-react';
import { cn } from '../App';
import { logActivity } from '../lib/audit';
import { swalAlert, swalConfirm } from '../lib/swal';
import { ESPRESSO_RECEIPT_LOGO } from '../lib/espressoLogo';
import { printReceiptViaBrowser, RECEIPT_PRINT_STYLES } from '../lib/receiptPrinter';

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
  reference_number?: string;
  notes?: string;
  order_number?: number;
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
  const localUser = localStorage.getItem('resto_active_user');
  const currentUser = localUser ? JSON.parse(localUser) : null;

  const navigate = useNavigate();
  const { activeBranch } = useBranch();
  const { settings } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [divisionFilter, setDivisionFilter] = useState<'all' | 'coffee' | 'laundry'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'paid'>('all');
  const [claimFilter, setClaimFilter] = useState<'all' | 'unclaimed' | 'claimed'>('all');

  // Printer settings
  const [qzPrinterName, setQzPrinterName] = useState(() => localStorage.getItem('qz_printer_name') || '');
  const [useQzTray, setUseQzTray] = useState(() => localStorage.getItem('qz_enabled') === 'true');
  const [qzConnected, setQzConnected] = useState(false);
  const [qzError, setQzError] = useState<string | null>(null);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);

  const fetchAvailablePrinters = async () => {
    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
      }
      setIsLoadingPrinters(true);
      const list = await qz.printers.find();
      if (Array.isArray(list) && list.length > 0) {
        setAvailablePrinters(list);
        const stored = localStorage.getItem('qz_printer_name');
        if (!stored || !list.includes(stored)) {
          const match = list.find((p: string) =>
            p.toLowerCase().includes('pos') ||
            p.toLowerCase().includes('receipt') ||
            p.toLowerCase().includes('80') ||
            p.toLowerCase().includes('generic') ||
            p.toLowerCase().includes('thermal')
          ) || list[0];
          if (match) {
            setQzPrinterName(match);
            localStorage.setItem('qz_printer_name', match);
          }
        }
      }
    } catch (e: any) {
      console.warn("Could not fetch printers from QZ Tray:", e?.message || e);
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  useEffect(() => {
    if (!useQzTray) {
      if (qz.websocket.isActive()) {
        qz.websocket.disconnect().catch(err => console.error("QZ Disconnect error:", err));
      }
      setQzConnected(false);
      return;
    }

    const connectQz = async () => {
      try {
        if (!qz.websocket.isActive()) {
          await qz.websocket.connect();
        }
        setQzConnected(true);
        setQzError(null);
        await fetchAvailablePrinters();
      } catch (err: any) {
        console.error("QZ connection failed:", err);
        setQzConnected(false);
        setQzError(err.message || "Could not connect to QZ Tray. Make sure it is running.");
      }
    };

    connectQz();
  }, [useQzTray]);

  const isLaundryBranch = activeBranch?.name?.toLowerCase().includes('laundry') || activeBranch?.name?.toLowerCase().includes('s1p') || activeBranch?.name?.toLowerCase().includes('spin');

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

        // Claim Filter (Unclaimed / Claimed)
        if (claimFilter !== 'all') {
          let isLaundry = false;
          let isClaimed = false;
          if (order.notes && order.notes.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(order.notes);
              if (parsed.is_laundry) {
                isLaundry = true;
                isClaimed = !!parsed.is_claimed;
              }
            } catch (e) { }
          }

          if (claimFilter === 'unclaimed') {
            if (!isLaundry || isClaimed) return false;
          } else if (claimFilter === 'claimed') {
            if (!isLaundry || !isClaimed) return false;
          }
        }

        // Division Filter
        if (divisionFilter !== 'all') {
          let isLaundry = false;
          if (order.notes && order.notes.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(order.notes);
              if (parsed.is_laundry) {
                isLaundry = true;
              }
            } catch (e) { }
          }

          if (divisionFilter === 'laundry' && !isLaundry) return false;
          if (divisionFilter === 'coffee' && isLaundry) return false;
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
  }, [activeBranch, filter, startDate, endDate, divisionFilter, statusFilter, claimFilter]);

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

  const handleToggleClaimStatus = async (order: Order, parsedNotes: any) => {
    const newClaimed = !parsedNotes.is_claimed;
    const actionText = newClaimed ? 'mark this order as claimed (picked up)?' : 'revert this order to unclaimed (still in shop)?';
    const isConfirm = await swalConfirm(`Are you sure you want to ${actionText}`);
    if (!isConfirm) return;

    const updatedNotesObj = {
      ...parsedNotes,
      is_claimed: newClaimed,
      claimed_at: newClaimed ? new Date().toISOString() : null
    };

    try {
      const res = await fetch(`/api/orders/${order.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: JSON.stringify(updatedNotesObj) })
      });

      if (res.ok) {
        // Refresh local orders list
        fetchOrders();
        // Update selected order details on screen
        setSelectedOrder(prev => {
          if (!prev) return null;
          return {
            ...prev,
            notes: JSON.stringify(updatedNotesObj)
          };
        });
        swalAlert('Success', `Order marked as ${newClaimed ? 'claimed' : 'unclaimed'}!`, 'success');
      } else {
        swalAlert('Error', 'Failed to update claim status.', 'error');
      }
    } catch (e) {
      console.error(e);
      swalAlert('Error', 'Error updating claim status.', 'error');
    }
  };

  const handleVoid = async (id: number) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      swalAlert('Permission Denied', 'Only administrators or managers are allowed to void orders.', 'error');
      return;
    }
    const isConfirm = await swalConfirm('Are you sure you want to VOID this order? This action cannot be undone.');
    if (!isConfirm) return;

    const res = await fetch(`/api/orders/${id}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Voided by user' })
    });

    if (res.ok) {
      logActivity(currentUser?.full_name || currentUser?.username || 'Unknown', 'Void Order', `Voided Order #${id}`);

      swalAlert('Success', "Order successfully voided!", 'success');
      fetchOrders();
      setSelectedOrder(null);
    } else {
      swalAlert('Error', 'Failed to void order.', 'error');
    }
  };

  const handleRefund = async (id: number) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      swalAlert('Permission Denied', 'Only administrators or managers are allowed to refund orders.', 'error');
      return;
    }
    const isConfirm = await swalConfirm('Are you sure you want to REFUND this paid order? Inventory will be returned.');
    if (!isConfirm) return;

    const res = await fetch(`/api/orders/${id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Refunded by operator' })
    });

    if (res.ok) {
      logActivity(currentUser?.full_name || currentUser?.username || 'Unknown', 'Refund Order', `Refunded Order #${id}`);

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

    if (useQzTray) {
      try {
        if (!qz.websocket.isActive()) {
          await qz.websocket.connect();
        }
        const config = qz.configs.create(qzPrinterName);
        const element = document.querySelector('.receipt-ticket-content');
        if (!element) {
          swalAlert('Print Error', 'Could not locate the receipt layout on screen.', 'error');
          return;
        }

        const printData = [
          {
            type: 'html',
            format: 'plain',
            data: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <title>Receipt Print</title>
                  <style>${RECEIPT_PRINT_STYLES}</style>
                </head>
                <body>
                  <div class="receipt-ticket-content">
                    ${element.innerHTML}
                  </div>
                </body>
              </html>
            `
          }
        ];

        await qz.print(config, printData);
        swalAlert('Success', 'Receipt printed successfully via QZ Tray.', 'success');
      } catch (err: any) {
        console.error("QZ print failed:", err);
        const fallback = await swalConfirm(
          'QZ Tray Print Issue',
          `Direct print could not complete (${err.message || 'connection issue'}). Would you like to print using the standard Browser Print Dialog instead?`
        );
        if (fallback) {
          await printReceiptViaBrowser();
        }
      }
    } else {
      await printReceiptViaBrowser();
    }
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

            {isLaundryBranch && (
              <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <button onClick={() => setDivisionFilter('all')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", divisionFilter === 'all' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>All Orders</button>
                <button onClick={() => setDivisionFilter('coffee')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", divisionFilter === 'coffee' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>Cafe Only</button>
                <button onClick={() => setDivisionFilter('laundry')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", divisionFilter === 'laundry' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>Laundry Only</button>
              </div>
            )}

            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button onClick={() => setStatusFilter('all')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", statusFilter === 'all' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>All Status</button>
              <button onClick={() => setStatusFilter('open')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", statusFilter === 'open' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>Open Bill</button>
              <button onClick={() => setStatusFilter('paid')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", statusFilter === 'paid' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>Paid</button>
            </div>

            {isLaundryBranch && (
              <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <button onClick={() => setClaimFilter('all')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", claimFilter === 'all' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>All Claim Status</button>
                <button onClick={() => setClaimFilter('unclaimed')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", claimFilter === 'unclaimed' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>Unclaimed</button>
                <button onClick={() => setClaimFilter('claimed')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", claimFilter === 'claimed' ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700")}>Claimed</button>
              </div>
            )}
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
                      <span className="font-bold text-base text-slate-900">Order #{(order.order_number || order.id).toString().padStart(6, '0')}</span>
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
                    {(() => {
                      let isLaundry = false;
                      if (order.notes && order.notes.trim().startsWith('{')) {
                        try {
                          const parsed = JSON.parse(order.notes);
                          if (parsed.is_laundry) isLaundry = true;
                        } catch (e) { }
                      }
                      return (
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border",
                          isLaundry
                            ? "bg-purple-50 border-purple-200 text-purple-700"
                            : "bg-amber-50 border-amber-200 text-amber-805 font-semibold"
                        )}>
                          {isLaundry ? "Laundry" : "Cafe"}
                        </span>
                      );
                    })()}
                    {(() => {
                      if (order.notes && order.notes.trim().startsWith('{')) {
                        try {
                          const parsed = JSON.parse(order.notes);
                          if (parsed.is_laundry) {
                            return (
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border",
                                parsed.is_claimed
                                  ? "bg-teal-50 border-teal-200 text-teal-700"
                                  : "bg-amber-50 border-amber-200 text-amber-700"
                              )}>
                                {parsed.is_claimed ? "Claimed" : "Unclaimed"}
                              </span>
                            );
                          }
                        } catch (e) { }
                      }
                      return null;
                    })()}
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
                    {order.status === 'paid' && order.payment_method && (
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border",
                        order.payment_method.toLowerCase() === 'cash' ? "bg-slate-50 border-slate-200 text-slate-600" :
                          order.payment_method.toLowerCase() === 'gcash' ? "bg-blue-50 border-blue-200 text-blue-600" :
                            order.payment_method.toLowerCase() === 'credit_card' ? "bg-purple-50 border-purple-200 text-purple-600" :
                              order.payment_method.toLowerCase() === 'voucher' ? "bg-amber-50 border-amber-200 text-amber-600" :
                                "bg-slate-50 border-slate-200 text-slate-600"
                      )}>
                        {order.payment_method.toUpperCase() === 'CREDIT_CARD' ? 'CARD' : order.payment_method.toUpperCase()}
                        {order.reference_number ? ` | REF: ${order.reference_number}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                    <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} Items</span>
                    {(() => {
                      if (order.notes && order.notes.trim().startsWith('{')) {
                        try {
                          const parsed = JSON.parse(order.notes);
                          if (parsed.is_laundry && parsed.customer_name) {
                            return (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-slate-700">{parsed.customer_name}</span>
                              </>
                            );
                          }
                        } catch (e) { }
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl text-slate-900">
                    {order.payment_method?.toUpperCase() === 'VOUCHER' ? (
                      `${order.items?.reduce((sum: number, item: any) => sum + (item.points_used || 0) * (item.quantity || 1), 0) || 0} PTS`
                    ) : (
                      `₱${(() => {
                        const realSub = order.items && order.items.length > 0
                          ? order.items.reduce((sum: number, item: any) => sum + (item.is_complimentary ? 0 : ((item.price || 0) * (item.quantity || 1))), 0)
                          : (order.subtotal || 0);
                        const realTot = Math.max(0, realSub - (order.discount_amount || 0));
                        return realTot.toFixed(2);
                      })()}`
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
                <h2 className="text-xl font-bold text-slate-900">Order #{(selectedOrder.order_number || selectedOrder.id).toString().padStart(6, '0')}</h2>
                {selectedOrder.receipt_number !== undefined && selectedOrder.receipt_number !== null ? (
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">Invoice #{selectedOrder.receipt_number.toString().padStart(6, '0')}</p>
                ) : (
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Invoice: Unpaid/Open</p>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-4">{new Date(selectedOrder.created_at).toLocaleString()}</p>

              {(() => {
                if (selectedOrder.notes && selectedOrder.notes.trim().startsWith('{')) {
                  try {
                    const parsed = JSON.parse(selectedOrder.notes);
                    if (parsed.is_laundry) {
                      const createdDate = new Date(selectedOrder.created_at);
                      const daysElapsed = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                      const isClaimed = !!parsed.is_claimed;

                      let storageStatusText = "";
                      let storageStatusColorClass = "";
                      let storageFee = 0;

                      if (isClaimed) {
                        storageStatusText = `Claimed on ${parsed.claimed_at ? new Date(parsed.claimed_at).toLocaleDateString() : 'N/A'}`;
                        storageStatusColorClass = "bg-teal-50 text-teal-700 border-teal-200";
                      } else {
                        if (daysElapsed >= 60) {
                          storageStatusText = `Subject to disposal (Unclaimed for ${daysElapsed} days)`;
                          storageStatusColorClass = "bg-rose-100 text-rose-800 border-rose-300 font-extrabold";
                          storageFee = (daysElapsed - 30) * 500;
                        } else if (daysElapsed > 30) {
                          storageFee = (daysElapsed - 30) * 500;
                          storageStatusText = `Storage Fee: ₱${storageFee} (${daysElapsed - 30} days overdue)`;
                          storageStatusColorClass = "bg-amber-100 text-amber-800 border-amber-300 font-bold";
                        } else {
                          storageStatusText = `Free Storage (${30 - daysElapsed} days left)`;
                          storageStatusColorClass = "bg-blue-50 text-blue-700 border-blue-200";
                        }
                      }

                      return (
                        <div className="mb-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Laundry Ticket Details</span>
                            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border", storageStatusColorClass)}>
                              {isClaimed ? "Claimed" : "Unclaimed"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-slate-400">Customer</p>
                              <p className="font-bold text-slate-800">{parsed.customer_name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Phone</p>
                              <p className="font-bold text-slate-800">{parsed.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Target Pickup</p>
                              <p className="font-semibold text-slate-800">{parsed.pickup_date || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 font-semibold text-slate-600">Storage Period</p>
                              <p className="font-semibold text-slate-800">{daysElapsed} days in shop</p>
                            </div>
                          </div>

                          <div className={cn("p-2 rounded-xl text-center text-xs font-semibold border mt-2", storageStatusColorClass)}>
                            {storageStatusText}
                            {storageFee > 0 && !isClaimed && (
                              <p className="text-[10px] font-medium mt-0.5">Storage penalty: ₱500/day after day 30</p>
                            )}
                          </div>

                          <button
                            onClick={() => handleToggleClaimStatus(selectedOrder, parsed)}
                            className={cn(
                              "w-full py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 mt-1",
                              isClaimed
                                ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm"
                            )}
                          >
                            {isClaimed ? "Mark as Unclaimed" : "Mark as Claimed"}
                          </button>
                        </div>
                      );
                    }
                  } catch (e) { }
                }
                return null;
              })()}

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



                {(selectedOrder.status === 'paid' || selectedOrder.status === 'refunded' || selectedOrder.status === 'voided') && (currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'cashier') && (
                  <button onClick={() => handleReprint(selectedOrder)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold flex flex-col items-center justify-center transition-colors">
                    <Printer size={18} className="mb-1" />
                    Reprint
                  </button>
                )}

                {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (selectedOrder.status === 'open' || selectedOrder.status === 'paid') && (
                  <button onClick={() => handleVoid(selectedOrder.id)} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold flex flex-col items-center justify-center transition-colors">
                    <StopCircle size={18} className="mb-1" />
                    Void
                  </button>
                )}

                {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && selectedOrder.status === 'paid' && (
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

            {(() => {
              const realSubtotal = selectedOrder.items && selectedOrder.items.length > 0
                ? selectedOrder.items.reduce((sum: number, item: any) => sum + (item.is_complimentary ? 0 : ((item.price || item.unit_price || 0) * (item.quantity || 1))), 0)
                : (selectedOrder.subtotal || 0);
              const realDiscount = selectedOrder.discount_amount || 0;
              const realTotal = Math.max(0, realSubtotal - realDiscount);

              return (
                <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
                  <div className="flex justify-between text-slate-500 text-sm">
                    <span>Subtotal</span>
                    <span>₱{realSubtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.status === 'paid' && selectedOrder.payment_method && (
                    <div className="flex justify-between text-slate-500 text-sm">
                      <span>Payment Method</span>
                      <span className="font-bold text-slate-700 uppercase">
                        {selectedOrder.payment_method}
                        {selectedOrder.reference_number ? ` (Ref: ${selectedOrder.reference_number})` : ''}
                      </span>
                    </div>
                  )}
                  {realDiscount > 0 && (
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
                        <span>-₱{realDiscount.toFixed(2)}</span>
                      </div>
                    )
                  )}

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-lg">Total</span>
                    <span className="font-bold text-slate-900 text-2xl mb-1">
                      {selectedOrder.payment_method?.toUpperCase() === 'VOUCHER' ? (
                        `${selectedOrder.items?.reduce((sum: number, item: any) => sum + (item.points_used || 0) * (item.quantity || 1), 0) || 0} PTS`
                      ) : (
                        `₱${realTotal.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>
              );
            })()}
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
          <div className="bg-white p-4 rounded-xl shadow-2xl max-w-[360px] w-full max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:shadow-none print:w-[80mm] print:p-0 print:m-0 printable-area border border-slate-200">
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
                ${RECEIPT_PRINT_STYLES}
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
              const rawSubtotal = receiptData.items?.reduce((sum: number, item: any) => sum + (item.is_complimentary ? 0 : ((item.price || 0) * (item.quantity || 1))), 0) || 0;
              const displaySubtotal = rawSubtotal > 0 ? rawSubtotal : (receiptData.subtotal || 0);
              const calcTotal = Math.max(0, displaySubtotal - (receiptData.discount_amount || 0));
              const isLaundryBranch = activeBranch?.name?.toLowerCase().includes('laundry') || activeBranch?.name?.toLowerCase().includes('s1p') || activeBranch?.name?.toLowerCase().includes('spin');

              // Parse laundry metadata if any
              let laundryDetails: any = null;
              if (receiptData.notes && receiptData.notes.trim().startsWith('{')) {
                try {
                  const parsed = JSON.parse(receiptData.notes);
                  if (parsed.is_laundry) {
                    laundryDetails = parsed;
                  }
                } catch (e) { }
              }

              if (laundryDetails) {
                return (
                  <div className="relative print:relative text-black receipt-ticket-content">
                    {receiptData.status === 'voided' && (
                      <div className="void-watermark select-none pointer-events-none">VOID</div>
                    )}

                    {/* Company Details */}
                    <div className="text-center section-block">
                      <p className="company-name font-black text-sm uppercase">{laundryDetails.company_name || 'SIP & SPIN LAUNDRY SHOP'}</p>
                      <p className="text-[9.5pt]">{settings?.address || 'Laundry Shop Address'}</p>
                      {/* <p className="text-[9.5pt]">TIN: {settings?.tin || '899-352-898-00000'}</p> */}
                    </div>

                    <div className="text-center section-block pt-1.5 pb-1">
                      <p className="receipt-title font-bold text-[11pt] border-y border-dashed border-black py-0.5">
                        {receiptData.status === 'voided' ? 'VOIDED LAUNDRY RECEIPT' : 'LAUNDRY RECEIPT'}
                      </p>
                    </div>

                    <div className="section-block pt-1 font-mono text-[9.5pt]">
                      <div className="flex justify-between row-item">
                        <span>Receipt No:</span>
                        <span className="font-bold">LS-{(receiptData.receipt_number || receiptData.id).toString().padStart(6, '0')}</span>
                      </div>
                      <div className="flex justify-between row-item">
                        <span>Date:</span>
                        <span>{new Date(receiptData.created_at || receiptData.updated_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }).replace(',', '')}</span>
                      </div>
                      <div className="flex justify-between row-item">
                        <span>Cashier:</span>
                        <span>{receiptData.cashier_name || 'Staff'}</span>
                      </div>
                    </div>

                    <div className="section-block border-t border-dashed border-black pt-1.5 mt-1.5 font-mono text-[9.5pt] space-y-0.5">
                      <div className="flex justify-between row-item">
                        <span>Customer:</span>
                        <span className="font-bold">{laundryDetails.customer_name}</span>
                      </div>
                      {laundryDetails.phone && (
                        <div className="flex justify-between row-item">
                          <span>Phone:</span>
                          <span>{laundryDetails.phone}</span>
                        </div>
                      )}
                      <div className="flex justify-between row-item">
                        <span>Service:</span>
                        <span className="font-bold">{laundryDetails.service_name}</span>
                      </div>
                      <div className="flex justify-between row-item">
                        <span>Weight:</span>
                        <span>{laundryDetails.weight} kg</span>
                      </div>
                      <div className="flex justify-between row-item">
                        <span>Rate:</span>
                        <span>₱{laundryDetails.rate.toFixed(2)}/kg</span>
                      </div>
                      <div className="flex justify-between row-item border-t border-dotted border-black/50 pt-1 mt-1 font-bold">
                        <span>Subtotal</span>
                        <span>₱{laundryDetails.subtotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Preferences */}
                    {laundryDetails.preferences && laundryDetails.preferences.length > 0 && (
                      <div className="section-block border-t border-dashed border-black pt-1.5 mt-1.5 font-mono text-[9pt]">
                        <div className="font-bold text-[8.5pt] uppercase tracking-wider mb-1">Preferences</div>
                        {laundryDetails.preferences.map((pref: string, idx: number) => (
                          <div key={idx} className="row-item pl-2 font-semibold">• {pref}</div>
                        ))}
                      </div>
                    )}

                    {/* Add-ons */}
                    {laundryDetails.addons && laundryDetails.addons.length > 0 && (
                      <div className="section-block border-t border-dashed border-black pt-1.5 mt-1.5 font-mono text-[9.5pt] space-y-0.5">
                        <div className="font-bold text-[8.5pt] uppercase tracking-wider mb-1">Add-ons</div>
                        {laundryDetails.addons.map((add: any, idx: number) => (
                          <div key={idx} className="flex justify-between row-item pl-2">
                            <span>{add.name}</span>
                            <span className="font-bold">₱{add.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Calculations & Totals */}
                    <div className="section-block border-t border-dashed border-black pt-2 mt-2 font-mono text-[10pt] space-y-1">
                      <div className="flex justify-between row-item font-bold text-[12pt] border-t-2 border-double border-black pt-1">
                        <span>TOTAL</span>
                        <span>₱{(receiptData.total || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between row-item text-[9.5pt]">
                        <span>Payment Method:</span>
                        <span className="uppercase font-bold">{receiptData.payment_method || 'CASH'}</span>
                      </div>
                      {receiptData.reference_number && (
                        <div className="flex justify-between row-item text-[9.5pt]">
                          <span>Ref No:</span>
                          <span className="font-bold">{receiptData.reference_number}</span>
                        </div>
                      )}
                      {receiptData.payment_method?.toLowerCase() === 'cash' && (
                        <>
                          <div className="flex justify-between row-item text-[9.5pt]">
                            <span>Cash Received:</span>
                            <span>₱{(receiptData.amount_tendered || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between row-item text-[9.5pt] font-bold">
                            <span>Change:</span>
                            <span>₱{(receiptData.change || 0).toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Pickup Details */}
                    <div className="section-block border-t border-dashed border-black pt-2 mt-2 text-center font-mono text-[9.5pt] bg-slate-50/50 p-1.5 rounded-lg">
                      <div className="font-bold text-[8.5pt] uppercase tracking-wider">Estimated Pickup</div>
                      <div className="font-bold text-[10.5pt] mt-0.5">
                        {laundryDetails.pickup_date ? new Date(laundryDetails.pickup_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'} at {laundryDetails.pickup_time || 'N/A'}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center pt-3 border-t border-dashed border-black mt-3 text-[9.5pt]">
                      <p className="font-bold">Thank you for choosing</p>
                      <p className="font-extrabold uppercase text-[10pt] tracking-wider">{laundryDetails.company_name || 'SIP & SPIN LAUNDRY SHOP'}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="relative print:relative receipt-ticket-content">
                  {/* VOID Watermark overlay */}
                  {receiptData.status === 'voided' && (
                    <div className="void-watermark select-none pointer-events-none">VOID</div>
                  )}

                  {/* Company Details */}
                  <div className="text-center section-block">
                    <div className="flex justify-center mb-1 text-center">
                      {!isLaundryBranch && <img src={ESPRESSO_RECEIPT_LOGO} alt="Espresso Yourself & Tea House" className="receipt-logo" />}
                    </div>
                    <p>{settings?.address || 'Room 1 Crown Bldg., North Road 6, Mabolo, Cebu City'}</p>
                    {/* <p>TIN: {settings?.tin || '899-352-898-00000'}</p> */}
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
                      <span>Order: #{(receiptData.order_number || receiptData.id).toString().padStart(6, '0')}</span>
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
                      <div className="flex justify-between row-item font-bold">
                        <span>Less: {receiptData.discount_name || 'Senior Citizen (20%)'}</span>
                        <span>-₱{receiptData.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {receiptData.discount_customer_name && (
                      <div className="text-[8.5pt] py-0.5 border-t border-dotted border-black mt-1">
                        <div>Senior Name: {receiptData.discount_customer_name}</div>
                      </div>
                    )}

                    <div className="flex justify-between print-total row-item pt-1 mt-1 font-bold text-[13pt]">
                      <span>TOTAL</span>
                      <span>₱{calcTotal.toFixed(2)}</span>
                    </div>
                    {receiptData.status !== 'open' && (
                      <>
                        <div className="flex justify-between row-item text-[10.5pt]">
                          <span>{receiptData.payment_method || 'CASH'}</span>
                          <span>₱{(receiptData.amount_tendered || 0).toFixed(2)}</span>
                        </div>
                        {receiptData.reference_number && (
                          <div className="flex justify-between row-item text-[9.5pt] italic">
                            <span>Ref No:</span>
                            <span>{receiptData.reference_number}</span>
                          </div>
                        )}
                        <div className="flex justify-between print-bold-text print-change row-item font-bold text-[11.5pt]">
                          <span>Change</span>
                          <span>₱{(receiptData.change || 0).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* VAT Breakdown details */}
                  {/* <div className="section-block pt-1">
                    <div className="flex justify-between row-item">
                      <span>VATable Sales</span>
                      <span>₱{receiptCalculations.vatableSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between row-item">
                      <span>VAT (12%)</span>
                      <span>₱{receiptCalculations.vatAmount.toFixed(2)}</span>
                    </div>
                  </div> */}

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

            {/* QZ Tray Printer Configuration Panel */}
            <div className="mt-4 pt-3 border-t border-slate-100 print:hidden text-left font-sans text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-700">Printer Mode:</span>
                <select
                  value={useQzTray ? 'qz' : 'browser'}
                  onChange={e => {
                    const checked = e.target.value === 'qz';
                    setUseQzTray(checked);
                    localStorage.setItem('qz_enabled', String(checked));
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value="browser">Browser Print dialog</option>
                  <option value="qz">Direct print (QZ Tray)</option>
                </select>
              </div>

              {useQzTray && (
                <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-700">Printer:</span>
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      {availablePrinters.length > 0 ? (
                        <select
                          value={qzPrinterName}
                          onChange={e => {
                            setQzPrinterName(e.target.value);
                            localStorage.setItem('qz_printer_name', e.target.value);
                          }}
                          className="max-w-[210px] px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 truncate"
                        >
                          {availablePrinters.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={qzPrinterName}
                          onChange={e => {
                            setQzPrinterName(e.target.value);
                            localStorage.setItem('qz_printer_name', e.target.value);
                          }}
                          placeholder="Printer name (e.g. POS-80)"
                          className="w-40 px-2 py-0.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 text-right"
                        />
                      )}
                      <button
                        type="button"
                        onClick={fetchAvailablePrinters}
                        disabled={isLoadingPrinters || !qzConnected}
                        title="Scan Windows for connected printers"
                        className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors shrink-0"
                      >
                        <RefreshCw size={12} className={isLoadingPrinters ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-200/60 text-[10.5px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">QZ Tray Status:</span>
                      {qzConnected ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">🟢 Connected ({availablePrinters.length} found)</span>
                      ) : qzError?.toLowerCase().includes('blocked') ? (
                        <span className="text-rose-600 font-bold" title={qzError}>🔴 Blocked in QZ Site Manager</span>
                      ) : qzError ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1" title={qzError}>🔴 Disconnected</span>
                      ) : (
                        <span className="text-amber-500 font-bold animate-pulse">🟡 Connecting...</span>
                      )}
                    </div>
                    {qzError?.toLowerCase().includes('blocked') && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900 space-y-2 mt-1">
                        <p className="font-bold flex items-center gap-1 text-rose-700">⚠️ Blocked by QZ Tray on this PC</p>
                        <p className="text-slate-600 text-[10px] leading-tight">
                          To unblock: Right-click green QZ Tray icon in taskbar ➔ <strong>Advanced</strong> ➔ <strong>Site Manager</strong> ➔ Select <code>localhost:8080</code> and click <strong>Delete</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            setUseQzTray(false);
                            localStorage.setItem('qz_enabled', 'false');
                            await printReceiptViaBrowser();
                          }}
                          className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                        >
                          <Printer size={13} /> Print Now with Browser Print (No Setup Needed)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3 print:hidden">
              <button
                onClick={() => setReceiptData(null)}
                className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors"
              >
                Close
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
              >
                <Printer size={16} /> {receiptData.status === 'open' ? 'Print Summary' : 'Print Receipt'}
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
