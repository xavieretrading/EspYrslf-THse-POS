import React, { useEffect, useState } from 'react';
import {
  Scissors,
  User,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Printer,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Search,
  Building2,
  Clock,
  ChevronRight,
  RefreshCw,
  Tag
} from 'lucide-react';
import { cn } from '../../App';
import { swalAlert } from '../../lib/swal';

type Product = {
  id: number;
  name: string;
  price: number;
  category_name?: string;
  category_id?: number;
  stock?: number;
  image_url?: string;
};

type CartItem = {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  barber_name?: string;
  chair_number?: string;
  notes?: string;
};

interface BarbershopViewProps {
  activeBranch: any;
  currentUser: any;
  settings?: any;
}

export default function BarbershopView({ activeBranch, currentUser, settings }: BarbershopViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Barbershop Service Ticket Metadata
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [assignedBarber, setAssignedBarber] = useState<string>('Master Barber Jay');
  const [chairNumber, setChairNumber] = useState<string>('Chair 1');
  const [selectedDiscount, setSelectedDiscount] = useState<number>(0);
  const [discountName, setDiscountName] = useState<string>('');

  // Payment Modal & Receipt State
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'card'>('cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  const barbersList = [
    'Master Barber Jay',
    'Barber Alex',
    'Stylist Sarah',
    'Barber Mark',
    'Senior Stylist Dave',
    'Any Available Barber'
  ];

  const chairsList = [
    'Chair 1',
    'Chair 2',
    'Chair 3',
    'Chair 4',
    'VIP Grooming Suite'
  ];

  // Fetch products and categories for this branch
  const fetchBarbershopData = async () => {
    if (!activeBranch) return;
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/inventory?branch_id=${activeBranch.id}`),
        fetch(`/api/categories?branch_id=${activeBranch.id}`)
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();

      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error('Error fetching barbershop data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbershopData();
  }, [activeBranch]);

  // Cart helper functions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product_id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: 1,
          barber_name: assignedBarber,
          chair_number: chairNumber,
          notes: ''
        }
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (productId: number) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateItemNotes = (productId: number, notes: string) => {
    setCart(prev =>
      prev.map(item => (item.product_id === productId ? { ...item, notes } : item))
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * selectedDiscount) / 100;
  const netTotal = Math.max(0, subtotal - discountAmount);

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesCategory =
      selectedCategory === 'all' ||
      p.category_name?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle Checkout Submission
  const handleProcessPayment = async () => {
    if (cart.length === 0) {
      swalAlert('Empty Ticket', 'Please add at least one barbershop service or product.', 'warning');
      return;
    }

    const tenderedNum = parseFloat(amountTendered) || netTotal;
    if (paymentMethod === 'cash' && tenderedNum < netTotal) {
      swalAlert('Insufficient Amount', `Tendered amount ₱${tenderedNum.toFixed(2)} is less than total ₱${netTotal.toFixed(2)}`, 'warning');
      return;
    }

    const change = Math.max(0, tenderedNum - netTotal);

    const orderPayload = {
      branch_id: activeBranch.id,
      order_type: 'walk-in',
      payment_method: paymentMethod.toUpperCase(),
      customer_name: customerName.trim() || 'Walk-In Client',
      phone: customerPhone.trim() || '',
      subtotal,
      discount_amount: discountAmount,
      discount_name: discountName || (selectedDiscount ? `${selectedDiscount}% Off` : ''),
      total: netTotal,
      amount_tendered: tenderedNum,
      change,
      notes: JSON.stringify({
        is_barbershop: true,
        barber_name: assignedBarber,
        chair_number: chairNumber,
        customer_name: customerName.trim() || 'Walk-In Client',
        phone: customerPhone.trim() || ''
      }),
      items: cart.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes || `[Stylist: ${item.barber_name || assignedBarber}] [Chair: ${item.chair_number || chairNumber}]`
      }))
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();

      if (data.id) {
        setReceiptData({
          id: data.id,
          receipt_number: data.receipt_number || data.id,
          created_at: new Date().toISOString(),
          cashier_name: currentUser?.full_name || currentUser?.username || 'Staff',
          customer_name: customerName.trim() || 'Walk-In Client',
          phone: customerPhone.trim(),
          barber_name: assignedBarber,
          chair_number: chairNumber,
          items: cart,
          subtotal,
          discount_amount: discountAmount,
          total: netTotal,
          amount_tendered: tenderedNum,
          change,
          payment_method: paymentMethod.toUpperCase()
        });

        setIsPaymentOpen(false);
        setIsPrinting(true);
        swalAlert('Ticket Completed', `Order #${data.id} created successfully!`, 'success');
      } else {
        swalAlert('Error', data.error || 'Failed to complete transaction.', 'error');
      }
    } catch (err: any) {
      swalAlert('Error', err.message || 'Server error during payment processing.', 'error');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleResetTicket = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedDiscount(0);
    setDiscountName('');
    setAmountTendered('');
    setReceiptData(null);
    setIsPrinting(false);
  };

  return (
    <div className="h-full w-full flex flex-col font-sans bg-slate-100 overflow-hidden">
      {/* Barbershop Top Header Banner */}
      <div className="bg-slate-900 text-white p-3.5 px-6 flex flex-wrap items-center justify-between gap-4 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
            <Scissors size={22} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight uppercase flex items-center gap-2">
              Slick & Dapper Salon and Barbershop
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-500/30 uppercase tracking-widest font-black">
                {activeBranch?.name || 'Cebu Branch'}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Premium Grooming, Haircut & Salon POS Module</p>
          </div>
        </div>

        {/* Quick Controls: Barber & Chair Assignment */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 px-3 rounded-xl border border-slate-700">
            <User size={14} className="text-amber-400 shrink-0" />
            <span className="text-[10px] font-black uppercase text-slate-400">Stylist/Barber:</span>
            <select
              value={assignedBarber}
              onChange={e => setAssignedBarber(e.target.value)}
              className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-lg outline-none cursor-pointer border border-slate-700"
            >
              {barbersList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 p-1.5 px-3 rounded-xl border border-slate-700">
            <Sparkles size={14} className="text-emerald-400 shrink-0" />
            <span className="text-[10px] font-black uppercase text-slate-400">Station/Chair:</span>
            <select
              value={chairNumber}
              onChange={e => setChairNumber(e.target.value)}
              className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-lg outline-none cursor-pointer border border-slate-700"
            >
              {chairsList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
        
        {/* Left Side: Services & Products Grid (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs min-h-0 overflow-hidden">
          
          {/* Search & Categories Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search haircut, service, or pomade..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-amber-500"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar max-w-full pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
                  selectedCategory === 'all'
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                All Services
              </button>

              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
                    selectedCategory.toLowerCase() === cat.name.toLowerCase()
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold gap-2">
                <RefreshCw size={18} className="animate-spin" />
                Loading Barbershop Services...
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {filteredProducts.map(product => {
                  const inCartCount = cart.find(i => i.product_id === product.id)?.quantity || 0;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addToCart(product)}
                      className={cn(
                        "relative p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-[0.97] group cursor-pointer shadow-2xs hover:shadow-md",
                        inCartCount > 0
                          ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {inCartCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                          {inCartCount}
                        </span>
                      )}

                      <div className="mb-3">
                        <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-100/80 px-2 py-0.5 rounded-md inline-block mb-1.5">
                          {product.category_name || 'Grooming'}
                        </span>
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2">
                          {product.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-2">
                        <span className="font-black text-sm text-slate-900">₱{product.price.toFixed(2)}</span>
                        <span className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                          <Plus size={14} />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
                <Scissors size={32} className="mb-2 text-slate-300" />
                <p className="font-bold text-sm text-slate-700">No Barbershop Services Found</p>
                <p className="text-xs text-slate-400">Try adjusting search or selecting another category.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Service Ticket & Cart (4 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs min-h-0 overflow-hidden">
          
          {/* Ticket Header & Client Details */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <ShoppingBag size={16} className="text-amber-500" />
                Grooming Ticket & Cart
              </h2>
              <span className="text-[10px] font-black uppercase bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
                {cart.length} Items
              </span>
            </div>

            {/* Client Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Client Name (e.g. John Doe)"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-amber-500"
              />
              <input
                type="text"
                placeholder="Mobile #"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
            {cart.map(item => (
              <div key={item.product_id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{item.product_name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      ₱{item.price.toFixed(2)} each
                    </p>
                  </div>
                  <span className="font-black text-xs text-slate-900 shrink-0">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>

                {/* Optional Sticky Note per Item */}
                <input
                  type="text"
                  placeholder="Special instructions (e.g. skin fade)..."
                  value={item.notes || ''}
                  onChange={e => updateItemNotes(item.product_id, e.target.value)}
                  className="w-full bg-white border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-700 outline-none focus:border-amber-400"
                />

                {/* Quantity Controls & Remove */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => removeItem(item.product_id)}
                    className="text-rose-500 hover:text-rose-700 transition-colors p-1"
                    title="Remove Service"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="text-slate-600 hover:text-slate-900 font-bold p-0.5"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-black text-slate-900 w-5 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="text-slate-600 hover:text-slate-900 font-bold p-0.5"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
                <ShoppingBag size={32} className="mb-2 text-slate-300" />
                <p className="font-bold text-xs text-slate-700">Ticket is Empty</p>
                <p className="text-[11px] text-slate-400">Click services on the left to add to grooming ticket.</p>
              </div>
            )}
          </div>

          {/* Ticket Totals & Checkout Actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/70 shrink-0 space-y-3">
            {/* Quick Discount Selector */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-slate-600 uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Tag size={12} /> Discount:
              </span>
              <div className="flex items-center gap-1">
                {[0, 5, 10, 20].map(disc => (
                  <button
                    key={disc}
                    type="button"
                    onClick={() => {
                      setSelectedDiscount(disc);
                      setDiscountName(disc ? `${disc}% Promo` : '');
                    }}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-black rounded-lg border transition-all",
                      selectedDiscount === disc
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {disc === 0 ? 'None' : `${disc}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="space-y-1.5 text-xs border-t border-slate-200 pt-2.5">
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Discount</span>
                  <span>-₱{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-black text-base pt-1 border-t border-slate-200">
                <span>Total Due</span>
                <span>₱{netTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetTicket}
                disabled={cart.length === 0}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors disabled:opacity-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsPaymentOpen(true)}
                disabled={cart.length === 0}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CreditCard size={16} />
                Checkout & Pay (₱{netTotal.toFixed(2)})
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          PAYMENT MODAL
      ───────────────────────────────────────────────────────────────────────────── */}
      {isPaymentOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base uppercase tracking-wider">Checkout Barbershop Ticket</h3>
                <p className="text-xs text-slate-500 font-semibold">{customerName || 'Walk-In Client'} • {assignedBarber}</p>
              </div>
              <button onClick={() => setIsPaymentOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'gcash', 'card'] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={cn(
                    "py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all",
                    paymentMethod === method
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* Amount Tendered Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Amount Tendered (₱)</label>
              <input
                type="number"
                placeholder={netTotal.toFixed(2)}
                value={amountTendered}
                onChange={e => setAmountTendered(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-base font-black text-slate-900 outline-none focus:border-amber-500"
              />
            </div>

            {/* Change display */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center text-xs font-bold text-emerald-900">
              <span>Change to Return:</span>
              <span className="text-base font-black">
                ₱{Math.max(0, (parseFloat(amountTendered) || netTotal) - netTotal).toFixed(2)}
              </span>
            </div>

            {/* Complete Transaction */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          PRINT RECEIPT MODAL
      ───────────────────────────────────────────────────────────────────────────── */}
      {isPrinting && receiptData && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <h2 className="font-black text-sm uppercase tracking-wider text-slate-900">SLICK & DAPPER SALON & BARBERSHOP</h2>
              <p className="text-[11px] font-bold text-slate-600">{activeBranch?.name || 'CEBU BRANCH'}</p>
              <p className="text-[10px] text-slate-500">{activeBranch?.address || 'Cebu City'}</p>
            </div>

            <div className="text-[11px] space-y-1 font-mono text-slate-700 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">#{receiptData.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Client:</span>
                <span className="font-bold">{receiptData.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Stylist:</span>
                <span className="font-bold">{receiptData.barber_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Chair:</span>
                <span className="font-bold">{receiptData.chair_number}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Date:</span>
                <span>{new Date(receiptData.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Itemized List */}
            <div className="space-y-1 text-xs font-mono border-b border-dashed border-slate-300 pb-3">
              {receiptData.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span className="truncate max-w-[180px]">{item.quantity}x {item.product_name}</span>
                  <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-xs font-mono pt-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₱{receiptData.subtotal.toFixed(2)}</span>
              </div>
              {receiptData.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-₱{receiptData.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 border-t border-slate-300 pt-1">
                <span>TOTAL:</span>
                <span>₱{receiptData.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                <span>Tendered ({receiptData.payment_method}):</span>
                <span>₱{receiptData.amount_tendered.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Change:</span>
                <span>₱{receiptData.change.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 print:hidden">
              <button
                type="button"
                onClick={handleResetTicket}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
              >
                Close Ticket
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer size={14} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
