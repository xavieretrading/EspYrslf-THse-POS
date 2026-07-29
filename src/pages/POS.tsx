import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, User, Percent, ShoppingCart, Eye, ExternalLink, Maximize, Minimize, Smartphone, Ticket, X, Gift, Clock, Filter, Calendar as CalendarIcon, ArrowRightLeft, RefreshCw, Printer, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../App';
import { useBranch } from '../BranchContext';
import { useSettings } from '../SettingsContext';
import { logActivity } from '../lib/audit';
import { swalAlert, swalConfirm } from '../lib/swal';

const getProductImage = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes('espresso')) return 'https://images.unsplash.com/photo-1510707577719-094119f7c366?auto=format&fit=crop&w=300&q=80';
  if (normalized.includes('americano')) return 'https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=300&q=80';
  if (normalized.includes('latte') && normalized.includes('matcha')) return 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=300&q=80';
  if (normalized.includes('latte') && normalized.includes('iced')) return 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=300&q=80';
  if (normalized.includes('latte')) return 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=300&q=80';
  if (normalized.includes('cappuccino')) return 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=300&q=80';
  if (normalized.includes('macchiato')) return 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=300&q=80';
  if (normalized.includes('frappe') || normalized.includes('blend')) return 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=300&q=80';
  if (normalized.includes('peach') || normalized.includes('tea')) return 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=300&q=80';
  if (normalized.includes('earl grey') || normalized.includes('brew')) return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300&q=80';
  if (normalized.includes('croissant')) return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80';
  if (normalized.includes('cookie')) return 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=300&q=80';
  if (normalized.includes('cheesecake') || normalized.includes('cake')) return 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=300&q=80';
  return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80';
};

type Product = { id: number; name: string; price: number; category_name: string; stock: number };
type Table = { id: number; name: string; status: string };
type Discount = { id: number; name: string; type: string; value: number };
type CartItem = Product & {
  quantity: number;
  notes: string;
  _isSaved?: boolean;
  itemDiscount?: Discount | null;
  isComplimentary?: boolean;
  complimentaryDetails?: {
    recipient: string;
    authorizedBy: string;
    server: string;
    slipNumber?: string;
  } | null;
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
    items: receipt.items || receipt.order_items || [],
    isBirCompliant: true, // Assume strict calculation for historical/rendered receipts if item discounts are present
  });

  return {
    ...result,
    total: receipt.total || result.total
  };
}

export default function POS() {
  const { activeBranch } = useBranch();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout'>('dine-in');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [paxCount, setPaxCount] = useState<number>(1);
  const [discountPaxCount, setDiscountPaxCount] = useState<number>(1);
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'gcash' | 'maya' | 'voucher' | 'store_credit'>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [storeCreditQuery, setStoreCreditQuery] = useState('');
  const [storeCreditsList, setStoreCreditsList] = useState<any[]>([]);
  const [selectedStoreCredit, setSelectedStoreCredit] = useState<any>(null);
  const [showComputationDetails, setShowComputationDetails] = useState(false);
  const [expandedCartItemId, setExpandedCartItemId] = useState<string | number | null>(null);

  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [showComplimentaryModal, setShowComplimentaryModal] = useState(false);
  const [complimentaryItemIdx, setComplimentaryItemIdx] = useState<number | null>(null);
  const [compData, setCompData] = useState({ recipient: '', authorizedBy: '', server: '', slipNumber: '' });

  const [currentShift, setCurrentShift] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('resto_current_shift');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftAmount, setShiftAmount] = useState('');
  const [shiftAction, setShiftAction] = useState<'start' | 'end'>('start');
  const [isProcessingShift, setIsProcessingShift] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [terminals, setTerminals] = useState<any[]>([]);
  const [activeTerminal, setActiveTerminal] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const getManilaDate = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleSearchStoreCredit = async (val: string) => {
    setStoreCreditQuery(val);
    if (!val.trim()) {
      setStoreCreditsList([]);
      return;
    }
    try {
      const res = await fetch(`/api/store-credits/search?query=${encodeURIComponent(val)}&branch_id=${activeBranch?.id || 1}`);
      if (res.ok) {
        const data = await res.json();
        setStoreCreditsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkShift = async (uId: number, bId: number) => {
    try {
      const actualUId = uId || 1;
      const res = await fetch(`/api/shifts/current?user_id=${actualUId}&branch_id=${bId}`);
      if (res.ok) {
        const shift = await res.json();
        if (shift) {
          setCurrentShift(shift);
          localStorage.setItem('resto_current_shift', JSON.stringify(shift));
          setShowShiftModal(false);
        } else {
          setCurrentShift(null);
          localStorage.removeItem('resto_current_shift');
          setShiftAction('start');
          setShowShiftModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking shift:', error);
    }
  };

  const handleShiftAction = async () => {
    const finalAmount = shiftAmount || '0';
    if (isNaN(parseFloat(finalAmount))) {
      return swalAlert('Invalid Amount', 'Please enter a valid amount', 'error');
    }

    setIsProcessingShift(true);
    try {
      if (shiftAction === 'start') {
        const res = await fetch('/api/shifts/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser?.id || 1,
            branch_id: activeBranch.id,
            cash_in: finalAmount
          })
        });
        if (res.ok) {
          const shift = await res.json();
          setCurrentShift(shift);
          localStorage.setItem('resto_current_shift', JSON.stringify(shift));
          setShowShiftModal(false);
          setShiftAmount('');
          logActivity(currentUser.full_name || currentUser.username, 'Shift Started', `Shift started with cash amount: ₱${finalAmount}`);
        } else {
          const err = await res.json();
          swalAlert('Error Starting Shift', err.error || 'Unknown error', 'error');
        }
      } else {
        if (!currentShift || !currentShift.id) {
          swalAlert('No Active Shift', 'No active shift found to close. Please refresh or restart POS.', 'warning');
          setIsProcessingShift(false);
          return;
        }
        const res = await fetch('/api/shifts/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shift_id: currentShift.id,
            cash_out: finalAmount
          })
        });
        if (res.ok) {
          const finalShift = await res.json();
          logActivity(currentUser.full_name || currentUser.username, 'Shift Ended', `Shift ended with cash out amount: ₱${finalAmount}. Total Sales: ₱${finalShift.total_sales}`);
          setCurrentShift(null);
          localStorage.removeItem('resto_current_shift');
          setShiftAction('start');
          setShiftAmount('');
          setShowShiftModal(true);
          swalAlert('Shift Closed', `Shift closed successfully!\nTotal Sales: ₱${finalShift.total_sales.toFixed(2)}`, 'success');
        } else {
          const err = await res.json();
          swalAlert('Error Ending Shift', err.error || 'Unknown error', 'error');
        }
      }
    } catch (error) {
      swalAlert('Action Failed', 'Please check connection.', 'error');
    } finally {
      setIsProcessingShift(false);
    }
  };

  useEffect(() => {
    const localUser = localStorage.getItem('resto_active_user');
    if (localUser) {
      const u = JSON.parse(localUser);
      setCurrentUser(u);
      if (activeBranch) {
        checkShift(u.id, activeBranch.id);
      }
    }

    if (!activeBranch) return;
    Promise.all([
      fetch(`/api/products?branch_id=${activeBranch.id}`).then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
      fetch(`/api/tables?branch_id=${activeBranch.id}`).then(res => res.json()),
      fetch('/api/discounts').then(res => res.json()),
      fetch(`/api/terminals?branch_id=${activeBranch.id}`).then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
    ]).then(([p, c, t, d, terms, cats]) => {
      setProducts(p);

      // Filter categories to only those that have products in the current branch and unique by name
      const activeCategoryNames = new Set(p.map((prod: any) => prod.category_name).filter(Boolean));
      const filteredCategories = (cats || []).filter((cat: any, index: number, self: any[]) =>
        activeCategoryNames.has(cat.name) &&
        self.findIndex(t => t.name === cat.name) === index
      );
      setCategories(filteredCategories);
      setTables(t);
      setDiscounts(d);
      setTerminals(terms || []);

      const params = new URLSearchParams(location.search);
      const orderIdParam = params.get('order_id');
      const terminalIdParam = params.get('terminal_id');

      if (terms && terms.length > 0) {
        if (terminalIdParam) {
          const term = terms.find((tr: any) => tr.id.toString() === terminalIdParam);
          if (term) setActiveTerminal(term);
          else setActiveTerminal(terms[0]);
        } else {
          setActiveTerminal(terms[0]);
        }
      }

      if (orderIdParam) {
        fetch(`/api/orders/${orderIdParam}`).then(res => res.json()).then(order => {
          setActiveOrderId(order.id);
          setOrderType(order.table_id ? 'dine-in' : 'takeout');
          if (order.table_id) {
            const tb = t.find((tbl: any) => tbl.id === order.table_id);
            if (tb) setSelectedTable(tb);
          }
          setCart(order.items.map((item: any) => {
            let itemDiscount = null;
            if (item.notes && item.notes.includes('[DISCOUNT: ')) {
              const match = item.notes.match(/\[DISCOUNT: (.*?)\]/);
              if (match) {
                const discName = match[1];
                itemDiscount = d.find((disc: any) => disc.name === discName);
              }
            }
            return {
              ...item,
              _isSaved: true,
              itemDiscount,
              isComplimentary: item.is_complimentary,
              complimentaryDetails: item.is_complimentary ? {
                recipient: item.complimentary_recipient,
                authorizedBy: item.complimentary_authorized_by,
                server: item.complimentary_server,
                slipNumber: item.complimentary_slip_number || ''
              } : null
            };
          }));

          // Clean up URL so refresh doesn't trigger it again unnecessarily
          window.history.replaceState({}, '', window.location.pathname);
        });
      }
    });
  }, [activeBranch, location.search]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category_name === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    if (settings?.strict_item_locked) {
      if (product.stock <= 0) {
        swalAlert('Out of Stock', `Cannot add ${product.name} to cart because it is out of stock (Strict Stock Lock Enabled)`, 'error');
        return;
      }
      // Check total unsaved quantity of this item already in current cart
      const currentUnsaved = cart.find(item => item.id === product.id && !item._isSaved);
      const currentUnsavedQty = currentUnsaved ? currentUnsaved.quantity : 0;
      if (currentUnsavedQty + 1 > product.stock) {
        swalAlert('Insufficient Stock', `Cannot add more than the available stock (${product.stock} units left)`, 'error');
        return;
      }
    }

    setCart(prev => {
      // Find matching item that hasn't been saved yet
      const existingUnsavedIndex = prev.findIndex(item => item.id === product.id && !item._isSaved);
      if (existingUnsavedIndex >= 0) {
        const newCart = [...prev];
        newCart[existingUnsavedIndex].quantity += 1;
        return newCart;
      }
      return [...prev, { ...product, quantity: 1, notes: '', _isSaved: false }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    if (delta > 0 && settings?.strict_item_locked) {
      const prod = products.find(p => p.id === id);
      const currentItem = cart.find(item => item.id === id);
      if (prod && currentItem) {
        if (currentItem.quantity + delta > prod.stock) {
          swalAlert('Stock Limit Reached', `Cannot increase quantity. Only ${prod.stock} units are currently available inside the inventory.`, 'error');
          return;
        }
      }
    }

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const updateNotes = (id: number, notes: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
  };

  const removeItem = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateItemDiscount = (id: number, discount: Discount | null) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        // Pattern matches [DISCOUNT: Name]
        let cleanNotes = item.notes.replace(/\[DISCOUNT:.*?\]/g, '').trim();
        let newNotes = cleanNotes;
        if (discount) {
          const discTag = `[DISCOUNT: ${discount.name}]`;
          newNotes = cleanNotes ? `${cleanNotes} ${discTag}` : discTag;
        }
        return { ...item, itemDiscount: discount, notes: newNotes, isComplimentary: false, complimentaryDetails: null };
      }
      return item;
    }));
  };

  const setComplimentary = (idx: number) => {
    const localUser = localStorage.getItem('resto_active_user');
    const activeUser = localUser ? JSON.parse(localUser) : null;
    const userName = activeUser?.full_name || activeUser?.username || '';

    setComplimentaryItemIdx(idx);
    setCompData({ recipient: '', authorizedBy: '', server: userName, slipNumber: '' });
    setShowComplimentaryModal(true);
  };

  const handleSaveComplimentary = () => {
    if (complimentaryItemIdx === null) return;
    if (!compData.recipient || !compData.authorizedBy || !compData.server || !compData.slipNumber) {
      swalAlert('Missing Details', 'Please fill in all complimentary details', 'warning');
      return;
    }

    setCart(prev => prev.map((item, i) => {
      if (i === complimentaryItemIdx) {
        // Remove existing discount tags if any
        let cleanNotes = item.notes.replace(/\[DISCOUNT:.*?\]/g, '').trim();
        const compTag = `[COMPLIMENTARY]`;
        const newNotes = cleanNotes ? `${cleanNotes} ${compTag}` : compTag;

        return {
          ...item,
          isComplimentary: true,
          itemDiscount: null,
          notes: newNotes,
          complimentaryDetails: { ...compData }
        };
      }
      return item;
    }));

    setShowComplimentaryModal(false);
    setComplimentaryItemIdx(null);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.isComplimentary ? 0 : (item.price * item.quantity)), 0);

  const serviceChargePercentage = settings?.service_charge_percentage || 0;
  const serviceChargeBasis = settings?.service_charge_basis || 'vat_exclusive';

  const cartCalculations = computeOrderTotals({
    subtotal,
    paxCount,
    discountPaxCount,
    discountName: selectedDiscount?.name || null,
    discountType: selectedDiscount?.type || null,
    discountValue: selectedDiscount ? parseFloat(selectedDiscount.value as any) : 0,
    serviceChargePercentage,
    serviceChargeBasis,
    items: cart,
    isBirCompliant: activeBranch?.is_bir_compliant,
  });

  const vatableSales = cartCalculations.vatableSales;
  const vatExemptSales = cartCalculations.vatExemptSales;
  const vatReliefAmount = cartCalculations.vatRelief;
  const scDiscountAmount = cartCalculations.scDiscount;
  const discountAmount = cartCalculations.discountAmount;
  const vatAmount = cartCalculations.vatAmount;
  const serviceChargeAmount = cartCalculations.serviceChargeAmount;
  const total = cartCalculations.total;
  const change = parseFloat(amountTendered) - total;

  const handlePlaceOrder = async () => {
    if (isProcessingPayment) return;
    // We now allow dine-in without a table (e.g. for walk-in dine-in customers not assigned to a specific table)

    setIsProcessingPayment(true);
    try {
      // Get active user for logging
      const localUser = localStorage.getItem('resto_active_user');
      const activeUser = localUser ? JSON.parse(localUser) : null;
      const userName = activeUser?.full_name || activeUser?.username || 'Unknown';

      // Split into saved and new items using the computed items which have the discount math attached
      const allComputedItems = cartCalculations.computedItems || cart;
      const savedItems = allComputedItems.filter(c => c._isSaved);
      const newItems = allComputedItems.filter(c => !c._isSaved);

      if (activeOrderId) {
        if (newItems.length === 0) {
          swalAlert('No New Items', 'No new items to add.', 'warning');
          return;
        }

        // Append newly added items to existing order
        const res = await fetch(`/api/orders/${activeOrderId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: newItems.map(item => ({
              product_id: item.id,
              quantity: item.quantity,
              price: item.price,
              notes: (orderType === 'dine-in' && !selectedTable && !item.notes?.startsWith('[DINE-IN]')) ? `[DINE-IN] ${item.notes || ''}` : item.notes,
              is_complimentary: item.isComplimentary || false,
              discount_id: item.itemDiscount?.id || null,
              discount_amount: item.computedDiscountAmount || 0,
              is_vat_exempt: item.isVatExempt || false,
              complimentary_recipient: item.complimentaryDetails?.recipient || null,
              complimentary_authorized_by: item.complimentaryDetails?.authorizedBy || null,
              complimentary_server: item.complimentaryDetails?.server || null,
              complimentary_slip_number: item.complimentaryDetails?.slipNumber || null
            }))
          })
        });
        const data = await res.json();
        if (data.success) {
          logActivity(userName, 'Add Items to Order', `Added new items to Order #${activeOrderId}: ${newItems.map(i => `${i.quantity}x ${i.name}`).join(', ')}`);
          swalAlert('Success', 'New items sent to kitchen!', 'success');
          // Re-mark them as saved
          setCart(cart.map(c => ({ ...c, _isSaved: true })));
        } else {
          swalAlert('Failed to Add Items', data.error || 'Unknown error', 'error');
        }
      } else {
        if (cart.length === 0) {
          swalAlert('Empty Cart', 'Cart is empty', 'warning');
          return;
        }
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branch_id: activeBranch?.id,
            table_id: orderType === 'takeout' ? null : selectedTable?.id,
            order_type: orderType,
            items: allComputedItems.map(item => ({
              product_id: item.id,
              quantity: item.quantity,
              price: item.price,
              notes: (orderType === 'dine-in' && !selectedTable && !item.notes?.startsWith('[DINE-IN]')) ? `[DINE-IN] ${item.notes || ''}` : item.notes,
              is_complimentary: item.isComplimentary || false,
              discount_id: item.itemDiscount?.id || null,
              discount_amount: item.computedDiscountAmount || 0,
              is_vat_exempt: item.isVatExempt || false,
              complimentary_recipient: item.complimentaryDetails?.recipient || null,
              complimentary_authorized_by: item.complimentaryDetails?.authorizedBy || null,
              complimentary_server: item.complimentaryDetails?.server || null,
              complimentary_slip_number: item.complimentaryDetails?.slipNumber || null
            }))
          })
        });
        const data = await res.json();
        if (data.success) {
          logActivity(userName, 'Place Order', `Created new order #${data.id} on ${orderType === 'dine-in' ? (selectedTable?.name || 'Walk-In') : 'Takeaway'}`);
          setActiveOrderId(data.id);
          swalAlert('Success', 'Order sent to kitchen!', 'success');
          // Refresh tables
          fetch(`/api/tables?branch_id=${activeBranch?.id}`).then(res => res.json()).then(setTables);
          setCart(cart.map(c => ({ ...c, _isSaved: true })));
        } else {
          swalAlert('Order Failed', data.error || 'Unknown error', 'error');
        }
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const [receiptData, setReceiptData] = useState<any>(null);
  const [discountCustomerName, setDiscountCustomerName] = useState('');
  const [discountCustomerIdNo, setDiscountCustomerIdNo] = useState('');
  const [discountCustomerTin, setDiscountCustomerTin] = useState('');
  const [discountChildName, setDiscountChildName] = useState('');
  const [discountChildBirthdate, setDiscountChildBirthdate] = useState('');
  const [discountChildAge, setDiscountChildAge] = useState('');
  const [reprintOrder, setReprintOrder] = useState<any>(null);
  const [reprintType, setReprintType] = useState<'receipt' | 'voucher' | 'complimentary'>('receipt');
  const [showReprintModal, setShowReprintModal] = useState(false);
  const [activeCopyType, setActiveCopyType] = useState<'customer' | 'accounting' | 'store' | 'all'>('all');
  const [showZReading, setShowZReading] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersFilter, setOrdersFilter] = useState<'today' | 'week' | 'month'>('today');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<'all' | 'open' | 'paid'>('all');
  const [selectedModalOrder, setSelectedModalOrder] = useState<any>(null);
  const [zReadingData, setZReadingData] = useState<any>(null);

  // Voucher Redemption Modal states
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [voucherItemsByBranch, setVoucherItemsByBranch] = useState<any[]>([]);
  const [redemptionCategories, setRedemptionCategories] = useState<{ id: number, name: string }[]>([]);
  const [selectedRedeemCategory, setSelectedRedeemCategory] = useState<string>('All');
  const [redeemSearch, setRedeemSearch] = useState('');
  const [selectedRedeemVouchers, setSelectedRedeemVouchers] = useState<any[]>([]);
  const [redeemRef, setRedeemRef] = useState('');
  const [isProcessingRedeem, setIsProcessingRedeem] = useState(false);
  const [redemptionMode, setRedemptionMode] = useState<'voucher' | 'complimentary'>('voucher');
  const [compRecipient, setCompRecipient] = useState('');
  const [compAuthorizedBy, setCompAuthorizedBy] = useState('');
  const [compSlipNumber, setCompSlipNumber] = useState('');

  const handleOpenRedemptionModal = async () => {
    setShowRedemptionModal(true);
    if (!activeBranch) return;
    try {
      const [viRes, catRes] = await Promise.all([
        fetch('/api/voucher-items'),
        fetch('/api/categories')
      ]);
      const viData = await viRes.json();
      const cats = await catRes.json();

      const voucherArray = Array.isArray(viData) ? viData : [];
      const branchVouchers = voucherArray.filter((v: any) => v.products?.branch_id === activeBranch.id);

      setVoucherItemsByBranch(branchVouchers);

      const activeCategoryIds = new Set(branchVouchers.map((v: any) => v.products?.category_id));
      const filteredCats = (cats || []).filter((c: any) => activeCategoryIds.has(c.id));
      setRedemptionCategories(filteredCats);
    } catch (err) {
      console.error('Failed to fetch redemption data:', err);
    }
  };

  const addRedeemToCart = (item: any) => {
    setSelectedRedeemVouchers(prev => [...prev, { ...item, cartId: Math.random().toString(36).substring(2, 11) }]);
  };

  const removeRedeemFromCart = (cartId: string) => {
    setSelectedRedeemVouchers(prev => prev.filter(v => v.cartId !== cartId));
  };

  const handleRedeemFromModal = async () => {
    if (isProcessingRedeem) return;
    if (selectedRedeemVouchers.length === 0) {
      swalAlert('No Items Selected', 'Please select items to process', 'warning');
      return;
    }

    const localUser = localStorage.getItem('resto_active_user');
    const activeUser = localUser ? JSON.parse(localUser) : null;
    const activeUsername = activeUser?.full_name || activeUser?.username || 'Staff';

    if (redemptionMode === 'complimentary') {
      if (!compRecipient.trim()) {
        swalAlert('Missing Details', 'Please enter Intended Recipient (To Whom)', 'warning');
        return;
      }
      if (!compAuthorizedBy.trim()) {
        swalAlert('Missing Details', 'Please enter Authorized By', 'warning');
        return;
      }
      if (!compSlipNumber.trim()) {
        swalAlert('Missing Details', 'Please enter Reference / Slip Number', 'warning');
        return;
      }
    } else {
      if (!redeemRef.trim()) {
        swalAlert('Missing Details', 'Please enter Reference Number', 'warning');
        return;
      }
    }

    setIsProcessingRedeem(true);
    try {
      // Group items by product_id to sum quantities
      const groupedItemsMap = selectedRedeemVouchers.reduce((acc, v) => {
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

      const payload: any = {
        branch_id: activeBranch?.id,
        order_id: null,
        items: items,
        reference_number: redemptionMode === 'complimentary' ? compSlipNumber : redeemRef
      };

      if (redemptionMode === 'complimentary') {
        payload.is_complimentary = true;
        payload.complimentary_recipient = compRecipient;
        payload.complimentary_authorized_by = compAuthorizedBy;
        payload.complimentary_server = activeUsername;
        payload.complimentary_slip_number = compSlipNumber;
      }

      const res = await fetch('/api/voucher-redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (redemptionMode === 'complimentary') {
          swalAlert('Success', `Successfully processed ${selectedRedeemVouchers.length} complimentary items!`, 'success');

          logActivity(
            activeUsername,
            'Complimentary Claim',
            `Processed ${selectedRedeemVouchers.length} complimentary items. Recipient: ${compRecipient}, Auth: ${compAuthorizedBy}, Slip #: ${compSlipNumber}`
          );
        } else {
          swalAlert('Success', `Successfully redeemed ${selectedRedeemVouchers.length} items!`, 'success');

          logActivity(
            activeUsername,
            'Voucher Redemption',
            `Redeemed ${selectedRedeemVouchers.length} items using points. Ref# ${redeemRef}`
          );
        }

        if (data.receipt) {
          setReceiptData({
            ...data.receipt,
            printType: redemptionMode === 'complimentary' ? 'complimentary' : 'voucher',
            updated_at: data.receipt.updated_at || data.receipt.created_at || new Date().toISOString(),
            cashier_name: activeUsername
          });
        }

        // Reset and close modal
        setSelectedRedeemVouchers([]);
        setRedeemRef('');
        setCompRecipient('');
        setCompAuthorizedBy('');
        setCompSlipNumber('');
        setShowRedemptionModal(false);
      } else {
        const errorData = await res.json();
        swalAlert('Process Failed', errorData.error || 'Unknown error', 'error');
      }
    } catch (error) {
      swalAlert('Process Failed', 'Please check your connection.', 'error');
    } finally {
      setIsProcessingRedeem(false);
    }
  };

  useEffect(() => {
    if (showZReading && activeBranch) {
      const today = format(getManilaDate(), 'yyyy-MM-dd');
      fetch(`/api/reports/sales?branch_id=${activeBranch.id}&start_date=${today}&end_date=${today}`)
        .then(res => res.json())
        .then(data => setZReadingData(data));
    }
  }, [showZReading, activeBranch]);

  const handlePay = async () => {
    if (isProcessingPayment) return;
    if (!activeOrderId) {
      swalAlert('No Active Order', 'Please place the order first', 'warning');
      return;
    }
    if (parseFloat(amountTendered) < total || isNaN(parseFloat(amountTendered))) {
      swalAlert('Invalid Amount', 'Insufficient amount tendered', 'error');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const res = await fetch(`/api/orders/${activeOrderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discount_id: selectedDiscount?.id || null,
          discount_amount: discountAmount,
          tax_amount: vatAmount,
          service_charge: serviceChargeAmount,
          total: total,
          payment_method: paymentMethod,
          amount_tendered: parseFloat(amountTendered) || total,
          change: change,
          reference_number: referenceNumber,
          discount_customer_name: discountCustomerName || null,
          discount_customer_id_no: discountCustomerIdNo || null,
          discount_customer_tin: discountCustomerTin || null,
          discount_child_name: discountChildName || null,
          discount_child_birthdate: discountChildBirthdate || null,
          discount_child_age: discountChildAge || null
        })
      });

      if (res.ok) {
        const { receipt } = await res.json();

        if (activeOrderId) {
          localStorage.setItem(`order_pax_${activeOrderId}`, JSON.stringify({ paxCount, discountPaxCount }));
        }

        const localUser = localStorage.getItem('resto_active_user');
        const activeUser = localUser ? JSON.parse(localUser) : null;
        const cashierName = activeUser?.full_name || activeUser?.username || 'Unknown';

        setReceiptData({
          ...receipt,
          cashier_name: cashierName,
          paxCount: paxCount,
          discountPaxCount: discountPaxCount,
          discount_customer_name: discountCustomerName || null,
          discount_customer_id_no: discountCustomerIdNo || null,
          discount_customer_tin: discountCustomerTin || null,
          discount_child_name: discountChildName || null,
          discount_child_birthdate: discountChildBirthdate || null,
          discount_child_age: discountChildAge || null
        });

        logActivity(activeUser?.full_name || activeUser?.username || 'Unknown', 'Checkout', `Completed Payment for Order #${activeOrderId}. Total: ₱${total.toFixed(2)}`);

        // We clear the POS state but let the user view/print the modal
        setCart([]);
        setSelectedTable(null);
        setOrderType('dine-in');
        setSelectedDiscount(null);
        setPaxCount(1);
        setDiscountPaxCount(1);
        setAmountTendered('');
        setDiscountCustomerName('');
        setDiscountCustomerIdNo('');
        setDiscountCustomerTin('');
        setDiscountChildName('');
        setDiscountChildBirthdate('');
        setDiscountChildAge('');
        setActiveOrderId(null);
        fetch(`/api/tables?branch_id=${activeBranch?.id}`).then(res => res.json()).then(setTables);
      } else {
        let errMsg = 'Unknown error';
        try {
          const errorData = await res.json();
          errMsg = errorData.error || errMsg;
        } catch (e) {
          try {
            errMsg = await res.text();
          } catch (textErr) { }
        }
        swalAlert('Payment Failed', errMsg, 'error');
      }
    } catch (err: any) {
      console.error(err);
      swalAlert('Payment Error', err?.message || 'A network error occurred. Please try again.', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    if (showOrdersModal && activeBranch) {
      fetchOrdersHistory();
    }
  }, [showOrdersModal, ordersFilter, ordersStatusFilter, activeBranch]);

  const fetchOrdersHistory = async () => {
    if (!activeBranch) return;
    try {
      const res = await fetch(`/api/orders/history?branch_id=${activeBranch.id}&filter=${ordersFilter}`);
      if (res.ok) {
        let data = await res.json();
        if (ordersStatusFilter !== 'all') {
          data = data.filter((o: any) => o.status === ordersStatusFilter);
        }
        setOrders(data);
      }
    } catch (e) {
      console.error('Fetch orders history failed', e);
    }
  };

  const handleModalVoid = async (id: number) => {
    const isConfirm = await swalConfirm('Are you sure you want to VOID this order?');
    if (!isConfirm) return;
    const res = await fetch(`/api/orders/${id}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Voided from POS' })
    });
    if (res.ok) {
      logActivity(currentUser?.full_name || currentUser?.username || 'Unknown', 'Void Order', `Voided Order #${id}`);
      fetchOrdersHistory();
      setSelectedModalOrder(null);
    }
  };

  const loadOrderToPOS = async (order: any) => {
    if (cart.length > 0) {
      const isConfirm = await swalConfirm('Loading an order will replace your current cart. Continue?');
      if (!isConfirm) return;
    }

    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (res.ok) {
        const fullOrder = await res.json();
        setActiveOrderId(fullOrder.id);
        setOrderType(fullOrder.table_id ? 'dine-in' : 'takeout');

        // Find table
        if (fullOrder.table_id) {
          const tb = tables.find(t => t.id === fullOrder.table_id);
          if (tb) setSelectedTable(tb);
        } else {
          setSelectedTable(null);
        }

        setCart(fullOrder.items.map((item: any) => {
          let itemDiscount = null;
          if (item.notes && item.notes.includes('[DISCOUNT: ')) {
            const match = item.notes.match(/\[DISCOUNT: (.*?)\]/);
            if (match) {
              const discName = match[1];
              itemDiscount = discounts.find(d => d.name === discName);
            }
          }
          return {
            ...item,
            id: item.product_id, // Map product_id to id for POS cart consistency
            name: item.product_name,
            _isSaved: true,
            itemDiscount,
            isComplimentary: item.is_complimentary,
            complimentaryDetails: item.is_complimentary ? {
              recipient: item.complimentary_recipient,
              authorizedBy: item.complimentary_authorized_by,
              server: item.complimentary_server,
              slipNumber: item.complimentary_slip_number || ''
            } : null
          };
        }));

        setShowOrdersModal(false);
      }
    } catch (e) {
      swalAlert('Failed to Load Order', '', 'error');
    }
  };

  const handleReprintFromModal = (order: any, printType: 'receipt' | 'voucher' | 'complimentary') => {
    setReprintOrder(order);
    setReprintType(printType);
    setShowReprintModal(true);
  };

  const executeReprintFromModal = async (order: any, printType: 'receipt' | 'voucher' | 'complimentary', isReprintChoice: boolean) => {
    try {
      const [orderRes, voucherRes] = await Promise.all([
        fetch(`/api/orders/${order.id}`),
        fetch('/api/voucher-items')
      ]);

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        let voucherMap: Record<number, number> = {};

        if (voucherRes.ok) {
          try {
            const voucherItems = await voucherRes.json();
            voucherItems.forEach((vi: any) => {
              voucherMap[vi.product_id] = vi.points_required;
            });
          } catch (err) { }
        }

        const localUser = localStorage.getItem('resto_active_user');
        const activeUser = localUser ? JSON.parse(localUser) : null;
        const cashierName = activeUser?.full_name || activeUser?.username || 'Staff';

        setReceiptData({
          ...orderData,
          printType,
          branch_name: activeBranch?.name,
          branch_address: activeBranch?.address,
          items: orderData.items.map((i: any) => {
            const isVoucher = i.notes?.includes('Voucher') || i.notes?.includes('(Voucher)');
            return {
              ...i,
              name: i.product_name,
              is_complimentary: i.is_complimentary,
              complimentary_recipient: i.complimentary_recipient,
              complimentary_authorized_by: i.complimentary_authorized_by,
              complimentary_server: i.complimentary_server,
              points_used: isVoucher ? (voucherMap[i.product_id] || 0) : 0
            };
          }),
          cashier_name: cashierName,
          amount_tendered: orderData.amount_tendered || orderData.total,
          change: orderData.change || 0,
          is_reprint: isReprintChoice
        });
      } else {
        swalAlert('Reprint Failed', 'Failed to load order details for reprint.', 'error');
      }
    } catch (e) {
      console.error(e);
      swalAlert('Reprint Failed', 'Failed to reprint invoice.', 'error');
    }
  };

  const handlePrintReceipt = async () => {
    if (receiptData?.is_reprint) {
      try {
        await fetch(`/api/orders/${receiptData.id}/reprint`, { method: 'POST' });
      } catch (err) { }
    }
    window.print();
  };

  const popOut = () => {
    window.open(`/standalone-pos${activeTerminal ? `?terminal_id=${activeTerminal.id}` : ''}`, '_blank', 'width=1200,height=800');
  };

  const receiptCalculations = getReceiptCalculations(receiptData, settings);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      {/* Block POS access if no active shift */}
      {!currentShift && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-100/80 backdrop-blur-md p-6 text-center">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-100/50 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center mb-6 animate-pulse">
              <Clock size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">
              Shift is Closed
            </h2>
            <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
              To start taking orders and using the POS terminal, you must first open a new shift.
            </p>
            {currentUser?.role === 'waiter' ? (
              <div className="w-full p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl text-sm font-semibold">
                Please ask a Manager or Cashier to start a shift.
              </div>
            ) : (
              <button
                onClick={() => {
                  setShiftAction('start');
                  setShiftAmount('');
                  setShowShiftModal(true);
                }}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-emerald-200 uppercase tracking-wide"
              >
                Open Shift
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content - Menu */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-200 min-w-0 print:hidden">
        {/* Header */}
        <div className="px-3 py-1.5 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 flex-shrink-0 font-sans">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 pl-14">
            <h1 className="text-sm font-black text-slate-800 tracking-tight whitespace-nowrap mr-1.5">Espresso POS</h1>
            {terminals.length > 0 && (
              <select
                value={activeTerminal?.id || ''}
                onChange={(e) => {
                  const term = terminals.find(t => t.id.toString() === e.target.value);
                  if (term) {
                    setActiveTerminal(term);
                    navigate({ search: `?terminal_id=${term.id}` }, { replace: true });
                  }
                }}
                className="bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-lg px-1.5 py-1 outline-none text-xs min-h-[32px] cursor-pointer"
              >
                {terminals.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1">
              {window.location.pathname !== '/standalone-pos' && (
                <button onClick={popOut} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center min-w-[32px] min-h-[32px]" title="Open POS in new window">
                  <ExternalLink size={14} />
                </button>
              )}
              <button onClick={toggleFullscreen} className="hidden md:flex p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg items-center justify-center min-w-[32px] min-h-[32px]" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              </button>
            </div>
            <button
              onClick={handleOpenRedemptionModal}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap min-h-[32px]"
            >
              <Ticket size={14} />
              <span>REDEEM</span>
            </button>
            <button
              onClick={() => setShowOrdersModal(true)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap min-h-[32px]"
            >
              <Eye size={14} />
              <span>ORDERS</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {currentUser?.role !== 'waiter' && (
              <>
                <button
                  onClick={() => setShowZReading(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all min-h-[32px]"
                >
                  X/Z-Reading
                </button>
                <button
                  onClick={() => {
                    setShiftAction(currentShift ? 'end' : 'start');
                    setShiftAmount('');
                    setShowShiftModal(true);
                  }}
                  className={cn(
                    "px-2.5 py-1 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[32px]",
                    currentShift ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                  )}
                >
                  <Clock size={14} /> {currentShift ? 'END SHIFT' : 'START SHIFT'}
                </button>
              </>
            )}
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all outline-none text-xs min-h-[32px] font-sans"
              />
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="lg:hidden p-2.5 bg-emerald-100 text-emerald-600 rounded-lg relative min-h-[40px] min-w-[40px]"
            >
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="p-1.5 px-3 flex gap-1.5 overflow-x-auto bg-white border-b border-slate-100 no-scrollbar flex-shrink-0 font-sans">
          <button
            onClick={() => setSelectedCategory('All')}
            className={cn(
              "px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all min-h-[30px] border shadow-xs",
              selectedCategory === 'All'
                ? "bg-emerald-500 text-white border-emerald-600"
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
                "px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all min-h-[30px] border shadow-xs",
                selectedCategory === c.name
                  ? "bg-emerald-500 text-white border-emerald-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto p-3 md:p-6 custom-scrollbar bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {filteredProducts.map(product => {
              const isLocked = settings?.strict_item_locked && product.stock <= 0;
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={cn(
                    "bg-white rounded-2xl shadow-sm border transition-all text-left flex flex-col group relative active:scale-[0.97] overflow-hidden",
                    isLocked
                      ? "opacity-60 border-slate-200 bg-slate-50/50 hover:border-slate-200 hover:shadow-sm"
                      : "border-slate-200 hover:border-emerald-500 hover:shadow-lg"
                  )}
                >
                  {/* Product Image */}
                  <div className="w-full h-20 md:h-22 overflow-hidden bg-slate-100 relative">
                    <img
                      src={getProductImage(product.name)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Stock Badge Overlay */}
                    <div className="absolute top-1.5 left-1.5">
                      <span className={cn(
                        "px-1 py-0.2 rounded text-[7px] font-black uppercase shadow-xs border backdrop-blur-xs",
                        product.stock <= 0
                          ? "bg-rose-500 text-white border-rose-600"
                          : product.stock < 10
                            ? "bg-amber-400 text-slate-900 border-amber-500 font-extrabold"
                            : "bg-white/90 text-slate-600 border-slate-200"
                      )}>
                        {product.stock <= 0 ? 'Out' : `${product.stock} L`}
                      </span>
                    </div>

                    {!isLocked && (
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-emerald-500 text-white p-0.5 rounded">
                          <Plus size={12} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-tighter block opacity-80 leading-none mb-0.5">{product.category_name}</span>
                      <h3 className={cn(
                        "font-bold text-slate-900 leading-tight text-[11px] md:text-xs line-clamp-2",
                        isLocked ? "text-slate-500" : "group-hover:text-emerald-700"
                      )}>{product.name}</h3>
                    </div>
                    <div className="mt-1 pt-1 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-[10px] md:text-xs font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-md">₱{product.price.toFixed(2)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar - Cart & Payment */}
      <div className={cn(
        "fixed inset-0 lg:relative lg:flex lg:w-96 z-40 lg:z-10 transition-transform duration-300 lg:translate-x-0 print:hidden",
        isCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Mobile Backdrop */}
        <div
          className={cn("absolute inset-0 bg-black/40 lg:hidden transition-opacity", isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
          onClick={() => setIsCartOpen(false)}
        />

        <div className="absolute lg:relative right-0 top-0 bottom-0 w-full max-w-[400px] lg:max-w-none lg:w-full bg-white flex flex-col h-full shadow-2xl lg:shadow-none border-l border-slate-200 z-50">
          {/* Cart Header - Mobile */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden font-sans">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShoppingCart size={20} className="text-emerald-600" />
              Your Cart
            </h2>
            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* Order Type Toggle */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex gap-1.5 font-sans flex-shrink-0">
            <button
              onClick={() => setOrderType('dine-in')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all border flex items-center justify-center gap-1.5 min-h-[30px]",
                orderType === 'dine-in'
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              DINE-IN
            </button>
            <button
              onClick={() => {
                setOrderType('takeout');
                setSelectedTable(null);
              }}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all border flex items-center justify-center gap-1.5 min-h-[30px]",
                orderType === 'takeout'
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              TAKEAWAY
            </button>
          </div>

          {orderType === 'dine-in' && (
            <div className="bg-white border rounded-xl border-emerald-100 overflow-hidden flex-shrink-0">
              <div className="bg-emerald-50 px-3 py-1.5 border-b border-emerald-100 flex justify-between items-center">
                <label className="text-[9px] font-black text-emerald-700 uppercase tracking-widest block font-sans">Assign Table</label>
              </div>
              <div className="p-2 flex gap-1.5 overflow-x-auto no-scrollbar font-sans whitespace-nowrap min-h-[48px] items-center">
                <button
                  onClick={() => setSelectedTable(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center flex-shrink-0 min-h-[34px]",
                    orderType === 'dine-in' && selectedTable === null
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 active:scale-[0.95]"
                  )}
                >
                  WALK-IN
                </button>
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => {
                      if (table.status === 'occupied' && selectedTable?.id !== table.id) return;
                      setSelectedTable(table);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center flex-shrink-0 min-h-[34px] min-w-[50px]",
                      selectedTable?.id === table.id
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                        : table.status === 'occupied'
                          ? "bg-amber-50 text-amber-600 border-amber-200 cursor-not-allowed opacity-80"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-[0.95]"
                    )}
                    title={table.name}
                  >
                    {table.name.replace('Table ', 'T')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart size={48} className="mb-4 opacity-20" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map((item, idx) => {
                const isExpanded = expandedCartItemId === item.id;
                return (
                  <div
                    key={item._isSaved ? `saved-${item.id}-${idx}` : item.id}
                    className="flex flex-col gap-1 p-2 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all font-sans"
                  >
                    <div className="flex gap-2 items-center">
                      {/* Clickable Info Area */}
                      <button
                        onClick={() => !item._isSaved && setExpandedCartItemId(isExpanded ? null : item.id)}
                        className="flex-1 text-left flex flex-col min-w-0"
                        type="button"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-bold text-slate-800 text-xs truncate flex-1 leading-tight">{item.name}</h4>
                          {!item._isSaved && (
                            <span className="text-[8px] text-slate-400 font-normal shrink-0">
                              {isExpanded ? '▲ hide' : '▼ edit'}
                            </span>
                          )}
                        </div>
                        <p className="text-emerald-600 font-semibold text-xs font-mono mt-0.5 leading-none">
                          ₱{(item.price * item.quantity).toFixed(2)}
                          {item.quantity > 1 && (
                            <span className="text-[9px] text-slate-400 font-normal ml-1">
                              (₱{item.price.toFixed(2)} ea)
                            </span>
                          )}
                        </p>
                        {item._isSaved && <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wider mt-0.5 leading-none">Ordered</span>}
                      </button>

                      {/* Quantity Stepper */}
                      {!item._isSaved ? (
                        <div className="flex items-center gap-0.5 bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm shrink-0">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600 min-w-[20px] min-h-[20px] flex items-center justify-center"
                            type="button"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-4 text-center font-bold text-xs text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600 min-w-[20px] min-h-[20px] flex items-center justify-center"
                            type="button"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-slate-500 font-black text-[10px] px-1.5 shrink-0 select-none bg-slate-200/50 rounded py-0.5">{item.quantity}x</div>
                      )}

                      {/* Trash Button */}
                      {!item._isSaved && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 shrink-0 min-w-[24px] min-h-[24px] flex items-center justify-center"
                          type="button"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    {/* Expandable Options Area (Only for unsaved items) */}
                    {!item._isSaved && isExpanded && (
                      <div className="space-y-1.5 mt-1 pt-1.5 border-t border-slate-250/50">
                        <input
                          type="text"
                          placeholder="Add notes..."
                          value={item.notes}
                          onChange={(e) => updateNotes(item.id, e.target.value)}
                          className="w-full text-[10px] px-2 py-1 bg-white border border-slate-200 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none transition-all font-sans"
                        />
                        <div className="flex gap-2 items-center">
                          <div className="bg-white border border-slate-200 rounded p-1 text-slate-400">
                            <Percent size={10} />
                          </div>
                          <select
                            className="flex-1 text-[10px] bg-white border border-slate-200 rounded px-1.5 py-1 outline-none focus:border-emerald-500 font-medium font-sans"
                            disabled={item.isComplimentary}
                            value={item.itemDiscount?.id || ''}
                            onChange={(e) => {
                              const d = discounts.find(d => d.id === parseInt(e.target.value));
                              updateItemDiscount(item.id, d || null);
                            }}
                          >
                            <option value="">No Item Discount</option>
                            {discounts.map(d => (
                              <option key={d.id} value={d.id}>{d.name} ({d.value}%)</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Display applied labels */}
                    {item.itemDiscount && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded uppercase border border-emerald-100 leading-none">
                          Discount: {item.itemDiscount.name} (-{item.itemDiscount.value}%)
                        </span>
                      </div>
                    )}
                    {item.isComplimentary && (
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1 py-0.5 rounded uppercase border border-amber-100 w-fit leading-none">
                          COMPLIMENTARY: TO {item.complimentaryDetails?.recipient || '...'}
                        </span>
                        {item.complimentaryDetails?.slipNumber && (
                          <span className="text-[8px] text-amber-700/80 font-mono ml-0.5 leading-none">
                            Slip #: {item.complimentaryDetails.slipNumber}
                          </span>
                        )}
                      </div>
                    )}
                    {item._isSaved && item.notes && (
                      <p className="text-[9px] text-slate-500 italic ml-0.5">Notes: {item.notes}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Totals & Payment */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2.5 flex-shrink-0">
            {/* Discount Selection */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Discount</label>
              <select
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-emerald-500 font-sans"
                onChange={(e) => {
                  const d = discounts.find(d => d.id === parseInt(e.target.value));
                  setSelectedDiscount(d || null);
                  if (!d) {
                    setPaxCount(1);
                    setDiscountPaxCount(1);
                  }
                }}
                value={selectedDiscount?.id || ''}
              >
                <option value="">No Discount</option>
                {discounts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            {selectedDiscount && (
              selectedDiscount.name.toLowerCase().includes('senior') ||
              selectedDiscount.name.toLowerCase().includes('pwd') ||
              selectedDiscount.name.toLowerCase().includes('athlete') ||
              selectedDiscount.name.toLowerCase().includes('coach') ||
              selectedDiscount.name.toLowerCase().includes('solo') ||
              selectedDiscount.name.toLowerCase().includes('vat exempt') ||
              selectedDiscount.name.toLowerCase().includes('valor') ||
              selectedDiscount.name.toLowerCase().includes('medal')
            ) && (() => {
              const nameLower = selectedDiscount.name.toLowerCase();
              const discountLabel = nameLower.includes('senior') ? 'Senior Count' :
                nameLower.includes('pwd') ? 'PWD Count' :
                  nameLower.includes('athlete') || nameLower.includes('coach') ? 'Athlete/Coach Count' :
                    nameLower.includes('solo') ? 'Solo Parent Count' :
                      nameLower.includes('valor') || nameLower.includes('medal') ? 'Medal of Valor Count' : 'Discount Count';
              const isSolo = nameLower.includes('solo');

              return (
                <div className="bg-white p-3 rounded-xl border border-slate-200 transition-all animation-fade-in space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                        Total Customers
                      </label>
                      <input
                        id="totalPaxInput"
                        type="number"
                        min="1"
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-bold"
                        value={paxCount}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setPaxCount(val);
                          if (discountPaxCount > val) {
                            setDiscountPaxCount(val);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                        {discountLabel}
                      </label>
                      <input
                        id="discountPaxInput"
                        type="number"
                        min="1"
                        max={paxCount}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-bold text-emerald-600"
                        value={discountPaxCount}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(paxCount, parseInt(e.target.value) || 1));
                          setDiscountPaxCount(val);
                        }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                        Customer Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Required for BIR report"
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                        value={discountCustomerName}
                        onChange={(e) => setDiscountCustomerName(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                          Card / ID Number
                        </label>
                        <input
                          type="text"
                          placeholder="OSCA/PWD/Athlete/Solo/Valor ID"
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                          value={discountCustomerIdNo}
                          onChange={(e) => setDiscountCustomerIdNo(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                          Customer TIN (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 123-456-789"
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                          value={discountCustomerTin}
                          onChange={(e) => setDiscountCustomerTin(e.target.value)}
                        />
                      </div>
                    </div>

                    {isSolo && (
                      <div className="border-t border-slate-100 pt-2 space-y-2.5">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Solo Parent Child Information</p>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                            Child's Full Name
                          </label>
                          <input
                            type="text"
                            placeholder="Name of child (6 yrs & below)"
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                            value={discountChildName}
                            onChange={(e) => setDiscountChildName(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                              Child's Birthdate
                            </label>
                            <input
                              type="date"
                              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                              value={discountChildBirthdate}
                              onChange={(e) => {
                                const dateStr = e.target.value;
                                setDiscountChildBirthdate(dateStr);
                                if (!dateStr) {
                                  setDiscountChildAge('');
                                  return;
                                }
                                const birth = new Date(dateStr);
                                const today = new Date();
                                let age = today.getFullYear() - birth.getFullYear();
                                const m = today.getMonth() - birth.getMonth();
                                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                                  age--;
                                }
                                setDiscountChildAge(Math.max(0, age).toString());
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                              Child's Age
                            </label>
                            <input
                              type="number"
                              disabled
                              placeholder="Auto-calculated"
                              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-bold text-slate-700"
                              value={discountChildAge}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="space-y-3">
              {selectedDiscount && (
                selectedDiscount.name.toLowerCase().includes('senior') ||
                selectedDiscount.name.toLowerCase().includes('pwd') ||
                selectedDiscount.name.toLowerCase().includes('athlete') ||
                selectedDiscount.name.toLowerCase().includes('coach') ||
                selectedDiscount.name.toLowerCase().includes('solo') ||
                selectedDiscount.name.toLowerCase().includes('vat exempt')
              ) ? (
                <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shadow-xs relative">
                  <div className="flex justify-between text-slate-655">
                    <span className="font-medium text-slate-700">Menu Total (VAT Inclusive)</span>
                    <span className="font-bold text-slate-900">₱{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>VAT-Exclusive Sales</span>
                    <span>₱{((vatableSales || 0) + (vatExemptSales || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600 text-[11px] font-semibold">
                    <span>VAT Exemption</span>
                    <span>-₱{vatReliefAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      {selectedDiscount.name}
                      <span className="relative group cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="text-[10px]">ℹ️</span>
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 p-2 bg-slate-800 text-white text-[9px] leading-relaxed font-normal rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-20 duration-200">
                          Discount is computed from VAT-exclusive amount.
                        </span>
                      </span>
                    </span>
                    <span>-₱{scDiscountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-bold border-t border-slate-200/55 pt-1 text-[11px]">
                    <span>Net Food Amount</span>
                    <span>₱{cartCalculations.netFoodAmount.toFixed(2)}</span>
                  </div>
                  {serviceChargeAmount > 0 && (
                    <div className="flex justify-between text-slate-500 text-[11px] font-medium">
                      <span>Service Charge ({serviceChargePercentage}%)</span>
                      <span>₱{serviceChargeAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t-2 border-dashed border-slate-300">
                    <span className="text-slate-900">TOTAL</span>
                    <span className="text-blue-700 font-extrabold text-[20px]">₱{total.toFixed(2)}</span>
                  </div>

                  {/* View Computation Expandable */}
                  <div className="border-t border-slate-200/50 pt-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowComputationDetails(!showComputationDetails)}
                      className="w-full text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 select-none flex items-center justify-center gap-1 py-1.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all shadow-xs"
                    >
                      {showComputationDetails ? 'Close Computation Plan ▲' : 'View Computation Plan ▼'}
                    </button>
                    {showComputationDetails && (
                      <div className="mt-3 text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80 font-mono space-y-2.5 leading-relaxed animate-fade-in shadow-inner max-h-[180px] overflow-y-auto pr-1.5">
                        <p className="font-bold text-slate-800 border-b pb-1 text-xs">Senior/PWD Shared Computation Detail</p>

                        <div>
                          <p className="font-semibold text-slate-700">STEP 1: Determine Eligible Share</p>
                          <p className="pl-2">Eligible Share = Menu Total / Customers</p>
                          <p className="pl-2 text-slate-800">₱{subtotal.toFixed(2)} / {paxCount} = ₱{(subtotal / paxCount).toFixed(2)} per person</p>
                          <p className="pl-2">Senior/PWD Diners count: {discountPaxCount}</p>
                          <p className="pl-2 text-slate-800 font-medium">Eligible Portion: ₱{(subtotal / paxCount * discountPaxCount).toFixed(2)}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-700">STEP 2: Remove VAT First</p>
                          <p className="pl-2">VAT-Exclusive Amount = Eligible Portion / 1.12</p>
                          <p className="pl-2 text-slate-850">₱{(subtotal / paxCount * discountPaxCount).toFixed(2)} / 1.12 = ₱{vatExemptSales.toFixed(2)}</p>
                          <p className="pl-2 text-orange-600 font-medium">VAT Removed (VAT Exemption): -₱{vatReliefAmount.toFixed(2)}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-700">STEP 3: Apply 20% Discount</p>
                          <p className="pl-2">Senior Discount = VAT-Exclusive Amount × 20%</p>
                          <p className="pl-2 text-emerald-600 font-medium">₱{vatExemptSales.toFixed(2)} × 20% = -₱{scDiscountAmount.toFixed(2)}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-700">STEP 4: Non-Senior Portion</p>
                          <p className="pl-2">Non-Senior Gross Portion remaining: ₱{(subtotal - (subtotal / paxCount * discountPaxCount)).toFixed(2)}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-700">STEP 5: Service Charge</p>
                          <p className="pl-2">Basis: {serviceChargeBasis === 'vat_exclusive' ? 'VAT-Exclusive Sales' : 'Gross Sales'}</p>
                          <p className="pl-2 text-slate-800">SC (%): {serviceChargePercentage}%</p>
                          <p className="pl-2 text-slate-800 font-medium">SC Amount: ₱{serviceChargeAmount.toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/75 shadow-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Menu Total (VAT Inclusive)</span>
                    <span>₱{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Discount ({selectedDiscount?.name})</span>
                      <span>-₱{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>VAT (12%)</span>
                    <span>₱{vatAmount.toFixed(2)}</span>
                  </div>
                  {serviceChargeAmount > 0 && (
                    <div className="flex justify-between text-slate-500 font-semibold">
                      <span>Service Charge ({serviceChargePercentage}%)</span>
                      <span>₱{serviceChargeAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-200/60">
                    <span>Total</span>
                    <span className="text-blue-700 font-extrabold text-[20px]">₱{total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {activeOrderId ? (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                {cart.some(c => !c._isSaved) && (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessingPayment}
                    className={cn(
                      "w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all active:scale-[0.98] mb-2 shadow-lg shadow-indigo-500/30",
                      isProcessingPayment && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isProcessingPayment ? 'Processing...' : 'Send Additions to Kitchen'}
                  </button>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button
                      onClick={() => { setPaymentMethod('cash'); setReferenceNumber(''); setSelectedStoreCredit(null); }}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                        paymentMethod === 'cash' ? "bg-emerald-500 text-white border-emerald-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <Banknote size={18} />
                      <span className="text-[10px] font-bold mt-1">Cash</span>
                    </button>
                    <button
                      onClick={() => { setPaymentMethod('credit_card'); setSelectedStoreCredit(null); }}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                        paymentMethod === 'credit_card' ? "bg-emerald-500 text-white border-emerald-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <CreditCard size={18} />
                      <span className="text-[10px] font-bold mt-1">Card</span>
                    </button>
                    <button
                      onClick={() => { setPaymentMethod('gcash'); setSelectedStoreCredit(null); }}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                        paymentMethod === 'gcash' ? "bg-emerald-500 text-white border-emerald-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <Smartphone size={18} />
                      <span className="text-[10px] font-bold mt-1">GCash</span>
                    </button>
                    <button
                      onClick={() => { setPaymentMethod('maya'); setSelectedStoreCredit(null); }}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                        paymentMethod === 'maya' ? "bg-emerald-500 text-white border-emerald-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <Smartphone size={18} />
                      <span className="text-[10px] font-bold mt-1">Maya</span>
                    </button>
                    <button
                      onClick={() => { setPaymentMethod('voucher'); setSelectedStoreCredit(null); }}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                        paymentMethod === 'voucher' ? "bg-emerald-500 text-white border-emerald-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <Ticket size={18} />
                      <span className="text-[10px] font-bold mt-1">Voucher</span>
                    </button>
                    <button
                      onClick={() => { setPaymentMethod('store_credit'); setReferenceNumber(''); setSelectedStoreCredit(null); setStoreCreditQuery(''); }}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                        paymentMethod === 'store_credit' ? "bg-emerald-500 text-white border-emerald-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <ArrowRightLeft size={18} />
                      <span className="text-[10px] font-bold mt-1">Store Credit</span>
                    </button>
                  </div>

                  {paymentMethod === 'store_credit' ? (
                    <div className="mb-3 space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search Store Credit (Name or ID)..."
                          value={storeCreditQuery}
                          onChange={(e) => handleSearchStoreCredit(e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none font-bold text-sm"
                        />
                      </div>
                      {storeCreditsList.length > 0 && (
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-sm p-1.5 space-y-1">
                          {storeCreditsList.map((sc: any) => (
                            <button
                              key={sc.id}
                              type="button"
                              onClick={() => {
                                setSelectedStoreCredit(sc);
                                setReferenceNumber(sc.id.toString());
                                setAmountTendered(sc.amount.toString());
                                setStoreCreditsList([]);
                                setStoreCreditQuery(`${sc.issued_to} (₱${sc.amount.toFixed(2)})`);
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 rounded-lg flex justify-between font-bold"
                            >
                              <span>#{sc.id} - {sc.issued_to}</span>
                              <span className="text-emerald-600">₱{sc.amount.toFixed(2)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedStoreCredit && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex justify-between">
                          <span>Applied Store Credit: #{selectedStoreCredit.id} ({selectedStoreCredit.issued_to})</span>
                          <span>₱{selectedStoreCredit.amount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    paymentMethod !== 'cash' && (
                      <div className="mb-3">
                        <input
                          type="text"
                          placeholder={paymentMethod === 'voucher' ? "Voucher Reference #" : "Reference Number"}
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none font-bold text-sm"
                        />
                      </div>
                    )
                  )}
                </div>

                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="number"
                    placeholder="Amount Tendered"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none font-bold text-lg"
                  />
                </div>
                {change >= 0 && amountTendered && (
                  <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <span>Change</span>
                    <span>₱{change.toFixed(2)}</span>
                  </div>
                )}
                <button
                  onClick={handlePay}
                  disabled={isProcessingPayment || (currentUser?.role !== 'admin' && currentUser?.permissions?.can_pay !== 'true' && currentUser?.permissions?.can_pay !== true)}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98]",
                    (isProcessingPayment || (currentUser?.role !== 'admin' && currentUser?.permissions?.can_pay !== 'true' && currentUser?.permissions?.can_pay !== true))
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30"
                  )}
                >
                  {isProcessingPayment ? 'Processing Payment...' : (currentUser?.role !== 'admin' && currentUser?.permissions?.can_pay !== 'true' && currentUser?.permissions?.can_pay !== true) ? 'Payment Restricted' : 'Complete Payment'}
                </button>
              </div>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessingPayment || cart.length === 0}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98]",
                  (isProcessingPayment || cart.length === 0)
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                )}
              >
                {isProcessingPayment ? 'Placing Order...' : 'Place Order'}
              </button>
            )}
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

            {/* Copy Type Selector */}
            <div className="flex gap-1 mb-3 p-1 bg-slate-100 rounded-lg border border-slate-200 shadow-inner print:hidden">
              {(['all', 'customer', 'accounting', 'store'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setActiveCopyType(type)}
                  className={cn(
                    "flex-1 py-1 rounded-md text-[9px] font-black uppercase transition-all",
                    activeCopyType === type
                      ? "bg-white text-slate-800 shadow border border-slate-200/50"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {type === 'all' ? 'All Copies' : `${type}`}
                </button>
              ))}
            </div>

            {['customer', 'accounting', 'store'].filter(type => activeCopyType === 'all' || activeCopyType === type).map((type, index) => {
              const rawSubtotal = receiptData.items?.reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0;
              const isVoucherOrCompOrder = (receiptData.subtotal === 0 || !receiptData.subtotal) && rawSubtotal > 0 && (receiptData.payment_method?.toUpperCase() === 'COMPLIMENTARY' || receiptData.payment_method?.toUpperCase() === 'VOUCHER');
              const displaySubtotal = isVoucherOrCompOrder ? rawSubtotal : (receiptData.subtotal || 0);

              return (
                <div key={type} className={cn("relative print:relative", index > 0 && "border-t border-dashed border-black pt-4 mt-4")}>
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
                  <div className="text-center section-block pt-1">
                    <p className="receipt-title font-bold text-[11pt]">
                      {receiptData.status === 'open' ? 'ORDER SUMMARY' :
                        receiptData.status === 'voided' ? (activeBranch?.is_bir_compliant ? 'VOIDED SALES INVOICE' : 'VOIDED RECEIPT') :
                          receiptData.status === 'refunded' ? (activeBranch?.is_bir_compliant ? 'REFUNDED SALES INVOICE' : 'REFUNDED RECEIPT') :
                            (activeBranch?.is_bir_compliant ? 'SALES INVOICE' : 'RECEIPT')}
                    </p>
                    {receiptData.status !== 'open' && (receiptData.reprint_count > 0 || receiptData.is_reprint) && (
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
                    {receiptData.items
                      ?.filter((item: any) => {
                        if (receiptData.printType === 'voucher') {
                          return item.notes?.includes('Voucher') || item.notes?.includes('(Voucher)');
                        }
                        if (receiptData.printType === 'complimentary') {
                          return item.is_complimentary;
                        }
                        return true;
                      })
                      ?.map((item: any) => (
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
                        <div className="flex justify-between print-bold-text row-item font-bold text-[11.5pt]">
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
            })}

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
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complimentary Modal */}
      {showComplimentaryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-amber-50">
              <Gift className="text-amber-600" size={24} />
              <h3 className="text-xl font-black text-slate-900">Complimentary Item</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Intended Recipient (To Whom)</label>
                <input
                  type="text"
                  value={compData.recipient}
                  onChange={(e) => setCompData({ ...compData, recipient: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                  placeholder="e.g. VIP Guest, Table 5, etc."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Authorized By (Employee Name)</label>
                <input
                  type="text"
                  value={compData.authorizedBy}
                  onChange={(e) => setCompData({ ...compData, authorizedBy: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                  placeholder="Manager / Supervisor Name"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Reference Number / Slip Number</label>
                <input
                  type="text"
                  value={compData.slipNumber}
                  onChange={(e) => setCompData({ ...compData, slipNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                  placeholder="Enter Reference or Slip #"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => { setShowComplimentaryModal(false); setComplimentaryItemIdx(null); }}
                className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveComplimentary}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all"
              >
                Mark as Complimentary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Z-Reading / X-Reading Overlay */}
      {showZReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 print:bg-white print:items-start print:justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-2xl max-w-[340px] w-full max-h-[90vh] overflow-y-auto font-normal text-[16px] leading-tight print:max-h-none print:overflow-visible print:shadow-none print:w-[80mm] print:p-0 print:m-0 print:text-[10px] printable-area" style={{ fontFamily: 'Verdana, Geneva, sans-serif' }}>
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
                  margin: 0 !important; 
                  padding: 4mm !important; 
                  border: none !important;
                  box-shadow: none !important;
                }
                .printable-area * {
                  font-size: 14px !important;
                  line-height: 1.4 !important;
                  color: black !important;
                  font-family: Verdana, Arial, Helvetica, sans-serif !important;
                  font-weight: 500 !important;
                }
                .printable-area .receipt-title {
                  font-size: 18px !important;
                  font-weight: 800 !important;
                  display: block;
                  margin-bottom: 2mm;
                }
                .printable-area .company-name {
                  font-size: 16px !important;
                  font-weight: 700 !important;
                  display: block;
                }
                .print-bold { font-weight: 700 !important; }
                .print-total { font-size: 17px !important; font-weight: 800 !important; }
              `}
            </style>

            <div className="text-center mb-4 print:mb-2 text-slate-800">
              <p className="mb-2 font-black text-lg receipt-title">X-READING / Z-READING</p>
              <br className="print:hidden" />
              <p className="font-black company-name">{settings?.company_name || 'ESPRESSO YOURSELF & TEA HOUSE'}</p>
              <p>{settings?.address || 'Room 1 Crown Bldg North road 6, North Reclamation Area Mabolo Cebu City'}</p>
              <p>TIN: {settings?.tin || '899-352-898-00000'}</p>
              <p className="mt-2 font-black">***** END OF DAY SHIFT *****</p>
            </div>

            <div className="flex justify-between mb-1">
              <span>Date:</span>
              <span>{getManilaDate().toLocaleDateString('en-US')}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Time:</span>
              <span>{getManilaDate().toLocaleTimeString('en-US')}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span>Cashier:</span>
              <span>{(() => {
                try {
                  const u = localStorage.getItem('resto_active_user');
                  if (u) {
                    const parsed = JSON.parse(u);
                    return parsed.full_name || parsed.username || 'Staff';
                  }
                  return 'Staff';
                } catch (e) { return 'Staff'; }
              })()}</span>
            </div>

            <div className="border-t border-dashed border-black my-2"></div>

            <div className="space-y-0.5 mt-2">
              <div className="flex justify-between">
                <span>Gross Sales:</span>
                <span>₱{(zReadingData?.summary?.gross_sales || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Regular Discount:</span>
                <span>₱{(zReadingData?.summary?.total_discounts || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge:</span>
                <span>₱{(zReadingData?.summary?.total_service_charge || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black mt-1">
                <span>Net Sales:</span>
                <span>₱{(zReadingData?.summary?.total_sales || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-dashed border-black my-2"></div>
              <div className="flex justify-between">
                <span>VATable Sales:</span>
                <span>₱{(zReadingData?.summary?.vatable_sales || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT Amount:</span>
                <span>₱{(zReadingData?.summary?.total_vat || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT Exempt Sales:</span>
                <span>₱{(zReadingData?.summary?.vat_exempt_sales || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Zero Rated Sales:</span>
                <span>0.00</span>
              </div>
            </div>

            <div className="border-t border-dashed border-black my-2 mt-4"></div>

            <div className="mb-2">
              <p>Beginning Invoice No.: {zReadingData?.summary?.min_or?.toString().padStart(8, '0') || '00000000'}</p>
              <p>Ending Invoice No.: {zReadingData?.summary?.max_or?.toString().padStart(8, '0') || '00000000'}</p>
              <p>Z-Counter: {zReadingData?.z_counter?.toString().padStart(6, '0') || '000000'}</p>
              <p className="font-bold mt-2">Grand Total: ₱{(zReadingData?.accumulated_grand_total || 0).toFixed(2)}</p>
            </div>

            <div className="text-center mt-6 print:mt-2">
              <p className="font-black print:text-[14px] print:font-bold">END OF READING REPORT</p>
            </div>

            <div className="mt-8 flex gap-3 print:hidden">
              <button
                onClick={() => setShowZReading(false)}
                className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold transition-colors"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Management Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full m-4 border border-slate-100">
            <div className="flex flex-col items-center text-center mb-6">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg",
                shiftAction === 'start' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
              )}>
                <Clock size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                {shiftAction === 'start' ? 'Start Shift' : 'End Shift'}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {shiftAction === 'start'
                  ? 'Please enter starting cash amount'
                  : 'Please enter ending cash amount (Cash in Drawer)'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">₱</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={shiftAmount}
                  onChange={(e) => setShiftAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-black text-xl text-slate-800"
                  autoFocus
                />
              </div>

              <button
                onClick={handleShiftAction}
                disabled={isProcessingShift}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] shadow-xl",
                  shiftAction === 'start'
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200"
                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200",
                  isProcessingShift && "opacity-50 cursor-not-allowed"
                )}
              >
                {isProcessingShift
                  ? 'PROCESSING...'
                  : shiftAction === 'start' ? 'OPEN SHIFT' : 'CLOSE SHIFT'}
              </button>

              <button
                onClick={() => setShowShiftModal(false)}
                className="w-full py-3 bg-white text-slate-400 hover:text-slate-600 font-bold text-sm transition-all uppercase"
              >
                Cancel / Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Voucher Redemption Modal */}
      {showRedemptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 shadow-2xl overflow-hidden print:hidden">
          <div className="bg-slate-50 w-full max-w-6xl h-[85vh] rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Left side: Search, Categories, Products Grid */}
            <div className="flex-1 flex flex-col h-full border-r border-slate-200 min-w-0 bg-slate-50">
              {/* Header inside modal */}
              <div className="p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Ticket className="text-emerald-600 animate-pulse" size={24} />
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Redemption & Voucher Module</h3>
                </div>

                {/* Sub-mode toggles */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                  <button
                    onClick={() => {
                      setRedemptionMode('voucher');
                      setSelectedRedeemVouchers([]);
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                      redemptionMode === 'voucher'
                        ? "bg-white text-slate-800 shadow border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Voucher Redemption
                  </button>
                  <button
                    onClick={() => {
                      setRedemptionMode('complimentary');
                      setSelectedRedeemVouchers([]);
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                      redemptionMode === 'complimentary'
                        ? "bg-white text-slate-800 shadow border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Complimentary (VIP/FOC)
                  </button>
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={redeemSearch}
                    onChange={(e) => setRedeemSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="p-3 flex gap-2 overflow-x-auto bg-white border-b border-slate-100 no-scrollbar">
                <button
                  onClick={() => setSelectedRedeemCategory('All')}
                  className={cn(
                    "px-4 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all border",
                    selectedRedeemCategory === 'All'
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  All Items
                </button>
                {redemptionCategories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedRedeemCategory(c.name)}
                    className={cn(
                      "px-4 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all border",
                      selectedRedeemCategory === c.name
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Vouchers Grid */}
              <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {voucherItemsByBranch
                    .filter(v => {
                      const matchesCategory = selectedRedeemCategory === 'All' || v.products?.category_name === selectedRedeemCategory;
                      const matchesSearch = v.products?.name.toLowerCase().includes(redeemSearch.toLowerCase());
                      return matchesCategory && matchesSearch;
                    })
                    .map(item => {
                      const isSelected = selectedRedeemVouchers.some(v => v.id === item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => addRedeemToCart(item)}
                          className={cn(
                            "p-3 rounded-xl border transition-all text-left flex flex-col min-h-[140px] relative group",
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/15"
                              : "bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md"
                          )}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-sans">
                              {item.products?.category_name}
                            </span>
                            {isSelected && (
                              <div className="bg-emerald-500 text-white p-0.5 rounded-full">
                                <Check size={10} />
                              </div>
                            )}
                          </div>

                          <h4 className="font-bold text-slate-900 leading-tight text-xs mb-auto group-hover:text-emerald-700 font-sans">
                            {item.products?.name}
                          </h4>

                          <div className="mt-2 pt-2 border-t border-slate-50 flex items-baseline justify-between w-full">
                            <span className="text-sm font-black text-emerald-600">{item.points_required} PTS</span>
                          </div>
                        </button>
                      );
                    })}
                  {voucherItemsByBranch.filter(v => {
                    const matchesCategory = selectedRedeemCategory === 'All' || v.products?.category_name === selectedRedeemCategory;
                    const matchesSearch = v.products?.name.toLowerCase().includes(redeemSearch.toLowerCase());
                    return matchesCategory && matchesSearch;
                  }).length === 0 && (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400">
                        <Ticket size={40} className="mb-3 opacity-15 animate-bounce" />
                        <p className="font-medium text-xs">No voucher items found in this category.</p>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Right side: Sidebar (Redemption Summary) */}
            <div className="w-full md:w-80 bg-white flex flex-col h-full shrink-0 border-t md:border-t-0 md:border-l border-slate-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="text-emerald-600" size={16} />
                  Summary List
                </h4>
                <button
                  onClick={() => setShowRedemptionModal(false)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Summary Items */}
              <div className="flex-1 overflow-auto p-4 space-y-2 bg-slate-50/50">
                {selectedRedeemVouchers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-xs text-center p-4">
                    <Ticket size={36} className="mb-2 opacity-10 not-italic" />
                    <p>Select products on the left to start a redemption slip</p>
                  </div>
                ) : (
                  selectedRedeemVouchers.map((item, idx) => (
                    <div key={item.cartId || idx} className="p-3 bg-white rounded-xl border border-slate-100 flex justify-between items-center group relative shadow-sm animate-none">
                      <div className="min-w-0 pr-2">
                        <h5 className="font-bold text-slate-800 text-xs truncate">{item.products?.name}</h5>
                        <p className="text-emerald-600 font-extrabold text-[11px]">{item.points_required} PTS</p>
                      </div>
                      <button
                        onClick={() => removeRedeemFromCart(item.cartId || '')}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Summary Bottom Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium font-sans">Selected Items</span>
                    <span className="font-bold text-slate-800">{selectedRedeemVouchers.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-slate-200/60 pt-2 font-black">
                    <span className="text-slate-700 font-sans">Total Points</span>
                    <span className="text-emerald-600 text-base font-sans">
                      {selectedRedeemVouchers.reduce((sum, v) => sum + v.points_required, 0)} PTS
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {redemptionMode === 'voucher' ? (
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Reference Number</label>
                      <input
                        type="text"
                        placeholder="Enter Reference Number..."
                        value={redeemRef}
                        onChange={e => setRedeemRef(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-bold text-sm text-slate-700 font-sans"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Intended Recipient (To Whom)</label>
                        <input
                          type="text"
                          placeholder="Enter Recipient Name..."
                          value={compRecipient}
                          onChange={e => setCompRecipient(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all font-bold text-xs text-slate-700 font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Authorized By (Manager)</label>
                        <input
                          type="text"
                          placeholder="Authorized Employee Name..."
                          value={compAuthorizedBy}
                          onChange={e => setCompAuthorizedBy(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all font-bold text-xs text-slate-700 font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Reference / Slip Number</label>
                        <input
                          type="text"
                          placeholder="Enter Slip Number..."
                          value={compSlipNumber}
                          onChange={e => setCompSlipNumber(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all font-bold text-xs text-slate-700 font-sans"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedRedeemVouchers([]);
                        setRedeemRef('');
                        setCompRecipient('');
                        setCompAuthorizedBy('');
                        setCompSlipNumber('');
                        setShowRedemptionModal(false);
                      }}
                      className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-all animate-none"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRedeemFromModal}
                      disabled={isProcessingRedeem || selectedRedeemVouchers.length === 0}
                      className={cn(
                        "flex-[2] py-2.5 rounded-xl font-black text-xs shadow-lg transition-all active:scale-[0.98] text-white flex items-center justify-center gap-1.5",
                        isProcessingRedeem || selectedRedeemVouchers.length === 0
                          ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                          : redemptionMode === 'complimentary'
                            ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/25"
                            : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25"
                      )}
                    >
                      {isProcessingRedeem
                        ? 'PROCESSING...'
                        : redemptionMode === 'complimentary'
                          ? 'PROCESS COMPLIMENTARY'
                          : 'REDEEM VOUCHER'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders History Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-slate-50 w-full max-w-6xl h-full md:h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Eye size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">ORDERS HISTORY</h2>
                  <p className="text-slate-500 text-sm">View and manage branch orders.</p>
                </div>
              </div>
              <button
                onClick={() => setShowOrdersModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Side: Filter & List */}
              <div className="w-full md:w-2/5 flex flex-col border-r border-slate-200 overflow-hidden">
                <div className="p-6 space-y-4 border-b border-slate-100">
                  <div className="flex bg-slate-200/50 p-1 rounded-xl">
                    {(['today', 'week', 'month'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setOrdersFilter(f)}
                        className={cn(
                          "flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all",
                          ordersFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="flex bg-slate-200/50 p-1 rounded-xl">
                    {(['all', 'open', 'paid'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setOrdersStatusFilter(s)}
                        className={cn(
                          "flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all",
                          ordersStatusFilter === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {orders.map(order => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedModalOrder(order)}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left transition-all",
                        selectedModalOrder?.id === order.id
                          ? "bg-white border-indigo-500 shadow-lg shadow-indigo-100 ring-1 ring-indigo-500"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-black text-slate-900">#{order.id}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                          order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'open' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'voided' ? 'bg-red-100 text-red-700' :
                                'bg-purple-100 text-purple-700'
                        )}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-[11px] text-slate-500 font-bold uppercase truncate max-w-[120px]">
                          {order.table_name || order.order_type}
                          <div className="mt-1 font-medium italic opacity-70">
                            {format(new Date(order.created_at), 'MMM dd, HH:mm')}
                          </div>
                        </div>
                        <div className="text-sm font-black text-slate-900">₱{order.total.toFixed(2)}</div>
                      </div>
                    </button>
                  ))}
                  {orders.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <RefreshCw size={48} className="mx-auto mb-4 opacity-10 animate-spin-slow" />
                      <p className="font-bold">No orders found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Details */}
              <div className="hidden md:flex flex-1 flex-col overflow-hidden bg-white">
                {selectedModalOrder ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-black text-slate-900">ORDER #{selectedModalOrder.id}</h3>
                          <p className="text-slate-500 text-sm font-bold uppercase">{selectedModalOrder.table_name || selectedModalOrder.order_type}</p>
                        </div>
                        <div className="flex gap-2 items-center flex-wrap">
                          {selectedModalOrder.status === 'open' && (
                            <button
                              onClick={() => loadOrderToPOS(selectedModalOrder)}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-100"
                            >
                              <ArrowRightLeft size={14} />
                              CONTINUE ORDER
                            </button>
                          )}
                          <button
                            onClick={() => handleReprintFromModal(selectedModalOrder, 'receipt')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black transition-all border border-indigo-200"
                            title="Reprint Receipt"
                          >
                            <Printer size={15} />
                            RECEIPT
                          </button>
                          {selectedModalOrder.items?.some((i: any) => i.notes?.includes('Voucher') || i.notes?.includes('(Voucher)')) && (
                            <button
                              onClick={() => handleReprintFromModal(selectedModalOrder, 'voucher')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black transition-all border border-emerald-200"
                              title="Reprint Voucher"
                            >
                              <Ticket size={15} />
                              VOUCHER
                            </button>
                          )}
                          {selectedModalOrder.items?.some((i: any) => i.is_complimentary) && (
                            <button
                              onClick={() => handleReprintFromModal(selectedModalOrder, 'complimentary')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-black transition-all border border-amber-200"
                              title="Reprint Complimentary Slip"
                            >
                              <Gift size={15} />
                              COMPLI.
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-auto p-6">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-[10px] uppercase font-black text-slate-400 tracking-wider">
                            <th className="pb-4">ITEM</th>
                            <th className="pb-4 text-center">QTY</th>
                            <th className="pb-4 text-right">TOTAL</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {selectedModalOrder.items?.map((item: any) => (
                            <tr key={item.id} className="border-b border-slate-50 last:border-0 text-slate-700 font-medium">
                              <td className="py-3">
                                <div className="font-bold text-slate-800">{item.product_name}</div>
                                {item.is_complimentary && <div className="text-[10px] text-amber-600 font-black tracking-tighter">COMPLIMENTARY</div>}
                              </td>
                              <td className="py-3 text-center font-bold text-slate-600">x{item.quantity}</td>
                              <td className="py-3 text-right font-black text-slate-900">₱{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between text-sm text-slate-500 font-bold">
                        <span>SUBTOTAL</span>
                        <span>₱{(selectedModalOrder.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-500 font-bold">
                        <span>DISC ({selectedModalOrder.discount_name || 'NONE'})</span>
                        <span>-₱{(selectedModalOrder.discount_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
                        <span>TOTAL</span>
                        <span>₱{(selectedModalOrder.total || 0).toFixed(2)}</span>
                      </div>

                      <div className="pt-4 flex gap-3">
                        {selectedModalOrder.status === 'open' && (
                          <button
                            onClick={() => handleModalVoid(selectedModalOrder.id)}
                            className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-black transition-all"
                          >
                            VOID ORDER
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                    <Eye size={64} className="mb-4 opacity-10" />
                    <p className="font-black uppercase tracking-widest text-sm">Select an order to view details</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Mobile Only */}
            <div className="md:hidden p-4 bg-white border-t border-slate-200">
              {selectedModalOrder && selectedModalOrder.status === 'open' ? (
                <button
                  onClick={() => loadOrderToPOS(selectedModalOrder)}
                  className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm"
                >
                  CONTINUE ORDER
                </button>
              ) : (
                <button
                  onClick={() => setShowOrdersModal(false)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm"
                >
                  CLOSE
                </button>
              )}
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
                    executeReprintFromModal(reprintOrder, reprintType, true);
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
                    executeReprintFromModal(reprintOrder, reprintType, false);
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
