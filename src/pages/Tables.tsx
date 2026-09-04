import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Users, Edit2, Receipt, X, Printer, FileText } from 'lucide-react';
import { useBranch } from '../BranchContext';
import { useSettings } from '../SettingsContext';
import { cn } from '../App';
import { getReceiptCalculations } from './POS';
import { swalAlert, swalConfirm } from '../lib/swal';
import { ESPRESSO_RECEIPT_LOGO } from '../lib/espressoLogo';
import { printReceiptViaBrowser, RECEIPT_PRINT_STYLES } from '../lib/receiptPrinter';

type Table = { id: number; branch_id: number; name: string; capacity: number; status: string; active_order_id?: number | null };

export default function Tables() {
  const { activeBranch } = useBranch();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const receiptCalculations = getReceiptCalculations(receiptData, settings);

  const getManilaDate = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  };

  const fetchTables = () => {
    if (!activeBranch) return;
    fetch(`/api/tables?branch_id=${activeBranch.id}`)
      .then(res => res.json())
      .then(setTables);
  };

  useEffect(() => {
    fetchTables();
  }, [activeBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBranch || !name) return;

    if (editingId) {
      const res = await fetch(`/api/tables/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          capacity: parseInt(capacity)
        })
      });

      if (res.ok) {
        setEditingId(null);
        setName('');
        setCapacity('4');
        fetchTables();
      }
    } else {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: activeBranch.id,
          name,
          capacity: parseInt(capacity)
        })
      });

      if (res.ok) {
        setName('');
        setCapacity('4');
        fetchTables();
      }
    }
  };

  const handleEdit = (table: Table) => {
    setEditingId(table.id);
    setName(table.name);
    setCapacity(table.capacity.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setCapacity('4');
  };

  const handleDelete = async (id: number) => {
    const table = tables.find(t => t.id === id);
    if (table?.status === 'occupied') {
      swalAlert('Cannot Delete Table', 'Cannot delete an occupied table. Please close or cancel the order first.', 'warning');
      return;
    }

    const isConfirm = await swalConfirm('Are you sure you want to delete this table?');
    if (!isConfirm) return;

    try {
      const res = await fetch(`/api/tables/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        fetchTables();
      } else {
        swalAlert('Delete Failed', data.error || 'Unknown error', 'error');
      }
    } catch (err) {
      swalAlert('Error', 'An error occurred while deleting the table.', 'error');
    }
  };

  const handleBillOut = (orderId: number) => {
    navigate(`/pos?order_id=${orderId}`);
  };

  const handlePrintSummary = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setReceiptData({
          ...data,
          branch_name: activeBranch?.name,
          branch_address: activeBranch?.address,
          items: data.items.map((i: any) => ({ ...i, name: i.product_name })),
          cashier_name: 'Staff'
        });
      }
    } catch (err) {
      console.error('Failed to print order summary.');
    }
  };

  const handlePrintReceipt = async () => {
    await printReceiptViaBrowser();
  };

  if (!activeBranch) return null;

  return (
    <>
      <div className="p-8 h-full flex flex-col bg-slate-50 print:hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Table Management</h1>
          <p className="text-slate-500">Manage tables and seating capacity for {activeBranch.name}.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-fit">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Table' : 'Add New Table'}</h2>
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full border border-slate-100"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Table Name / Number</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Table 12, VIP A"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Seating Capacity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                {editingId ? 'Update Table' : 'Add Table'}
              </button>
            </form>
          </div>

          {/* Grid */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Current Tables</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {tables.map(table => (
                <div
                  key={table.id}
                  className={cn(
                    "p-4 rounded-2xl border flex flex-col items-center text-center gap-2 relative group transition-all",
                    table.status === 'occupied'
                      ? "bg-amber-50 border-amber-200"
                      : "bg-slate-50 border-slate-200 hover:border-emerald-500"
                  )}
                >
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(table)}
                      className="p-1.5 bg-white text-slate-500 rounded-lg shadow-sm hover:bg-slate-50 border border-slate-100"
                      title="Edit Table"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(table.id)}
                      className="p-1.5 bg-white text-red-500 rounded-lg shadow-sm border border-red-50 hover:bg-red-50"
                      title="Delete Table"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-2",
                    table.status === 'occupied' ? "bg-amber-100 text-amber-600" : "bg-white text-slate-400 shadow-sm"
                  )}>
                    <Users size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900">{table.name}</h3>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
                      {table.capacity} Seats
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      table.status === 'occupied' ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {table.status}
                    </span>
                  </div>

                  {table.active_order_id && (
                    <div className="mt-2 w-full flex gap-1">
                      <button
                        onClick={() => handlePrintSummary(table.active_order_id!)}
                        className="flex-1 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                        title="Print Summary"
                      >
                        <Printer size={12} /> Summary
                      </button>
                      <button
                        onClick={() => handleBillOut(table.active_order_id!)}
                        className="flex-1 py-1.5 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Receipt size={12} /> Bill Out
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {tables.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400">
                  No tables found for this branch. Add one to get started.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
              `}
            </style>

            {(() => {
              const rawSubtotal = receiptData.items?.reduce((sum: number, item: any) => sum + (item.is_complimentary ? 0 : ((item.price || 0) * (item.quantity || 1))), 0) || 0;
              const displaySubtotal = rawSubtotal > 0 ? rawSubtotal : (receiptData.subtotal || 0);
              const calcTotal = Math.max(0, displaySubtotal - (receiptData.discount_amount || 0));

              return (
                <div className="relative print:relative receipt-ticket-content">
                  {/* Company Details */}
                  <div className="text-center section-block">
                    <div className="flex justify-center mb-1 text-center">
                      <img src={ESPRESSO_RECEIPT_LOGO} alt="Espresso Yourself & Tea House" className="receipt-logo" />
                    </div>
                    <p className="company-name font-bold">{settings?.company_name || 'ESPRESSO YOURSELF & TEA HOUSE'}</p>
                    <p>{settings?.address || 'Room 1 Crown Bldg., North Road 6, Mabolo, Cebu City'}</p>
                  </div>

                  {/* Receipt Header Title & Metadata */}
                  <div className="text-center section-block pt-1">
                    <p className="receipt-title font-bold text-[11pt]">ORDER SUMMARY</p>
                    <p className="print-bold-text font-bold">***** PRE-BILL *****</p>
                  </div>

                  <div className="section-block pt-1">
                    <div className="flex justify-between row-item">
                      <span>Invoice: {receiptData.receipt_number !== undefined && receiptData.receipt_number !== null ? `INV-${receiptData.receipt_number.toString().padStart(6, '0')}` : 'PENDING'}</span>
                    </div>
                    <div className="flex justify-between row-item">
                      <span>{receiptData.updated_at ? new Date(receiptData.updated_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }).replace(',', '') : new Date().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between row-item">
                      <span>Order: #{(receiptData.order_number || receiptData.id).toString().padStart(6, '0')}</span>
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
                      <span>₱{calcTotal.toFixed(2)}</span>
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
                      {activeBranch?.is_bir_compliant
                        ? "This document is not valid for claim of input tax."
                        : "THIS IS NOT AN OFFICIAL RECEIPT"}
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
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
              >
                <Printer size={16} /> Print Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
