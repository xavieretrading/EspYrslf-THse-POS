import React, { useState, useEffect } from 'react';
import { Search, Ticket, Check, X, Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../BranchContext';
import { useSettings } from '../SettingsContext';
import { cn } from '../App';
import { logActivity } from '../lib/audit';
import { swalAlert } from '../lib/swal';

type VoucherItem = {
  id: number;
  product_id: number;
  points_required: number;
  new_price: number;
  products?: {
    name: string;
    price: number;
    category_id: number;
    category_name?: string;
    branch_id: number;
  }
};

export default function Redemption() {
  const { activeBranch } = useBranch();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [voucherItems, setVoucherItems] = useState<VoucherItem[]>([]);
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedVouchers, setSelectedVouchers] = useState<(VoucherItem & { cartId: string })[]>([]);
  const [redeemReference, setRedeemReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    if (!activeBranch) return;

    const fetchData = async () => {
      try {
        const [viRes, catRes] = await Promise.all([
          fetch('/api/voucher-items'),
          fetch('/api/categories')
        ]);

        const viData = await viRes.json();
        const cats = await catRes.json();

        const voucherArray = Array.isArray(viData) ? viData : [];
        const branchVouchers = voucherArray.filter((v: any) => v.products?.branch_id === activeBranch.id);

        setVoucherItems(branchVouchers);

        // Filter categories based on available voucher items
        const activeCategoryIds = new Set(branchVouchers.map(v => v.products?.category_id));
        const filteredCats = (cats || []).filter((c: any) => activeCategoryIds.has(c.id));
        setCategories(filteredCats);

      } catch (err) {
        console.error('Failed to fetch redemption data:', err);
      }
    };

    fetchData();
  }, [activeBranch]);

  const filteredVouchers = voucherItems.filter(v => {
    const matchesCategory = selectedCategory === 'All' || v.products?.category_name === selectedCategory;
    const matchesSearch = v.products?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: VoucherItem) => {
    setSelectedVouchers(prev => [...prev, { ...item, cartId: Math.random().toString(36).substring(2, 11) }]);
  };

  const removeFromCart = (cartId: string) => {
    setSelectedVouchers(prev => prev.filter(v => v.cartId !== cartId));
  };

  const handleRedeem = async () => {
    if (isProcessing) return;
    if (selectedVouchers.length === 0) {
      swalAlert('No Items Selected', 'Please select items to redeem', 'warning');
      return;
    }
    if (!redeemReference) {
      swalAlert('Missing Reference', 'Please enter Reference Number', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      // Group items by product_id to sum quantities
      const groupedItemsMap = selectedVouchers.reduce((acc, v) => {
        if (!acc[v.product_id]) {
          acc[v.product_id] = {
            product_id: v.product_id,
            points_used: v.points_required,
            new_price: v.new_price,
            quantity: 0
          };
        }
        acc[v.product_id].quantity += 1;
        return acc;
      }, {} as Record<number, any>);

      const items = Object.values(groupedItemsMap);

      const res = await fetch('/api/voucher-redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: activeBranch?.id,
          order_id: null,
          items: items,
          reference_number: redeemReference
        })
      });

      if (res.ok) {
        const data = await res.json();
        swalAlert('Success', `Successfully redeemed ${selectedVouchers.length} items!`, 'success');

        const localUser = localStorage.getItem('resto_active_user');
        const activeUser = localUser ? JSON.parse(localUser) : null;
        logActivity(
          activeUser?.full_name || activeUser?.username || 'Unknown',
          'Voucher Redemption',
          `Redeemed ${selectedVouchers.length} items using points. Ref# ${redeemReference}`
        );

        if (data.receipt) {
          setReceiptData({ ...data.receipt, cashier_name: activeUser?.full_name || activeUser?.username || 'Unknown' });
        } else {
          // Reset if no receipt
          setSelectedVouchers([]);
          setRedeemReference('');
        }
      } else {
        const errorData = await res.json();
        swalAlert('Redemption Failed', errorData.error || 'Unknown error', 'error');
      }
    } catch (error) {
      swalAlert('Redemption Failed', 'Please check your connection.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
    setReceiptData(null);
    setSelectedVouchers([]);
    setRedeemReference('');
  };

  const totalPoints = selectedVouchers.reduce((sum, v) => sum + v.points_required, 0);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="flex-1 flex flex-col h-full border-r border-slate-200 min-w-0">
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="text-emerald-600" />
              Voucher Redemption
            </h1>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none text-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="p-3 flex gap-2 overflow-x-auto bg-white border-b border-slate-100 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={cn(
              "px-6 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all border",
              selectedCategory === 'All'
                ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            All Items
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.name)}
              className={cn(
                "px-6 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all border",
                selectedCategory === c.name
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Redemption Grid */}
        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredVouchers.map(item => {
              const isSelected = selectedVouchers.some(v => v.id === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all text-left flex flex-col min-h-[160px] relative group",
                    isSelected
                      ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
                      : "bg-white border-slate-200 hover:border-emerald-500 hover:shadow-lg"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      {item.products?.category_name}
                    </span>
                    {isSelected && (
                      <div className="bg-emerald-500 text-white p-1 rounded-full">
                        <Check size={12} />
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 leading-tight mb-auto group-hover:text-emerald-700">
                    {item.products?.name}
                  </h3>

                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-slate-900">{item.points_required} PTS</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Points Required</span>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredVouchers.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                <Ticket size={48} className="mb-4 opacity-10" />
                <p className="font-medium">No voucher items found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar - Summary */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-2xl">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Check className="text-emerald-600" />
            Redemption Summary
          </h2>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {selectedVouchers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm text-center">
              <Ticket size={48} className="mb-4 opacity-5 not-italic" />
              <p>Select items from the left to start redemption</p>
            </div>
          ) : (
            selectedVouchers.map((item, idx) => (
              <div key={item.cartId || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group relative">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.products?.name}</h4>
                  <p className="text-emerald-600 font-black text-sm">{item.points_required} PTS</p>
                </div>
                <button
                  onClick={() => removeFromCart(item.cartId || '')}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Total Items</span>
              <span className="font-bold">{selectedVouchers.length}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-slate-900">Total Points</span>
              <span className="font-black text-emerald-600">{totalPoints} PTS</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Reference Number</label>
              <input
                type="text"
                placeholder="Enter ref #"
                value={redeemReference}
                onChange={e => setRedeemReference(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-bold text-lg text-slate-700"
              />
            </div>

            <button
              onClick={handleRedeem}
              disabled={isProcessing || selectedVouchers.length === 0}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-[0.98]",
                isProcessing || selectedVouchers.length === 0
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30"
              )}
            >
              {isProcessing ? 'PROCESSING...' : 'CONFIRM REDEMPTION'}
            </button>
          </div>
        </div>
      </div>

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
                  line-height: 1.0 !important; 
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
                .printable-area .print-total {
                  font-size: 11.5pt !important;
                  font-weight: 700 !important;
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
                .printable-area { 
                  padding: 6px !important; 
                }
                .printable-area * {
                  font-size: 9.5pt !important;
                  line-height: 1.0 !important;
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
                .printable-area .print-total {
                  font-size: 11.5pt !important;
                  font-weight: 700 !important;
                }
                .printable-area .font-bold,
                .printable-area .font-black,
                .printable-area .font-semibold,
                .printable-area .print-bold-text {
                  font-weight: 700 !important;
                }
              `}
            </style>



            <div className="relative print:relative">
              {/* Company Details */}
              <div className="text-center section-block">
                <div className="flex justify-center mb-1 text-center">
                  <img src="/logo.png" alt="Logo" className="receipt-logo" />
                </div>
                <p className="company-name">{settings?.company_name || 'ESPRESSO YOURSELF & TEA HOUSE'}</p>
                <p>{settings?.address || 'Room 1 Crown Bldg North road 6, North Reclamation Area Mabolo Cebu City'}</p>
                {/* <p>TIN: {settings?.tin || '899-352-898-00000'}</p> */}
              </div>

              {/* Receipt Header Title */}
              <div className="text-center section-block border-t border-dashed border-black pt-1.5">
                <p className="receipt-title">VOUCHER RECEIPT</p>
                <p className="print-bold-text">***** REDEMPTION *****</p>
              </div>

              {/* Date & Time displays */}
              <div className="section-block border-t border-dashed border-black pt-1.5">
                <div className="flex justify-between row-item">
                  <span>Date: {new Date(receiptData.created_at || receiptData.date).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila' })}</span>
                </div>
                <div className="flex justify-between row-item">
                  <span>TM# 0000</span>
                  <span>RED#{receiptData.id.toString().padStart(6, '0')}</span>
                </div>
                <div className="flex justify-between row-item">
                  <span>Cashier: {receiptData.cashier_name || 'Staff'}</span>
                </div>
              </div>

              {/* Receipt Items list */}
              <div className="section-block border-t border-dashed border-black pt-1.5">
                {receiptData.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between row-item">
                    <span className="flex flex-col max-w-[75%]">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="text-[8pt] font-bold uppercase text-slate-500">(Voucher Redemption)</span>
                    </span>
                    <span className="text-right">POINTS</span>
                  </div>
                ))}
              </div>

              {/* Calculations & Totals */}
              <div className="section-block border-t border-dashed border-black pt-1.5">
                <div className="flex justify-between print-total row-item">
                  <span>TOTAL POINTS</span>
                  <span>{(receiptData.total_points || totalPoints)} PTS</span>
                </div>
                {receiptData.reference_number && (
                  <div className="flex justify-between row-item italic text-[8.5pt]">
                    <span>Ref#</span>
                    <span>{receiptData.reference_number}</span>
                  </div>
                )}
              </div>

              {/* Customer details & signatures */}
              <div className="section-block border-t border-dashed border-black pt-1.5">
                <div className="flex justify-between row-item">
                  <span># CUSTOMER: 1</span>
                  <span>
                    {receiptData.items?.reduce((acc: number, item: any) => acc + item.quantity, 0)} item(s)
                  </span>
                </div>
                <div className="flex justify-between row-item">
                  <span>CASHIER: {receiptData.cashier_name || 'Staff'}</span>
                </div>

                <div className="text-center mt-2 border-t border-dashed border-black pt-1.5">
                  <p className="font-bold print-bold-text">Thank you for your visit!</p>
                  <p className="mt-1">This serves as your voucher claim receipt.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3 print:hidden">
              <button
                onClick={() => {
                  setReceiptData(null);
                  setSelectedVouchers([]);
                  setRedeemReference('');
                }}
                className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-3 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold transition-colors"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
