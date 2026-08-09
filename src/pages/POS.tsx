import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import qz from 'qz-tray';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, User, Percent, ShoppingCart, Eye, ExternalLink, Maximize, Minimize, Smartphone, Ticket, X, Gift, Clock, Filter, Calendar as CalendarIcon, ArrowRightLeft, RefreshCw, Printer, Check, Package, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../App';
import { useBranch } from '../BranchContext';
import { useSettings } from '../SettingsContext';
import { logActivity } from '../lib/audit';
import { swalAlert, swalConfirm } from '../lib/swal';
import Swal from 'sweetalert2';
import BarbershopView from '../components/barbershop/BarbershopView';

export const getProductImage = (name: string) => {
  return '';
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
  const [categories, setCategories] = useState<{ id: number, name: string, division?: string }[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDivision, setSelectedDivision] = useState<'coffee' | 'laundry'>('coffee');
  const isLaundryBranch = activeBranch?.name?.toLowerCase().includes('laundry') || activeBranch?.name?.toLowerCase().includes('s1p') || activeBranch?.name?.toLowerCase().includes('spin');

  // Laundry POS Redesigned Form States
  const [laundryCustomerName, setLaundryCustomerName] = useState('');
  const [laundryPhone, setLaundryPhone] = useState('');
  const [selectedLaundryService, setSelectedLaundryService] = useState<any>(null);
  const [laundryWeight, setLaundryWeight] = useState('');

  // Washing Preferences
  const [laundryPrefWarmWater, setLaundryPrefWarmWater] = useState(false);
  const [laundryPrefColdWater, setLaundryPrefColdWater] = useState(false);
  const [laundryPrefUnscented, setLaundryPrefUnscented] = useState(false);
  const [laundryPrefSeparateWhite, setLaundryPrefSeparateWhite] = useState(false);
  const [laundryPrefSeparateColored, setLaundryPrefSeparateColored] = useState(false);

  // Addons
  const [laundryAddonRush, setLaundryAddonRush] = useState(false);
  const [laundrySelectedAddons, setLaundrySelectedAddons] = useState<Record<number, number>>({});
  const [laundryPrefCustom, setLaundryPrefCustom] = useState('');

  // Estimated Pickup
  const [laundryPickupDate, setLaundryPickupDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [laundryPickupTime, setLaundryPickupTime] = useState('16:00');

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Everyday Wear (Wash, Dry & Fold)': true,
    'Everyday Wear (Wash Only)': true,
    'Pressing & Ironing': true,
    'Dry Clean': true,
    'Dry Clean (Min of 2 weeks and Maximum of 1 month)': true,
    'Special Items & Dry Clean': true
  });

  // Printer settings
  const [qzPrinterName, setQzPrinterName] = useState(() => localStorage.getItem('qz_printer_name') || 'POSPrinter POS-80C');
  const [useQzTray, setUseQzTray] = useState(() => localStorage.getItem('qz_enabled') === 'true');
  const [qzConnected, setQzConnected] = useState(false);
  const [qzError, setQzError] = useState<string | null>(null);

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
        // Setup signature and certificate promises to enable silent, permission-free printing
        qz.security.setCertificatePromise((resolve, reject) => {
          fetch('/api/qz/certificate')
            .then(res => res.text())
            .then(resolve)
            .catch(reject);
        });

        qz.security.setSignaturePromise((toSign) => {
          return (resolve, reject) => {
            fetch('/api/qz/sign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ request: toSign })
            })
              .then(res => res.text())
              .then(resolve)
              .catch(reject);
          };
        });

        if (!qz.websocket.isActive()) {
          await qz.websocket.connect();
        }
        setQzConnected(true);
        setQzError(null);
      } catch (err: any) {
        console.error("QZ connection failed:", err);
        setQzConnected(false);
        setQzError(err.message || "Could not connect to QZ Tray. Make sure it is running.");
      }
    };

    connectQz();
  }, [useQzTray]);

  // Payment
  const [laundryPaymentMethod, setLaundryPaymentMethod] = useState<'cash' | 'gcash' | 'card'>('cash');
  const [laundryCashReceived, setLaundryCashReceived] = useState('');
  const [laundryGcashReference, setLaundryGcashReference] = useState('');
  const [laundrySelectedDiscount, setLaundrySelectedDiscount] = useState<any>(null);

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

  // Beverage Customization Modal States
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [customSize, setCustomSize] = useState<'Small (12 oz)' | 'Medium (16 oz)' | 'Large (22 oz)'>('Medium (16 oz)');
  const [customSugar, setCustomSugar] = useState<'0%' | '25%' | '50%' | '75%' | '100%'>('100%');
  const [customIce, setCustomIce] = useState<'No Ice' | '25%' | '50%' | '75%' | '100%'>('100%');
  const [customEspresso, setCustomEspresso] = useState<'Regular' | '+1 Shot' | '+2 Shots'>('Regular');
  const [customMilk, setCustomMilk] = useState<'Whole Milk' | 'Oat Milk' | 'Soy Milk' | 'Almond Milk'>('Whole Milk');
  const [customAddons, setCustomAddons] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [laundryServiceSearch, setLaundryServiceSearch] = useState('');
  const [isLaundryDropdownOpen, setIsLaundryDropdownOpen] = useState(false);
  const [laundryServicesList, setLaundryServicesList] = useState<any[]>([]);
  const [laundryIsWalkIn, setLaundryIsWalkIn] = useState(false);
  const [laundryIsEmployeePromo, setLaundryIsEmployeePromo] = useState(false);
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
          setShowShiftModal(false);
          setShowZReading(true);
          swalAlert('Shift Closed', `Shift closed successfully!\nTotal Sales: ₱${finalShift.total_sales.toFixed(2)}\n\nOpening Z-Reading report...`, 'success');
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
      // Skip shift check for laundry branches (S1p/Sp1n) — always open
      const isLaundryBranchLocal = activeBranch?.name?.toLowerCase().includes('laundry') ||
        activeBranch?.name?.toLowerCase().includes('s1p') ||
        activeBranch?.name?.toLowerCase().includes('spin');
      if (activeBranch && !isLaundryBranchLocal) {
        checkShift(u.id, activeBranch.id);
      } else if (activeBranch && isLaundryBranchLocal) {
        // Laundry branch: treat as always having an open shift
        setCurrentShift({ id: 'laundry-always-open', branch_id: activeBranch.id });
        setShowShiftModal(false);
      }
    }

    setSelectedDivision('coffee');
    setSelectedCategory('All');

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
    const isSellable = (p as any).is_sellable !== 0;
    const matchesDivision = !isLaundryBranch || p.division === selectedDivision;
    const matchesCategory = selectedCategory === 'All' || p.category_name === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return isSellable && matchesDivision && matchesCategory && matchesSearch;
  }).sort((a, b) => {
    const aPromo = a.name.toLowerCase().includes('promo') || a.name.toLowerCase().includes('sale') || a.category_name?.toLowerCase().includes('promo');
    const bPromo = b.name.toLowerCase().includes('promo') || b.name.toLowerCase().includes('sale') || b.category_name?.toLowerCase().includes('promo');
    if (aPromo && !bPromo) return -1;
    if (!aPromo && bPromo) return 1;
    return 0;
  });

  const addToCart = async (product: Product) => {
    const isPisoPromo = product.name.toLowerCase().includes('piso promo') || product.name.toLowerCase().includes('piso sale');
    if (isPisoPromo) {
      const alreadyInCart = cart.some(item => item.id === product.id);
      if (alreadyInCart) {
        swalAlert('Promo Limit Reached', 'Piso Promo items are strictly limited to a maximum of 1 unit per transaction.', 'warning');
        return;
      }
    }

    if (product.stock <= 0) {
      swalAlert('Out of Stock', `Cannot add ${product.name} to cart because it is out of stock`, 'error');
      return;
    }
    // Check total unsaved quantity of this item already in current cart
    const currentUnsaved = cart.find(item => item.id === product.id && !item._isSaved);
    const currentUnsavedQty = currentUnsaved ? currentUnsaved.quantity : 0;
    if (currentUnsavedQty + 1 > product.stock) {
      swalAlert('Insufficient Stock', `Cannot add more than the available stock (${product.stock} units left)`, 'error');
      return;
    }

    const isBeverage = !isLaundryBranch && (
      product.category_name.toLowerCase().includes('coffee') ||
      product.category_name.toLowerCase().includes('tea') ||
      product.category_name.toLowerCase().includes('blend') ||
      product.category_name.toLowerCase().includes('beverage')
    );

    if (isBeverage) {
      setCustomSize('Medium (16 oz)');
      setCustomSugar('100%');
      setCustomIce('100%');
      setCustomEspresso('Regular');
      setCustomMilk('Whole Milk');
      setCustomAddons([]);
      setCustomInstructions('');
      setCustomizingProduct(product);
    } else {
      setCart(prev => {
        // Find matching item that hasn't been saved yet and has no custom notes
        const existingUnsavedIndex = prev.findIndex(item => item.id === product.id && !item._isSaved && item.notes === '');
        if (existingUnsavedIndex >= 0) {
          const newCart = [...prev];
          newCart[existingUnsavedIndex] = {
            ...newCart[existingUnsavedIndex],
            quantity: newCart[existingUnsavedIndex].quantity + 1
          };
          return newCart;
        }
        return [...prev, { ...product, quantity: 1, notes: '', _isSaved: false }];
      });
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    const currentItem = cart.find(item => item.id === id);
    if (currentItem && delta > 0) {
      const isPisoPromo = currentItem.name.toLowerCase().includes('piso promo') || currentItem.name.toLowerCase().includes('piso sale');
      if (isPisoPromo) {
        swalAlert('Promo Limit Reached', 'Piso Promo items are strictly limited to a maximum of 1 unit per transaction.', 'warning');
        return;
      }
    }

    if (delta > 0 && settings?.strict_item_locked) {
      const prod = products.find(p => p.id === id);
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

  const [customServices, setCustomServices] = useState<any[]>([]);
  const laundryServices = [
    ...products.filter(p => {
      const div = p.division?.toLowerCase() || '';
      const cat = p.category_name?.toLowerCase() || '';
      const isAddonCat = ['detergents & additives', 'add on', 'add-on', 'supplies', 'detergents', 'additives'].includes(cat);
      return (div === 'laundry' || cat.includes('laundry') || cat.includes('clean') || cat.includes('dry') || cat.includes('service'))
        && !isAddonCat;
    }),
    ...customServices
  ];

  const dynamicAddonTotal = (laundryAddonRush ? 100 : 0) + Object.keys(laundrySelectedAddons).reduce((sum, idStr) => {
    const id = parseInt(idStr);
    const qty = laundrySelectedAddons[id] || 0;
    if (qty > 0) {
      const addon = products.find(p => p.id === id);
      return sum + (addon ? addon.price * qty : 0);
    }
    return sum;
  }, 0);

  const laundrySubtotal = laundryServicesList.reduce((sum, item) => sum + item.subtotal, 0);
  const laundryTotalWeight = laundryServicesList.reduce((sum, item) => sum + item.weight, 0);
  const activeAddonsCount = Object.values(laundrySelectedAddons).filter((q: any) => q > 0).length;
  const totalCartItemsCount = laundryServicesList.length + (laundryAddonRush ? 1 : 0) + activeAddonsCount;
  const hasLaundryItems = totalCartItemsCount > 0;

  const currentSelectionSubtotal = (() => {
    if (!selectedLaundryService) return 0;
    const w = parseFloat(laundryWeight) || 0;
    const isPromo5Plus2 = selectedLaundryService.name?.toLowerCase().includes('5+2') ||
      selectedLaundryService.name?.toLowerCase().includes('5 + 2') ||
      selectedLaundryService.name?.toLowerCase().includes('regular clothes') ||
      selectedLaundryService.name?.toLowerCase().includes('towels & bedsheets');

    const isEmployeeEligible = laundryIsEmployeePromo &&
      (selectedLaundryService.name?.toLowerCase().includes('regular clothes') ||
        selectedLaundryService.name?.toLowerCase().includes('5+2') ||
        selectedLaundryService.name?.toLowerCase().includes('5 + 2')) &&
      !selectedLaundryService.name?.toLowerCase().includes('towel') &&
      !selectedLaundryService.name?.toLowerCase().includes('bedsheet');

    let price = selectedLaundryService.price;
    if (isEmployeeEligible) {
      price = 35;
    }

    if (w > 0) {
      if (isEmployeeEligible) {
        const billedWeight = w < 7 ? 5 : (w - 2);
        return billedWeight * price;
      }
      if (isPromo5Plus2) {
        const billedWeight = w <= 7 ? 5 : (w - 2);
        return billedWeight * price;
      }
      return w * price;
    }
    return price;
  })();

  const laundryGrandTotalBeforeDiscount = laundrySubtotal + dynamicAddonTotal;
  const laundryDiscountAmount = (() => {
    if (!laundrySelectedDiscount) return 0;
    const val = parseFloat(laundrySelectedDiscount.value) || 0;
    if (laundrySelectedDiscount.type === 'percentage') {
      return +(laundryGrandTotalBeforeDiscount * val / 100).toFixed(2);
    }
    return Math.min(val, laundryGrandTotalBeforeDiscount);
  })();
  const laundryGrandTotal = laundryGrandTotalBeforeDiscount - laundryDiscountAmount;

  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setLaundryWeight('');
    } else if (val === '⌫') {
      setLaundryWeight(prev => prev.slice(0, -1));
    } else if (val === '.') {
      if (!laundryWeight.includes('.')) {
        setLaundryWeight(prev => (prev === '' ? '0.' : prev + '.'));
      }
    } else {
      if (laundryWeight === '0' && val === '0') return;
      if (laundryWeight === '0' && val !== '0') {
        setLaundryWeight(val);
        return;
      }
      if (laundryWeight.replace('.', '').length >= 4) return;
      setLaundryWeight(prev => prev + val);
    }
  };

  const refreshProducts = async () => {
    if (!activeBranch) return;
    try {
      const res = await fetch(`/api/products?branch_id=${activeBranch.id}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error('Error refreshing products:', e);
    }
  };

  const handleAddCustomServicePrompt = async () => {
    const laundryCategories = categories.filter(c => c.division === 'laundry');
    if (laundryCategories.length === 0) {
      swalAlert('No Categories', 'Please create a laundry category in Inventory first.', 'warning');
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: 'Add Custom Service',
      html:
        '<div style="text-align: left; font-family: sans-serif; font-size: 13px;">' +
        '<label style="font-weight: bold; margin-bottom: 4px; display: block;">Service Name</label>' +
        '<input id="swal-input-name" class="swal2-input" placeholder="e.g. Dry Clean Special" style="margin-top:0; margin-bottom: 12px; width: 85%; font-size: 14px;">' +
        '<label style="font-weight: bold; margin-bottom: 4px; display: block;">Category</label>' +
        `<select id="swal-input-category" class="swal2-input" style="margin-top:0; margin-bottom: 12px; width: 85%; font-size: 14px; height: 40px; border-radius: 6px; border: 1px solid #d9d9d9; padding: 0 10px;">` +
        laundryCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('') +
        '</select>' +
        '<label style="font-weight: bold; margin-bottom: 4px; display: block;">Price per KG / Rate</label>' +
        '<input id="swal-input-price" type="number" class="swal2-input" placeholder="e.g. 150" style="margin-top:0; width: 85%; font-size: 14px;">' +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Add Service',
      confirmButtonColor: '#3b82f6',
      preConfirm: () => {
        const name = (document.getElementById('swal-input-name') as HTMLInputElement).value;
        const categoryId = parseInt((document.getElementById('swal-input-category') as HTMLSelectElement).value);
        const price = parseFloat((document.getElementById('swal-input-price') as HTMLInputElement).value);
        if (!name.trim()) {
          Swal.showValidationMessage('Please enter a service name');
          return false;
        }
        if (isNaN(categoryId) || categoryId <= 0) {
          Swal.showValidationMessage('Please select a laundry category');
          return false;
        }
        if (isNaN(price) || price <= 0) {
          Swal.showValidationMessage('Please enter a valid price');
          return false;
        }
        return { name, categoryId, price };
      }
    });

    if (formValues) {
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branch_id: activeBranch?.id,
            name: formValues.name,
            price: formValues.price,
            cost: 0,
            category_id: formValues.categoryId,
            stock: 9999
          })
        });

        if (res.ok) {
          const createdProduct = await res.json();
          // Reload products from server so it reflects in the list permanently
          await refreshProducts();
          // Set as selected service
          setSelectedLaundryService(createdProduct);
          swalAlert('Service Added', `"${formValues.name}" has been saved to the database.`, 'success');
        } else {
          const err = await res.json();
          swalAlert('Error', err.error || 'Failed to save service to database', 'error');
        }
      } catch (err: any) {
        swalAlert('Error', err.message || 'Network error', 'error');
      }
    } else {
      setSelectedLaundryService(null);
    }
  };
  const addLaundryServiceToList = () => {
    if (!selectedLaundryService) {
      swalAlert('Missing Service Selection', 'Please select a laundry service first.', 'warning');
      return;
    }
    const weightVal = parseFloat(laundryWeight);
    if (isNaN(weightVal) || weightVal <= 0) {
      swalAlert('Invalid Qty/Weight', 'Please enter a valid weight or quantity first.', 'warning');
      return;
    }

    const isPerKg = (selectedLaundryService.unit || '').toLowerCase() === 'kg' ||
      (selectedLaundryService.unit || '').toLowerCase() === 'kilo' ||
      selectedLaundryService.name?.toLowerCase().includes('/kg') ||
      selectedLaundryService.name?.toLowerCase().includes('/kilo') ||
      selectedLaundryService.name?.toLowerCase().includes('per kg') ||
      selectedLaundryService.name?.toLowerCase().includes('per kilo') ||
      selectedLaundryService.name?.toLowerCase().includes('kilo') ||
      ((selectedLaundryService.category_name || '').toLowerCase().includes('everyday wear') &&
        !(selectedLaundryService.category_name || '').toLowerCase().includes('wash only'));
    const isPromo5Plus2 = selectedLaundryService.name?.toLowerCase().includes('5+2') ||
      selectedLaundryService.name?.toLowerCase().includes('5 + 2') ||
      selectedLaundryService.name?.toLowerCase().includes('regular clothes') ||
      selectedLaundryService.name?.toLowerCase().includes('towels & bedsheets');

    const isEmployeeEligible = laundryIsEmployeePromo &&
      (selectedLaundryService.name?.toLowerCase().includes('regular clothes') ||
        selectedLaundryService.name?.toLowerCase().includes('5+2') ||
        selectedLaundryService.name?.toLowerCase().includes('5 + 2')) &&
      !selectedLaundryService.name?.toLowerCase().includes('towel') &&
      !selectedLaundryService.name?.toLowerCase().includes('bedsheet');

    let price = selectedLaundryService.price;
    let billedWeight = weightVal;
    let freeKilos = 0;
    let sName = selectedLaundryService.name;

    if (isEmployeeEligible) {
      price = 35;
      billedWeight = weightVal < 7 ? 5 : (weightVal - 2);
      freeKilos = weightVal < 7 ? 2 : 2;
      sName = `${selectedLaundryService.name} (Employee Promo)`;
    } else if (isPromo5Plus2) {
      billedWeight = weightVal <= 7 ? 5 : (weightVal - 2);
      freeKilos = weightVal >= 7 ? 2 : 0;
    }

    const existingIdx = laundryServicesList.findIndex(item => item.name === sName);
    if (existingIdx !== -1) {
      const updated = [...laundryServicesList];
      const newWeight = updated[existingIdx].weight + weightVal;
      let newBilled = newWeight;
      let newFree = 0;

      if (isEmployeeEligible) {
        newBilled = newWeight < 7 ? 5 : (newWeight - 2);
        newFree = newWeight < 7 ? 2 : 2;
      } else if (isPromo5Plus2) {
        newBilled = newWeight <= 7 ? 5 : (newWeight - 2);
        newFree = newWeight >= 7 ? 2 : 0;
      }

      updated[existingIdx].weight = newWeight;
      updated[existingIdx].billedWeight = newBilled;
      updated[existingIdx].freeKilos = newFree;
      updated[existingIdx].subtotal = newBilled * price;
      setLaundryServicesList(updated);
    } else {
      const sub = billedWeight * price;
      setLaundryServicesList([
        ...laundryServicesList,
        {
          id: selectedLaundryService.id,
          name: sName,
          price: price,
          weight: weightVal,
          billedWeight: billedWeight,
          subtotal: sub,
          isPerKg: isPerKg,
          isPromo5Plus2: isPromo5Plus2,
          freeKilos: freeKilos,
          category_name: selectedLaundryService.category_name
        }
      ]);
    }

    setSelectedLaundryService(null);
    setLaundryWeight('');
  };
  const resetLaundryForm = () => {
    setLaundryCustomerName('');
    setLaundryPhone('');
    setLaundryIsWalkIn(false);
    setLaundryWeight('');
    setLaundryServicesList([]);
    setLaundrySelectedAddons({});
    setLaundryAddonRush(false);
    setLaundryPrefWarmWater(false);
    setLaundryPrefColdWater(false);
    setLaundryPrefUnscented(false);
    setLaundryPrefSeparateWhite(false);
    setLaundryPrefSeparateColored(false);
    setLaundryPrefCustom('');
    setLaundryPaymentMethod('cash');
    setLaundryCashReceived('');
    setLaundryGcashReference('');
    setLaundrySelectedDiscount(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setLaundryPickupDate(tomorrow.toISOString().split('T')[0]);
    setLaundryPickupTime('16:00');
  };

  const handleCheckoutLaundry = async (payImmediately: boolean) => {
    if (!activeBranch) return;
    if (isProcessingPayment) return;

    // Check validation of inputs
    if (!laundryCustomerName.trim()) {
      swalAlert('Missing Customer Information', 'Please enter customer name', 'warning');
      return;
    }

    let activeList = [...laundryServicesList];
    const hasAddons = laundryAddonRush || Object.values(laundrySelectedAddons).some((qty: any) => qty > 0);

    if (activeList.length === 0) {
      if (selectedLaundryService && parseFloat(laundryWeight) > 0) {
        const weightVal = parseFloat(laundryWeight);
        const isPerKg = (selectedLaundryService.unit || '').toLowerCase() === 'kg' ||
          (selectedLaundryService.unit || '').toLowerCase() === 'kilo' ||
          selectedLaundryService.name?.toLowerCase().includes('/kg') ||
          selectedLaundryService.name?.toLowerCase().includes('/kilo') ||
          selectedLaundryService.name?.toLowerCase().includes('per kg') ||
          selectedLaundryService.name?.toLowerCase().includes('per kilo') ||
          selectedLaundryService.name?.toLowerCase().includes('kilo') ||
          ((selectedLaundryService.category_name || '').toLowerCase().includes('everyday wear') &&
            !(selectedLaundryService.category_name || '').toLowerCase().includes('wash only'));
        const isPromo5Plus2 = selectedLaundryService.name?.toLowerCase().includes('5+2') ||
          selectedLaundryService.name?.toLowerCase().includes('5 + 2') ||
          selectedLaundryService.name?.toLowerCase().includes('regular clothes') ||
          selectedLaundryService.name?.toLowerCase().includes('towels & bedsheets');

        const isEmployeeEligible = laundryIsEmployeePromo &&
          (selectedLaundryService.name?.toLowerCase().includes('regular clothes') ||
            selectedLaundryService.name?.toLowerCase().includes('5+2') ||
            selectedLaundryService.name?.toLowerCase().includes('5 + 2')) &&
          !selectedLaundryService.name?.toLowerCase().includes('towel') &&
          !selectedLaundryService.name?.toLowerCase().includes('bedsheet');

        let price = selectedLaundryService.price;
        let billedWeight = weightVal;
        let freeKilos = 0;
        let sName = selectedLaundryService.name;

        if (isEmployeeEligible) {
          price = 35;
          billedWeight = weightVal < 7 ? 5 : (weightVal - 2);
          freeKilos = weightVal < 7 ? 2 : 2;
          sName = `${selectedLaundryService.name} (Employee Promo)`;
        } else if (isPromo5Plus2) {
          billedWeight = weightVal <= 7 ? 5 : (weightVal - 2);
          freeKilos = weightVal >= 7 ? 2 : 0;
        }

        const sub = billedWeight * price;
        activeList = [{
          id: selectedLaundryService.id,
          name: sName,
          price: price,
          weight: weightVal,
          billedWeight: billedWeight,
          subtotal: sub,
          isPerKg: isPerKg,
          isPromo5Plus2: isPromo5Plus2,
          freeKilos: freeKilos,
          category_name: selectedLaundryService.category_name
        }];
        setLaundryServicesList(activeList);
      } else if (hasAddons) {
        // Allow checkout of only addons
      } else {
        swalAlert('Empty Cart', 'Please select a laundry service or add-ons first.', 'warning');
        return;
      }
    }

    const subtotalCost = activeList.reduce((sum, item) => sum + item.subtotal, 0);
    const totalWeight = activeList.reduce((sum, item) => sum + item.weight, 0);
    const firstRate = activeList[0]?.price || 70;

    const rushPrice = 100;

    // Sum dynamic detergents/additives pricing
    const detergentAddons = products.filter(p => {
      const cat = (p.category_name || '').toLowerCase();
      return cat === 'detergents & additives' || cat === 'add on' || cat === 'add-on' || cat === 'supplies' || cat === 'detergents' || cat === 'additives';
    });
    const selectedAddonProducts: any[] = [];
    let addonTotal = laundryAddonRush ? rushPrice : 0;

    Object.keys(laundrySelectedAddons).forEach(idStr => {
      const id = parseInt(idStr);
      const qty = laundrySelectedAddons[id] || 0;
      if (qty > 0) {
        const addon = products.find(p => p.id === id);
        if (addon) {
          addonTotal += addon.price * qty;
          selectedAddonProducts.push({
            ...addon,
            quantity: qty
          });
        }
      }
    });

    const grandTotal = subtotalCost + addonTotal - laundryDiscountAmount;

    const cashRec = parseFloat(laundryCashReceived) || 0;
    if (payImmediately && laundryPaymentMethod === 'cash' && cashRec < grandTotal) {
      swalAlert('Invalid Payment', 'Cash received is less than grand total amount', 'error');
      return;
    }

    // Confirmation Swal
    const confirmMessage = payImmediately
      ? `Are you sure you want to process payment of ₱${grandTotal.toFixed(2)} via ${laundryPaymentMethod.toUpperCase()}?`
      : `Are you sure you want to save this laundry order for ${laundryCustomerName || 'Walk-In'}?`;

    const isConfirm = await swalConfirm(confirmMessage);
    if (!isConfirm) return;

    setIsProcessingPayment(true);
    try {
      const firstValidProduct = products.find(p => p.branch_id === activeBranch?.id) || products[0];

      const itemsPayload: any[] = activeList.map(item => ({
        product_id: item.id,
        quantity: 1,
        price: item.subtotal,
        notes: `Service: ${item.name} | Weight/Qty: ${item.weight.toFixed(1)} kg, Rate: ₱${item.price.toFixed(2)}/kg`
      }));

      if (laundryAddonRush) {
        const p = products.find(prod => prod.name.toLowerCase().includes('rush'));
        itemsPayload.push({
          product_id: p?.id || firstValidProduct?.id || 1,
          quantity: 1,
          price: rushPrice,
          notes: 'Laundry Add-on: Rush Service'
        });
      }

      // Add selected detergents to order payload
      selectedAddonProducts.forEach(addon => {
        itemsPayload.push({
          product_id: addon.id,
          quantity: addon.quantity || 1,
          price: addon.price,
          notes: `Laundry Add-on: ${addon.name} (x${addon.quantity || 1})`
        });
      });

      const preferencesList: string[] = [];
      if (laundryPrefWarmWater) preferencesList.push('Warm Water');
      if (laundryPrefColdWater) preferencesList.push('Cold Water');
      if (laundryPrefUnscented) preferencesList.push('Unscented');
      if (laundryPrefSeparateWhite) preferencesList.push('Separate White Clothes');
      if (laundryPrefSeparateColored) preferencesList.push('Separate Colored Clothes');
      if (laundryPrefCustom.trim()) preferencesList.push(laundryPrefCustom.trim());

      const addonsList: any[] = [];
      if (laundryAddonRush) addonsList.push({ name: 'Rush Service', price: rushPrice });
      selectedAddonProducts.forEach(addon => {
        addonsList.push({ name: `${addon.name} (x${addon.quantity || 1})`, price: addon.price * (addon.quantity || 1) });
      });

      const laundryDetails = {
        is_laundry: true,
        company_name: settings?.company_name || 'SIP & SPIN LAUNDRY SHOP',
        customer_name: laundryCustomerName,
        phone: laundryPhone,
        service_name: activeList.length > 0 ? activeList.map(item => item.name).join(', ') : 'Supplies & Add-ons Only',
        weight: totalWeight,
        rate: firstRate,
        subtotal: subtotalCost,
        services: activeList,
        preferences: preferencesList,
        addons: addonsList,
        pickup_date: laundryPickupDate,
        pickup_time: laundryPickupTime,
        payment_method: laundryPaymentMethod,
        gcash_reference: laundryPaymentMethod === 'gcash' ? laundryGcashReference : null
      };

      const localUser = localStorage.getItem('resto_active_user');
      const activeUser = localUser ? JSON.parse(localUser) : null;
      const cashierName = activeUser?.full_name || activeUser?.username || 'Staff';

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: activeBranch?.id,
          table_id: null,
          order_type: 'takeout',
          items: itemsPayload,
          notes: JSON.stringify(laundryDetails)
        })
      });

      const orderResult = await res.json();
      if (!res.ok || !orderResult.success) {
        swalAlert('Failed to create order', orderResult.error || 'Server error', 'error');
        setIsProcessingPayment(false);
        return;
      }

      const orderId = orderResult.id;

      if (payImmediately) {
        const payRes = await fetch(`/api/orders/${orderId}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            discount_id: laundrySelectedDiscount?.id || null,
            discount_amount: laundryDiscountAmount,
            tax_amount: 0,
            service_charge: 0,
            total: grandTotal,
            payment_method: laundryPaymentMethod,
            amount_tendered: laundryPaymentMethod === 'cash' ? cashRec : grandTotal,
            change: laundryPaymentMethod === 'cash' ? (cashRec - grandTotal) : 0,
            reference_number: laundryPaymentMethod === 'gcash' ? laundryGcashReference : ''
          })
        });

        if (payRes.ok) {
          const { receipt } = await payRes.json();
          setReceiptData({
            ...receipt,
            cashier_name: cashierName
          });
          resetLaundryForm();
        } else {
          const err = await payRes.json();
          swalAlert('Payment Failed', err.error || 'Failed to settle laundry payment', 'error');
        }
      } else {
        resetLaundryForm();
      }

    } catch (e: any) {
      console.error(e);
      swalAlert('Error', e.message || 'Operation failed', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

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
  const [zReadingFilter, setZReadingFilter] = useState<'all' | 'coffee' | 'laundry'>('all');

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

    // Guard: block payment if there are unsaved items in the cart.
    // Unsaved items are included in the cart total but NOT yet saved to the DB,
    // which causes the charged total to exceed the actual order items on record.
    const unsavedItems = cart.filter(item => !item._isSaved);
    if (unsavedItems.length > 0) {
      swalAlert(
        'Unsaved Items',
        `You have ${unsavedItems.length} item(s) not yet saved to the order.\n\nPlease press "Place Order" first to save them before proceeding to payment.`,
        'warning'
      );
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
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      swalAlert('Permission Denied', 'Only administrators or managers are allowed to void orders.', 'error');
      return;
    }
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

        const printStyles = `
          html, body { 
            margin: 0; 
            padding: 0;
            background-color: white !important;
            color: black !important;
            width: 100% !important;
            display: flex !important;
            justify-content: center !important;
          }
          .receipt-ticket-content { 
            width: 80mm !important; 
            max-width: 80mm !important; 
            margin: 0 auto !important; 
            padding: 6px !important; 
            background: white !important;
            box-sizing: border-box !important;
          }
          .receipt-ticket-content * {
            font-size: 9.5pt !important; 
            line-height: 1.2 !important; 
            color: black !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-weight: 400 !important;
          }
          .receipt-ticket-content p, .receipt-ticket-content div, .receipt-ticket-content span {
            margin: 0 !important;
            padding: 0 !important;
          }
          .receipt-ticket-content .row-item {
            margin-top: 2.5px !important;
            margin-bottom: 2.5px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
          }
          .receipt-ticket-content .section-block {
            margin-top: 5px !important;
            margin-bottom: 5px !important;
          }
          .receipt-ticket-content .section-header {
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
          .receipt-ticket-content .receipt-logo {
            max-width: 280px !important;
            max-height: 85px !important;
            height: auto !important;
            display: block !important;
            margin: 0 auto 4px auto !important;
            object-fit: contain !important;
          }
          .receipt-ticket-content .company-name {
            font-size: 11.5pt !important;
            font-weight: 700 !important;
            display: block;
            text-align: center;
            text-transform: uppercase;
            margin-bottom: 2px !important;
          }
          .receipt-ticket-content .receipt-title {
            font-size: 10.5pt !important;
            font-weight: 700 !important;
            display: block;
            text-align: center;
            text-transform: uppercase;
            margin-bottom: 2px !important;
          }
          .receipt-ticket-content .print-total,
          .receipt-ticket-content .print-total * {
            font-size: 13pt !important;
            font-weight: 700 !important;
            line-height: 1.4 !important;
          }
          .receipt-ticket-content .print-change,
          .receipt-ticket-content .print-change * {
            font-size: 11.5pt !important;
            font-weight: 700 !important;
            line-height: 1.3 !important;
          }
          .receipt-ticket-content .font-bold,
          .receipt-ticket-content .font-black,
          .receipt-ticket-content .font-semibold,
          .receipt-ticket-content .print-bold-text {
            font-weight: 700 !important;
          }
          .text-center {
            text-align: center !important;
          }
          .text-right {
            text-align: right !important;
          }
          .border-t {
            border-top: 1px dashed black !important;
          }
          .border-b {
            border-bottom: 1px solid black !important;
          }
          .border-y {
            border-top: 1px dashed black !important;
            border-bottom: 1px dashed black !important;
          }
          .italic {
            font-style: italic !important;
          }
          .truncate {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        `;

        const printData = [
          {
            type: 'html',
            format: 'plain',
            data: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <style>${printStyles}</style>
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
        swalAlert('Print Error', err.message || 'Failed to print via QZ Tray. Make sure it is running and your printer name is correct.', 'error');
      }
    } else {
      window.print();
    }
  };

  const popOut = () => {
    window.open(`/standalone-pos${activeTerminal ? `?terminal_id=${activeTerminal.id}` : ''}`, '_blank', 'width=1200,height=800');
  };

  const receiptCalculations = getReceiptCalculations(receiptData, settings);

  const isBarbershopBranch = activeBranch?.name?.toLowerCase().includes('barbershop') ||
                             activeBranch?.name?.toLowerCase().includes('salon') ||
                             activeBranch?.name?.toLowerCase().includes('slick') ||
                             activeBranch?.name?.toLowerCase().includes('dapper');

  if (isBarbershopBranch) {
    return <BarbershopView activeBranch={activeBranch} currentUser={currentUser} settings={settings} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      {/* Block POS access if no active shift — hidden for laundry branches */}
      {!currentShift && !isLaundryBranch && (
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
      {selectedDivision === 'laundry' ? (
        <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden font-sans print:hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Laundry Order Entry</h1>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setSelectedDivision('coffee')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-white transition-all shadow-xs"
                >
                  Switch to Coffee POS
                </button>
              </div>
            </div>
            {/* Action buttons — shift button hidden for laundry branch */}
            <div className="flex items-center gap-2">
              {!isLaundryBranch && (
                <button
                  onClick={() => {
                    setShiftAction(currentShift ? 'end' : 'start');
                    setShiftAmount('');
                    setShowShiftModal(true);
                  }}
                  className={cn(
                    "px-4 py-2 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm",
                    currentShift ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                  )}
                >
                  <Clock size={14} /> {currentShift ? 'END SHIFT' : 'START SHIFT'}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-1.5 bg-slate-100">
            <div className="w-full max-w-none grid grid-cols-1 lg:grid-cols-[30%_1fr_1fr] gap-3 h-full px-2">

              {/* COLUMN 1: Selected Services List (Cart) */}
              <div className="flex flex-col h-full lg:col-span-1">
                <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-slate-200 flex flex-col h-full">
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5 font-sans">
                    <span className="flex items-center gap-1.5">
                      Selected Items
                      <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{totalCartItemsCount}</span>
                    </span>
                    {hasLaundryItems && (
                      <button
                        type="button"
                        onClick={() => {
                          setLaundryServicesList([]);
                          setLaundrySelectedAddons({});
                          setLaundryAddonRush(false);
                        }}
                        className="text-rose-600 hover:text-rose-700 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider transition-colors"
                      >
                        <Trash2 size={12} /> Remove All
                      </button>
                    )}
                  </h2>

                  {/* List Container */}
                  <div className="flex-1 overflow-y-auto mb-3 space-y-2 pr-1 custom-scrollbar">
                    {hasLaundryItems ? (
                      <>
                        {/* Main Services List */}
                        {laundryServicesList.map((item, idx) => {
                          const isBedsheet = item.name.toLowerCase().includes('sheet') || item.name.toLowerCase().includes('bed') || item.name.toLowerCase().includes('comforter') || item.name.toLowerCase().includes('curtain');
                          return (
                            <div key={`service-${idx}`} className="flex items-center justify-between p-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all gap-2 shadow-xs">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                                  {isBedsheet ? <Gift size={16} /> : <Package size={16} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-extrabold text-slate-800 text-[11px] truncate leading-tight">{item.name.replace('/kg', '').replace('/kilo', '')}</p>
                                  <p className="text-[9px] text-slate-400 font-bold mt-0.5 font-sans">
                                    ₱{item.price.toFixed(2)} / {item.isPerKg ? 'kg' : 'pcs'}
                                    {item.isPromo5Plus2 && item.freeKilos > 0 && (
                                      <span className="text-emerald-600 font-black ml-1">({item.freeKilos.toFixed(1)}kg Free)</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0 font-sans font-black text-xs text-slate-800 min-w-[50px] pr-1">
                                {item.isPerKg ? `${item.weight.toFixed(1)} kg` : `${item.weight.toFixed(0)} pcs`}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="font-mono font-bold text-xs text-slate-900 pr-1">₱{item.subtotal.toFixed(0)}</span>
                                <button
                                  type="button"
                                  onClick={() => setLaundryServicesList(laundryServicesList.filter((_, i) => i !== idx))}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={13} className="text-rose-500" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Rush Service Addon Row */}
                        {laundryAddonRush && (
                          <div className="flex items-center justify-between p-2.5 bg-amber-50/40 hover:bg-amber-50 border border-amber-250 rounded-2xl transition-all gap-2 shadow-xs">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600">
                                <Clock size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-extrabold text-slate-800 text-[11px] truncate leading-tight">⚡ Rush Service</p>
                                <p className="text-[9px] text-slate-450 font-bold mt-0.5 font-sans">Turnaround speed upgrade</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 font-sans font-black text-xs text-slate-805 min-w-[50px] pr-1">
                              1 x
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="font-mono font-bold text-xs text-slate-900 pr-1">₱100</span>
                              <button
                                type="button"
                                onClick={() => setLaundryAddonRush(false)}
                                className="p-1 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={13} className="text-rose-500" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Detergents / Softeners Addons List */}
                        {products
                          .filter(p => {
                            const cat = (p.category_name || '').toLowerCase();
                            const isAddon = cat === 'detergents & additives' || cat === 'add on' || cat === 'add-on' || cat === 'supplies' || cat === 'detergents' || cat === 'additives';
                            const qty = laundrySelectedAddons[p.id] || 0;
                            return isAddon && qty > 0;
                          })
                          .map(addon => {
                            const qty = laundrySelectedAddons[addon.id] || 0;
                            const sub = addon.price * qty;
                            return (
                              <div key={`addon-list-${addon.id}`} className="flex items-center justify-between p-2.5 bg-blue-50/20 hover:bg-blue-50/30 border border-blue-200 rounded-2xl transition-all gap-2 shadow-xs">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-500">
                                    <Package size={16} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-extrabold text-slate-800 text-[11px] truncate leading-tight">{addon.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold mt-0.5 font-sans">₱{addon.price.toFixed(2)} / sachet</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 font-sans font-black text-xs text-slate-800 min-w-[50px] pr-1">
                                  {qty} pcs
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="font-mono font-bold text-xs text-slate-900 pr-1">₱{sub.toFixed(0)}</span>
                                  <button
                                    type="button"
                                    onClick={() => setLaundrySelectedAddons(prev => ({ ...prev, [addon.id]: 0 }))}
                                    className="p-1 text-slate-400 hover:text-rose-655 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={13} className="text-rose-500" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-slate-400 p-6 text-center font-sans">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
                          <Package size={20} className="text-slate-400" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-700">No Services Selected</p>
                        <p className="text-[10px] text-slate-450 mt-1 leading-relaxed max-w-[170px]">Select a service and enter quantity/weight in the middle column, then click Add Service.</p>
                      </div>
                    )}
                  </div>

                  {/* Totals & Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5 font-sans mt-auto flex-shrink-0">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <span>Total Items</span>
                      <span className="text-slate-800 font-extrabold text-xs">{totalCartItemsCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      <span>Grand Total</span>
                      <span className="text-slate-900 font-black text-sm font-mono font-sans">₱{laundryGrandTotal.toFixed(2)}</span>
                    </div>

                    {/* Bottom Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setLaundryServicesList([]);
                          setLaundrySelectedAddons({});
                          setLaundryAddonRush(false);
                        }}
                        className="w-[38%] py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 font-sans"
                      >
                        <Trash2 size={12} /> Clear All
                      </button>
                      <button
                        type="button"
                        onClick={addLaundryServiceToList}
                        className="w-[62%] py-2 bg-white hover:bg-blue-50 border-2 border-blue-500 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] font-sans"
                      >
                        <Plus size={12} /> Add Service
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMN 2 (Middle): Customer, Service & Weight Keypad */}
              <div className="space-y-3 flex flex-col h-full lg:col-span-1">

                {/* Customer Details Card */}
                <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-slate-200">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    Customer Information
                  </h2>
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block mb-0.5">Customer Name</label>
                        <div className="relative flex items-center">
                          <User className="absolute left-2.5 text-slate-400" size={12} />
                          <input
                            type="text"
                            disabled={laundryIsWalkIn}
                            value={laundryIsWalkIn ? 'Walk-in Customer' : laundryCustomerName}
                            onChange={e => setLaundryCustomerName(e.target.value)}
                            className="w-full pl-7 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-xs font-semibold disabled:opacity-75 disabled:bg-slate-100"
                            placeholder="Customer Name..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block mb-0.5">Phone Number</label>
                        <div className="relative flex items-center">
                          <Smartphone className="absolute left-2.5 text-slate-400" size={12} />
                          <input
                            type="text"
                            disabled={laundryIsWalkIn}
                            value={laundryIsWalkIn ? '' : laundryPhone}
                            onChange={e => setLaundryPhone(e.target.value)}
                            className="w-full pl-7 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-xs font-semibold disabled:opacity-75 disabled:bg-slate-100"
                            placeholder="Phone Number..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-1 font-sans">
                      {/* Walk-in checkbox */}
                      <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={laundryIsWalkIn}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setLaundryIsWalkIn(checked);
                            if (checked) {
                              setLaundryCustomerName('Walk-in Customer');
                              setLaundryPhone('');
                            } else {
                              setLaundryCustomerName('');
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 accent-blue-600"
                        />
                        <span className="text-[10px] font-bold text-slate-650 flex items-center gap-0.5">
                          Walk-in Customer
                          <span className="text-slate-400 cursor-pointer text-[8px]" title="Automatically formats order for anonymous walk-in client">ⓘ</span>
                        </span>
                      </label>

                      {/* Employee Promo checkbox */}
                      <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={laundryIsEmployeePromo}
                          onChange={(e) => setLaundryIsEmployeePromo(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-amber-600 border-slate-300 focus:ring-amber-500 accent-amber-600"
                        />
                        <span className="text-[10px] font-bold text-slate-650 flex items-center gap-0.5">
                          Employee Promo 👑
                          <span className="text-slate-400 cursor-pointer text-[8px]" title="Regular clothes: ₱35/kg, forced minimum of 7kg (with 2kg free)">ⓘ</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Laundry Services Selector Panel */}
                <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-slate-200 flex-1 flex flex-col min-h-0">

                  {/* Weight / Qty Entry Row */}
                  <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-200 gap-2 mb-1.5 flex-shrink-0">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Weight / Qty</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(laundryWeight) || 0;
                          if (val > 0) {
                            const newVal = Math.max(0, val - 1);
                            setLaundryWeight(Number(newVal.toFixed(2)).toString());
                          }
                        }}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 active:scale-[0.95] flex items-center justify-center font-bold text-slate-600 transition-all text-sm"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        value={laundryWeight}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setLaundryWeight(val);
                          }
                        }}
                        className="w-16 py-1 bg-white border border-slate-250 rounded-lg text-center font-mono font-black text-sm text-slate-800 outline-none focus:border-blue-500"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(laundryWeight) || 0;
                          const newVal = val + 1;
                          setLaundryWeight(Number(newVal.toFixed(2)).toString());
                        }}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 active:scale-[0.95] flex items-center justify-center font-bold text-slate-600 transition-all text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Grouped Services Accordions List */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar min-h-0">
                    {(() => {
                      const grouped: Record<string, typeof laundryServices> = {};
                      laundryServices.forEach(s => {
                        const cat = s.category_name || 'Other Services';
                        if (!grouped[cat]) grouped[cat] = [];
                        grouped[cat].push(s);
                      });

                      return Object.entries(grouped).map(([catName, list]) => {
                        const isOpen = !!expandedCategories[catName];
                        return (
                          <div key={catName} className="flex flex-col">
                            {/* Accordion Toggle Header */}
                            <button
                              type="button"
                              onClick={() => setExpandedCategories({ [catName]: !isOpen })}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all text-left"
                            >
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{catName}</span>
                              <ChevronDown size={12} className={cn("text-slate-500 transition-transform duration-200", isOpen && "rotate-180")} />
                            </button>

                            {/* Service Buttons Grid */}
                            {isOpen && (
                              <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50/20 border border-t-0 border-slate-200 rounded-b-xl -mt-1 mb-1">
                                {list.map(s => {
                                  const isSelected = selectedLaundryService?.id === s.id;
                                  const isPromo = s.name.toLowerCase().includes('5+2') || s.name.toLowerCase().includes('regular clothes') || s.name.toLowerCase().includes('towels & bedsheets');
                                  const isPerKg = (s.unit || '').toLowerCase() === 'kg' ||
                                    (s.unit || '').toLowerCase() === 'kilo' ||
                                    s.name?.toLowerCase().includes('/kg') ||
                                    s.name?.toLowerCase().includes('/kilo') ||
                                    s.name?.toLowerCase().includes('per kg') ||
                                    s.name?.toLowerCase().includes('per kilo') ||
                                    s.name?.toLowerCase().includes('kilo') ||
                                    ((s.category_name || '').toLowerCase().includes('everyday wear') &&
                                      !(s.category_name || '').toLowerCase().includes('wash only'));

                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => setSelectedLaundryService(s)}
                                      className={cn(
                                        "p-2 text-left rounded-lg transition-all border flex flex-col justify-between gap-0.5 shadow-2xs relative overflow-hidden min-h-[44px] cursor-pointer",
                                        isSelected
                                          ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500 text-blue-900"
                                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                                      )}
                                    >
                                      {isPromo && (
                                        <span className="absolute right-0 top-0 bg-amber-500 text-white text-[6.5px] font-black uppercase px-1 py-0.5 rounded-bl-md">
                                          PROMO
                                        </span>
                                      )}
                                      <span className="font-extrabold text-[10px] leading-tight pr-4 truncate max-w-full" title={s.name}>
                                        {s.name.replace('/kg', '').replace('/kilo', '').replace(' (5+2 FREE)', '')}
                                      </span>
                                      <span className="font-mono font-bold text-[10px] text-blue-600">
                                        ₱{s.price.toFixed(2)}/{isPerKg ? 'kg' : 'pcs'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Promo Banner if active */}
                  {selectedLaundryService && (selectedLaundryService.name.toLowerCase().includes('promo') || selectedLaundryService.category_name?.toLowerCase().includes('promo')) && (
                    <div className="mt-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-1.5 rounded-xl flex items-center justify-center gap-1.5 text-[9px] font-black uppercase shadow-xs tracking-wider animate-pulse flex-shrink-0">
                      <span> Active Promo Package Selected!</span>
                    </div>
                  )}

                  {/* Add Custom Service prompt */}
                  <button
                    type="button"
                    onClick={handleAddCustomServicePrompt}
                    className="mt-2 py-1.5 border border-dashed border-slate-350 hover:bg-slate-50 hover:border-slate-400 text-slate-500 hover:text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 flex-shrink-0"
                  >
                    + Add Custom Service...
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: Preferences, Add-ons, Pickup, Payment & Summary */}
              <div className="space-y-2 flex flex-col h-full">

                {/* Washing Preferences & Add-ons Card */}
                <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      ➕ Add-ons / Detergents & Softeners
                    </h2>

                    {/* Addons Grid */}
                    <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                      {/* Rush Service option */}
                      <label className={cn("flex items-center justify-between p-1 border rounded-xl cursor-pointer select-none text-[10px] font-bold text-slate-700", laundryAddonRush ? "bg-blue-50/50 border-blue-500" : "bg-slate-50 border-slate-200")}>
                        <div className="flex items-center gap-1.5 pl-1">
                          <input type="checkbox" checked={laundryAddonRush} onChange={e => setLaundryAddonRush(e.target.checked)} className="accent-blue-600 w-3 h-3" />
                          <span>⚡ Rush Service</span>
                        </div>
                        <span className="text-blue-600 text-[9px] font-black pr-1">+₱100</span>
                      </label>

                      {/* Dynamic Detergent Additives */}
                      {products
                        .filter(p => {
                          const cat = (p.category_name || '').toLowerCase();
                          return cat === 'detergents & additives' || cat === 'add on' || cat === 'add-on' || cat === 'supplies' || cat === 'detergents' || cat === 'additives';
                        })
                        .map(addon => {
                          const qty = laundrySelectedAddons[addon.id] || 0;
                          const isChecked = qty > 0;
                          return (
                            <div
                              key={addon.id}
                              className={cn(
                                "flex items-center justify-between p-1 border rounded-xl select-none text-[10px] font-bold text-slate-700 transition-all",
                                isChecked ? "bg-blue-50/50 border-blue-500" : "bg-slate-50 border-slate-200"
                              )}
                            >
                              <span className="truncate max-w-[90px] pl-1 font-bold" title={addon.name}>{addon.name}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-blue-600 text-[9px] font-black mr-1">+₱{(addon.price * (qty || 1)).toFixed(0)}</span>
                                <button
                                  type="button"
                                  onClick={() => setLaundrySelectedAddons(prev => ({ ...prev, [addon.id]: Math.max(0, (prev[addon.id] || 0) - 1) }))}
                                  className="w-5 h-5 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-650 hover:bg-slate-50 transition-all text-xs"
                                >
                                  -
                                </button>
                                <span className="w-4 text-center font-mono font-bold text-[10px]">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => setLaundrySelectedAddons(prev => ({ ...prev, [addon.id]: (prev[addon.id] || 0) + 1 }))}
                                  className="w-5 h-5 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-650 hover:bg-slate-50 transition-all text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Manual Custom preference / instructions */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider shrink-0">Custom Notes:</span>
                    <input
                      type="text"
                      value={laundryPrefCustom}
                      onChange={e => setLaundryPrefCustom(e.target.value)}
                      placeholder="e.g. Extra detergent, fold dry, separate whites..."
                      className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Pickup, Settlement & Checkout Card */}
                <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-slate-200 flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-1.5">

                    {/* Pickup Details */}
                    <div>
                      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        Pickup Details
                      </h2>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={laundryPickupDate}
                          onChange={e => setLaundryPickupDate(e.target.value)}
                          className="w-full px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-bold cursor-pointer"
                        />
                        <input
                          type="time"
                          value={laundryPickupTime}
                          onChange={e => setLaundryPickupTime(e.target.value)}
                          className="w-full px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-bold cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Discount Selector */}
                    <div>
                      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 font-sans">
                        Discount
                      </h2>
                      <select
                        value={laundrySelectedDiscount?.id || ''}
                        onChange={e => {
                          const d = discounts.find((d: any) => d.id.toString() === e.target.value);
                          setLaundrySelectedDiscount(d || null);
                        }}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold text-slate-700 focus:border-blue-500"
                      >
                        <option value="">No Discount</option>
                        {discounts.filter((d: any) => d.is_active !== 0).map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 font-sans">
                        Payment Settlement
                      </h2>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setLaundryPaymentMethod('cash')}
                          className={cn(
                            "py-1 rounded-xl font-bold text-[10px] uppercase tracking-wide border transition-all flex items-center justify-center gap-1 active:scale-[0.97]",
                            laundryPaymentMethod === 'cash'
                              ? "bg-blue-600 text-white border-blue-700 shadow-sm font-black"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          <Banknote size={12} /> Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setLaundryPaymentMethod('gcash')}
                          className={cn(
                            "py-1 rounded-xl font-bold text-[10px] uppercase tracking-wide border transition-all flex items-center justify-center gap-1 active:scale-[0.97]",
                            laundryPaymentMethod === 'gcash'
                              ? "bg-blue-600 text-white border-blue-700 shadow-sm font-black"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          <Smartphone size={12} /> GCash
                        </button>
                        <button
                          type="button"
                          onClick={() => setLaundryPaymentMethod('card')}
                          className={cn(
                            "py-1 rounded-xl font-bold text-[10px] uppercase tracking-wide border transition-all flex items-center justify-center gap-1 active:scale-[0.97]",
                            laundryPaymentMethod === 'card'
                              ? "bg-blue-600 text-white border-blue-700 shadow-sm font-black"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          <CreditCard size={12} /> Card
                        </button>
                      </div>
                    </div>

                    {/* GCash Reference Panel */}
                    {laundryPaymentMethod === 'gcash' && (
                      <div className="bg-slate-50/50 p-2 border border-slate-200 rounded-2xl">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">GCash Reference No.</label>
                        <input
                          type="text"
                          value={laundryGcashReference}
                          onChange={e => setLaundryGcashReference(e.target.value)}
                          className="w-full px-3 py-1 bg-white border border-blue-200 rounded-xl outline-none text-sm font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                          placeholder="Enter Reference Number"
                        />
                      </div>
                    )}

                    {/* Cash Change Panel */}
                    {laundryPaymentMethod === 'cash' && (
                      <div className="bg-slate-50/50 p-2 border border-slate-200 rounded-2xl grid grid-cols-5 gap-2 items-center">
                        <div className="col-span-3">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Cash Tendered</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">₱</span>
                            <input
                              type="text"
                              value={laundryCashReceived}
                              onChange={e => setLaundryCashReceived(e.target.value)}
                              className="w-full pl-7 pr-3 py-1 bg-white border border-blue-200 rounded-xl outline-none text-lg font-black text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="col-span-2 flex flex-col justify-center text-right pr-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Change Due</span>
                          {(() => {
                            const cashRec = parseFloat(laundryCashReceived) || 0;
                            const diff = cashRec - laundryGrandTotal;
                            const isNeg = diff < 0;
                            return (
                              <span className={cn(
                                "text-xl font-black font-mono",
                                isNeg ? "text-rose-600 animate-pulse" : "text-blue-600"
                              )}>
                                {isNeg ? `-₱${Math.abs(diff).toFixed(2)}` : `₱${diff.toFixed(2)}`}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Calculations & Checkout action buttons */}
                  <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                    <div className="bg-slate-900 text-white p-2 rounded-xl mb-1.5">
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold mb-0.5">
                        <span>Subtotal ({laundryTotalWeight.toFixed(2)} kg)</span>
                        <span>₱{laundryGrandTotalBeforeDiscount.toFixed(2)}</span>
                      </div>
                      {dynamicAddonTotal > 0 && (
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold mb-0.5">
                          <span>Add-ons</span>
                          <span>₱{dynamicAddonTotal.toFixed(2)}</span>
                        </div>
                      )}
                      {laundryDiscountAmount > 0 && (
                        <div className="flex justify-between items-center text-[9px] text-amber-400 font-semibold mb-0.5">
                          <span>Discount ({laundrySelectedDiscount?.name})</span>
                          <span>-₱{laundryDiscountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t border-slate-800 pt-1 mt-1">
                        <span className="text-[10px] font-black uppercase text-slate-300">Grand Total</span>
                        <span className="text-lg font-black text-cyan-400 font-mono">
                          ₱{laundryGrandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={resetLaundryForm}
                        className="py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 transition-all font-black text-xs uppercase tracking-wider rounded-xl text-center shadow-sm"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        disabled={isProcessingPayment}
                        onClick={() => handleCheckoutLaundry(false)}
                        className={cn(
                          "py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white transition-all font-black text-xs uppercase tracking-wider rounded-xl text-center shadow-sm",
                          isProcessingPayment && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={isProcessingPayment}
                        onClick={() => handleCheckoutLaundry(true)}
                        className={cn(
                          "py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white transition-all font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10 text-center",
                          isProcessingPayment && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Printer size={12} />
                        Pay & Print
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col h-full border-r border-slate-200 min-w-0 print:hidden">
            {/* Header */}
            <div className="px-3 py-1.5 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 flex-shrink-0 font-sans">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 pl-14">
                <h1 className="text-sm font-black text-slate-800 tracking-tight whitespace-nowrap mr-1.5">Business POS</h1>
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
                    {/* END SHIFT button hidden for laundry branch */}
                    {!isLaundryBranch && (
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
                    )}
                  </>
                )}

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

            {/* Division Selector Toggle for Laundry hybrid branch */}
            {isLaundryBranch && (
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex gap-2 flex-shrink-0 font-sans">
                <button
                  onClick={() => {
                    setSelectedDivision('coffee');
                    setSelectedCategory('All');
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all active:scale-[0.97] uppercase tracking-wide min-h-[38px]",
                    selectedDivision === 'coffee'
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Coffee Shop
                </button>
                <button
                  onClick={() => {
                    setSelectedDivision('laundry');
                    setSelectedCategory('All');
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all active:scale-[0.97] uppercase tracking-wide min-h-[38px]",
                    selectedDivision === 'laundry'
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Laundry Service
                </button>
              </div>
            )}

            {/* Categories and Search Row */}
            <div className="p-1.5 px-3 flex flex-col sm:flex-row gap-3 bg-white border-b border-slate-100 flex-shrink-0 font-sans sm:items-center justify-between">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1 pb-1 sm:pb-0">
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
                {categories.filter(c => !isLaundryBranch || (c.division || 'coffee') === selectedDivision).map(c => (
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

              {/* Placed Search Bar */}
              <div className="relative w-full sm:w-60 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-250 transition-all outline-none text-xs min-h-[30px] font-semibold font-sans"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-auto p-4 md:p-5 custom-scrollbar bg-slate-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 2xl:grid-cols-8 gap-3">
                {filteredProducts.map(product => {
                  const isLocked = product.stock <= 0;
                  const isPisoPromo = product.name.toLowerCase().includes('piso promo') || product.name.toLowerCase().includes('piso sale');
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={isLocked}
                      className={cn(
                        "bg-white rounded-xl shadow-sm border transition-all text-left flex flex-col group relative active:scale-[0.97] overflow-hidden",
                        isLocked
                          ? "opacity-60 border-slate-200 bg-slate-50/50 hover:border-slate-200 hover:shadow-sm cursor-not-allowed"
                          : isPisoPromo
                            ? "border-amber-400 bg-amber-50/15 hover:border-amber-500 hover:shadow-md ring-1 ring-amber-400/30"
                            : "border-slate-200 hover:border-emerald-500 hover:shadow-lg"
                      )}
                    >
                      {/* Product Image */}
                      <div className="w-full h-16 md:h-20 overflow-hidden bg-slate-50 border-b border-slate-100 relative flex items-center justify-center">
                        <img
                          src={(product as any).image_url || `/${product.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}.jpg`}
                          onError={(e) => {
                            const imgTarget = e.currentTarget as HTMLImageElement;
                            imgTarget.style.display = 'none';
                          }}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 absolute inset-0 z-10"
                        />
                        <div className="text-slate-300 flex flex-col items-center justify-center p-1">
                          <Package size={14} strokeWidth={1.5} className="text-slate-400/80 mb-0.5" />
                          <span className="text-[6px] font-black uppercase tracking-widest text-slate-400/60 leading-none">No Picture</span>
                        </div>

                        {/* Piso Promo Badge Overlay */}
                        {isPisoPromo && (
                          <div className="absolute top-1.5 right-1.5 z-20">
                            <span className="bg-gradient-to-r from-red-500 to-amber-500 text-white px-1.5 py-0.5 rounded text-[6.5px] font-black uppercase shadow-xs tracking-wider animate-pulse border border-red-400">
                              PISO PROMO
                            </span>
                          </div>
                        )}

                        {/* Stock Badge Overlay */}
                        <div className="absolute top-1.5 left-1.5 z-20">
                          <span className={cn(
                            "px-1 py-0.2 rounded text-[6px] font-black uppercase shadow-xs border backdrop-blur-xs",
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
                              <Plus size={8} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[7.5px] font-bold text-emerald-600 uppercase tracking-tighter block opacity-80 leading-none mb-1">{product.category_name}</span>
                          <h3 className={cn(
                            "font-bold text-slate-900 leading-tight text-[9.5px] md:text-[10.5px] line-clamp-2",
                            isLocked ? "text-slate-500" : "group-hover:text-emerald-700"
                          )}>{product.name}</h3>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-slate-55 flex justify-between items-center">
                          <span className="text-[9px] md:text-[10px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-md">₱{product.price.toFixed(2)}</span>
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


              {/* Cart Items */}
              <div className="flex-1 overflow-auto p-4 space-y-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <ShoppingCart size={48} className="mb-4 opacity-20" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  [...cart].reverse().map((item, idx) => {
                    const isExpanded = expandedCartItemId === item.id;
                    return (
                      <div
                        key={item._isSaved ? `saved-${item.id}-${idx}` : item.id}
                        className="flex flex-col gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-150 hover:border-slate-200 transition-all font-sans shadow-2xs"
                      >
                        <div className="flex gap-2.5 items-center">
                          {/* Clickable Info Area */}
                          <button
                            onClick={() => !item._isSaved && setExpandedCartItemId(isExpanded ? null : item.id)}
                            className="flex-1 text-left flex flex-col min-w-0"
                            type="button"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h4 className="font-extrabold text-slate-800 text-[13.5px] truncate flex-1 leading-tight">{item.name}</h4>
                              {!item._isSaved && (
                                <span className="text-[10px] text-slate-450 font-bold shrink-0 ml-1">
                                  {isExpanded ? '▲ hide' : '▼ edit'}
                                </span>
                              )}
                            </div>
                            {item.notes && item.notes.replace(/\[DISCOUNT:.*?\]/g, '').replace(/\[COMPLIMENTARY:.*?\]/g, '').trim() !== '' && (
                              <div className="mt-1">
                                <span className="text-[9.5px] text-slate-550 font-bold bg-slate-100 rounded px-1.5 py-0.5 border border-slate-200">
                                  {item.notes.replace(/\[DISCOUNT:.*?\]/g, '').replace(/\[COMPLIMENTARY:.*?\]/g, '').trim()}
                                </span>
                              </div>
                            )}
                            <p className="text-blue-650 font-black text-[13px] font-mono mt-1 leading-none">
                              ₱{(item.price * item.quantity).toFixed(2)}
                              {item.quantity > 1 && (
                                <span className="text-[10px] text-slate-500 font-normal ml-1.5">
                                  (₱{item.price.toFixed(2)} ea)
                                </span>
                              )}
                            </p>
                            {item._isSaved && <span className="text-[8.5px] font-bold text-indigo-600 uppercase tracking-wider mt-1 leading-none">Ordered</span>}
                          </button>

                          {/* Quantity Stepper */}
                          {!item._isSaved ? (
                            <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs shrink-0">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1 hover:bg-slate-100 rounded-md text-slate-600 min-w-[24px] min-h-[24px] flex items-center justify-center bg-slate-50 border border-slate-200"
                                type="button"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="w-5 text-center font-extrabold text-xs text-slate-800">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                disabled={item.name.toLowerCase().includes('piso promo') || item.name.toLowerCase().includes('piso sale')}
                                className={cn(
                                  "p-1 hover:bg-slate-100 rounded-md text-slate-600 min-w-[24px] min-h-[24px] flex items-center justify-center bg-slate-50 border border-slate-200",
                                  (item.name.toLowerCase().includes('piso promo') || item.name.toLowerCase().includes('piso sale')) && "opacity-40 cursor-not-allowed"
                                )}
                                type="button"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          ) : (
                            <div className="text-slate-600 font-black text-[11px] px-2.5 shrink-0 select-none bg-slate-200/60 rounded-lg py-1">{item.quantity}x</div>
                          )}

                          {/* Trash Button */}
                          {!item._isSaved && (
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1.5 text-rose-500 bg-rose-50/50 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100 shrink-0 min-w-[28px] min-h-[28px] flex items-center justify-center"
                              type="button"
                            >
                              <Trash2 size={13} />
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
                            <div className="flex gap-2 items-center hidden">
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
                <div className="hidden">
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
                      {/* Menu Total (VAT Inclusive) hidden */}
                      <div className="flex justify-between text-slate-500 hidden">
                        <span>Menu Total (VAT Inclusive)</span>
                        <span>₱{subtotal.toFixed(2)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-amber-600">
                          <span>Discount ({selectedDiscount?.name})</span>
                          <span>-₱{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {/* VAT (12%) hidden */}
                      <div className="flex justify-between text-slate-500 hidden">
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
                        {isProcessingPayment ? 'Processing...' : 'Add Product'}
                      </button>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Payment Method</label>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <button
                          type="button"
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
                          type="button"
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
                          type="button"
                          onClick={() => { setPaymentMethod('maya'); setSelectedStoreCredit(null); }}
                          className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                            paymentMethod === 'maya' ? "bg-emerald-500 text-white border-emerald-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          <Smartphone size={18} />
                          <span className="text-[10px] font-bold mt-1">Maya</span>
                        </button>
                      </div>

                      {paymentMethod !== 'cash' && (
                        <div className="mb-3">
                          <input
                            type="text"
                            placeholder="Reference Number"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none font-bold text-sm"
                          />
                        </div>
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
        </>
      )}

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
                  .printable-area .printable-area-hidden,
                  .printable-area [data-print-hidden="true"] {
                    display: none !important;
                    visibility: hidden !important;
                  }
                  .printable-area {\r\n                    position: absolute !important;
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

            {['customer'].map((type, index) => {
              const rawSubtotal = receiptData.items?.reduce((sum: number, item: any) => sum + (item.is_complimentary ? 0 : ((item.price || 0) * (item.quantity || 1))), 0) || 0;
              const displaySubtotal = rawSubtotal > 0 ? rawSubtotal : (receiptData.subtotal || 0);
              const calcTotal = Math.max(0, displaySubtotal - (receiptData.discount_amount || 0));

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
                  <div key={type} className={cn("relative print:relative text-black receipt-ticket-content", index > 0 && "border-t border-dashed border-black pt-4 mt-4")}>
                    {receiptData.status === 'voided' && (
                      <div className="void-watermark select-none pointer-events-none">VOID</div>
                    )}

                    {/* Company Details */}
                    <div className="text-center section-block">
                      <p className="company-name font-black text-sm uppercase">{laundryDetails.company_name || 'SIP & SPIN LAUNDRY SHOP'}</p>
                      <p className="text-[9.5pt]">{settings?.address || 'Laundry Shop Address'}</p>
                      {/* <p className="text-[9.5pt] hidden">TIN: {settings?.tin || '899-352-898-00000'}</p> */}
                    </div>

                    <div className="text-center section-block pt-1.5 pb-1">
                      <p className="receipt-title font-bold text-[11pt] border-y border-dashed border-black py-0.5">
                        {receiptData.status === 'voided' ? 'VOIDED LAUNDRY RECEIPT' : 'LAUNDRY RECEIPT'}
                      </p>
                    </div>

                    <div className="section-block pt-1 font-mono text-[9.5pt]">
                      <div className="flex justify-between row-item">
                        <span>Receipt No: #{(receiptData.receipt_number || receiptData.id)}</span>
                        <span className="text-right">{new Date(receiptData.created_at || receiptData.updated_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }).replace(',', '')}</span>
                      </div>
                      <div className="flex justify-between row-item">
                        <span className="truncate max-w-[100%]">Cashier: {receiptData.cashier_name || 'Staff'}</span>
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
                      {laundryDetails.services && laundryDetails.services.length > 0 ? (
                        <div className="space-y-1.5 border-b border-dashed border-black pb-1.5 mb-1.5">
                          <div className="text-[8.5pt] font-bold uppercase tracking-wider mb-1">Services List</div>
                          {laundryDetails.services.map((item: any, idx: number) => (
                            <div key={idx} className="text-[9pt]">
                              <div className="flex justify-between row-item font-bold">
                                <span className="truncate max-w-[75%]">{item.name}</span>
                                <span>₱{item.subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between row-item text-[8pt] text-slate-700 pl-1.5 font-mono">
                                <span>
                                  Qty/Weight: {item.weight.toFixed(1)} kg
                                  {item.isPromo5Plus2 && item.freeKilos > 0 && ` (${item.freeKilos.toFixed(1)}kg Free)`}
                                </span>
                                <span>Rate: ₱{item.price.toFixed(2)}/kg</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : laundryDetails.subtotal > 0 ? (
                        <>
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
                        </>
                      ) : null}
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
                      <div className="flex justify-between row-item font-black text-[16pt] pt-1">
                        <span>TOTAL</span>
                        <span>₱{(receiptData.total || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between row-item text-[9.5pt]">
                        <span>Payment Method:</span>
                        <span className="uppercase font-bold">{receiptData.payment_method || 'CASH'}</span>
                      </div>
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
                <div key={type} className={cn("relative print:relative receipt-ticket-content", index > 0 && "border-t border-dashed border-black pt-4 mt-4")}>
                  {/* VOID Watermark overlay */}
                  {receiptData.status === 'voided' && (
                    <div className="void-watermark select-none pointer-events-none">VOID</div>
                  )}



                  {/* Company Details */}
                  <div className="text-center section-block">
                    <div className="flex justify-center mb-1 text-center">
                      {!isLaundryBranch && <img src="/logo.png" alt="Logo" className="receipt-logo" />}
                    </div>
                    <p className="company-name">{settings?.company_name || 'ESPRESSO YOURSELF & TEA HOUSE'}</p>
                    <p>{settings?.address || 'Room 1 Crown Bldg., North Road 6, Mabolo, Cebu City'}</p>
                    {/* <p className="hidden print:hidden" data-print-hidden="true">TIN: {settings?.tin || '899-352-898-00000'}</p> */}
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

                  <div className="section-block pt-1 text-[9.5pt]">
                    <div className="flex justify-between row-item">
                      <span>Invoice: {receiptData.receipt_number !== undefined && receiptData.receipt_number !== null ? `INV-${receiptData.receipt_number.toString().padStart(6, '0')}` : 'PENDING'}</span>
                      <span className="text-right">{new Date(receiptData.created_at || receiptData.updated_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }).replace(',', '')}</span>
                    </div>
                    <div className="flex justify-between row-item">
                      <span>Order: #{(receiptData.order_number || receiptData.id).toString().padStart(6, '0')}</span>
                      <span className="text-right truncate max-w-[50%]">Cashier: {receiptData.cashier_name || 'Staff'}</span>
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
                      <span>₱{calcTotal.toFixed(2)}</span>
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

                  {/* VAT Breakdown - always hidden from printed receipts */}
                  {/* <div className="section-block pt-1 hidden print:hidden" data-print-hidden="true">
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
            })}

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
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="browser">Browser Print dialog</option>
                  <option value="qz">Direct print (QZ Tray)</option>
                </select>
              </div>

              {useQzTray && (
                <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-650">Printer Name:</span>
                    <input
                      type="text"
                      value={qzPrinterName}
                      onChange={e => {
                        setQzPrinterName(e.target.value);
                        localStorage.setItem('qz_printer_name', e.target.value);
                      }}
                      placeholder="e.g. POS-80"
                      className="w-40 px-2 py-0.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Connection Status:</span>
                    {qzConnected ? (
                      <span className="text-emerald-650 font-bold flex items-center gap-1">🟢 Connected</span>
                    ) : qzError ? (
                      <span className="text-rose-500 font-bold cursor-pointer" title={qzError}>🔴 Disconnected</span>
                    ) : (
                      <span className="text-amber-500 font-bold animate-pulse">🟡 Connecting...</span>
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

            {isLaundryBranch && (
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 print:hidden text-xs font-sans">
                <button
                  type="button"
                  onClick={() => setZReadingFilter('all')}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg font-bold transition-all",
                    zReadingFilter === 'all' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Combined
                </button>
                <button
                  type="button"
                  onClick={() => setZReadingFilter('coffee')}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg font-bold transition-all",
                    zReadingFilter === 'coffee' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Coffee Shop
                </button>
                <button
                  type="button"
                  onClick={() => setZReadingFilter('laundry')}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg font-bold transition-all",
                    zReadingFilter === 'laundry' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Laundry
                </button>
              </div>
            )}

            <div className="text-center mb-4 print:mb-2 text-slate-800">
              <p className="mb-2 font-black text-lg receipt-title">
                {zReadingFilter === 'coffee' ? 'COFFEE SHOP SALES REPORT' :
                  zReadingFilter === 'laundry' ? 'LAUNDRY SHOP SALES REPORT' :
                    'X-READING / Z-READING'}
              </p>
              <br className="print:hidden" />
              <p className="font-black company-name">
                {zReadingFilter === 'laundry' ? 'SIP & SPIN LAUNDRY SHOP' : (settings?.company_name || 'ESPRESSO YOURSELF & TEA HOUSE')}
              </p>
              <p>{settings?.address || 'Room 1 Crown Bldg North road 6, North Reclamation Area Mabolo Cebu City'}</p>
              {/* <p className="hidden">TIN: {settings?.tin || '899-352-898-00000'}</p> */}
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
                <span>₱{(
                  zReadingFilter === 'coffee' ? (zReadingData?.summary?.coffee_sales_total || 0) :
                    zReadingFilter === 'laundry' ? (zReadingData?.summary?.laundry_sales_total || 0) :
                      (zReadingData?.summary?.gross_sales || 0)
                ).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Regular Discount:</span>
                <span>₱{(
                  zReadingFilter === 'laundry' ? 0 :
                    (zReadingData?.summary?.total_discounts || 0)
                ).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge:</span>
                <span>₱{(
                  zReadingFilter === 'laundry' ? 0 :
                    (zReadingData?.summary?.total_service_charge || 0)
                ).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black mt-1">
                <span>Net Sales:</span>
                <span>₱{(
                  zReadingFilter === 'coffee' ? (zReadingData?.summary?.coffee_sales_total || 0) - (zReadingData?.summary?.total_discounts || 0) :
                    zReadingFilter === 'laundry' ? (zReadingData?.summary?.laundry_sales_total || 0) :
                      (zReadingData?.summary?.total_sales || 0)
                ).toFixed(2)}</span>
              </div>

              {zReadingFilter === 'all' && (
                <>
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
                </>
              )}
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

      {/* Shift Management Modal — hidden for laundry branch */}
      {showShiftModal && !isLaundryBranch && (
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
                        {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && selectedModalOrder.status === 'open' && (
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

      {/* ================= DRINK CUSTOMIZATION MODAL ================= */}
      {customizingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full border border-slate-100 flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="border-b border-slate-100 pb-3 mb-4 text-center">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">{customizingProduct.name}</h2>
              <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Customize Beverage</span>
            </div>

            {/* Customization Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar text-xs">

              {/* Size */}
              <div>
                <label className="text-[10px] font-black text-slate-700 block mb-1.5 uppercase tracking-wider">Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Small (12 oz)', 'Medium (16 oz)', 'Large (22 oz)'] as const).map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setCustomSize(sz)}
                      className={cn(
                        "py-2 px-2 text-center rounded-xl border text-[11px] transition-all font-bold",
                        customSize === sz
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100/50"
                      )}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugar Level */}
              <div>
                <label className="text-[10px] font-black text-slate-700 block mb-1.5 uppercase tracking-wider">Sugar Level</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['0%', '25%', '50%', '75%', '100%'] as const).map(sug => {
                    const labelMap = { '0%': 'No', '25%': '25%', '50%': '50%', '75%': '75%', '100%': '100%' };
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setCustomSugar(sug)}
                        className={cn(
                          "py-2 px-1 text-center rounded-xl border text-[10px] transition-all font-bold",
                          customSugar === sug
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100/50"
                        )}
                      >
                        {labelMap[sug]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ice Level */}
              <div>
                <label className="text-[10px] font-black text-slate-700 block mb-1.5 uppercase tracking-wider">Ice Level</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['No Ice', '25%', '50%', '75%', '100%'] as const).map(iceOpt => (
                    <button
                      key={iceOpt}
                      type="button"
                      onClick={() => setCustomIce(iceOpt)}
                      className={cn(
                        "py-2 px-1 text-center rounded-xl border text-[10px] transition-all font-bold",
                        customIce === iceOpt
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100/50"
                      )}
                    >
                      {iceOpt.replace(' Ice', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Espresso Shot */}
              <div>
                <label className="text-[10px] font-black text-slate-700 block mb-1.5 uppercase tracking-wider">Espresso Shot</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Regular', '+1 Shot', '+2 Shots'] as const).map(sh => {
                    const priceLabel = sh === '+1 Shot' ? ' (+₱30)' : sh === '+2 Shots' ? ' (+₱60)' : '';
                    return (
                      <button
                        key={sh}
                        type="button"
                        onClick={() => setCustomEspresso(sh)}
                        className={cn(
                          "py-2 px-2 text-center rounded-xl border text-[10px] transition-all font-bold",
                          customEspresso === sh
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100/50"
                        )}
                      >
                        {sh}{priceLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Milk Options */}
              <div>
                <label className="text-[10px] font-black text-slate-700 block mb-1.5 uppercase tracking-wider">Milk Options</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Whole Milk', 'Oat Milk', 'Soy Milk', 'Almond Milk'] as const).map(mk => {
                    const extraPrice = mk === 'Oat Milk' || mk === 'Soy Milk' ? 20 : mk === 'Almond Milk' ? 30 : 0;
                    const priceLabel = extraPrice > 0 ? ` (+₱${extraPrice})` : '';
                    return (
                      <button
                        key={mk}
                        type="button"
                        onClick={() => setCustomMilk(mk)}
                        className={cn(
                          "py-2.5 px-3 text-left rounded-xl border text-[10px] transition-all font-bold flex justify-between items-center",
                          customMilk === mk
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100/50"
                        )}
                      >
                        <span>{mk}</span>
                        <span className="opacity-80 text-[9px]">{priceLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toppings / Add-ons */}
              <div>
                <label className="text-[10px] font-black text-slate-700 block mb-1.5 uppercase tracking-wider">Toppings / Add-ons</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Whipped Cream', name: 'Whipped Cream', price: 20 },
                    { id: 'Caramel Drizzle', name: 'Caramel Drizzle', price: 15 },
                    { id: 'Chocolate Syrup', name: 'Chocolate Syrup', price: 15 },
                    { id: 'Pearl', name: 'Pearl', price: 20 },
                    { id: 'Coffee Jelly', name: 'Coffee Jelly', price: 20 }
                  ].map(tp => {
                    const isChecked = customAddons.includes(tp.id);
                    return (
                      <label
                        key={tp.id}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xl border text-[10px] font-bold cursor-pointer transition-all select-none",
                          isChecked
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCustomAddons([...customAddons, tp.id]);
                              } else {
                                setCustomAddons(customAddons.filter(a => a !== tp.id));
                              }
                            }}
                            className="hidden"
                          />
                          <div className={cn(
                            "w-3.5 h-3.5 border rounded flex items-center justify-center transition-all",
                            isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"
                          )}>
                            {isChecked && <Check size={10} strokeWidth={3} />}
                          </div>
                          <span>{tp.name}</span>
                        </div>
                        <span className="text-[9px] opacity-80">+₱{tp.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="text-[10px] font-black text-slate-700 block mb-1.5 uppercase tracking-wider">Special Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. extra hot, less sweet, no foam..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl outline-none text-xs font-semibold focus:bg-white focus:border-emerald-500 transition-all font-sans"
                />
              </div>

            </div>

            {/* Footer Summary & Action buttons */}
            <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider leading-none">Total Price</span>
                <span className="text-lg font-black text-emerald-600 font-mono">
                  ₱{(
                    customizingProduct.price +
                    (customEspresso === '+1 Shot' ? 30 : customEspresso === '+2 Shots' ? 60 : 0) +
                    (customMilk === 'Oat Milk' || customMilk === 'Soy Milk' ? 20 : customMilk === 'Almond Milk' ? 30 : 0) +
                    customAddons.reduce((sum, item) => sum + (item.includes('Caramel') || item.includes('Chocolate') ? 15 : 20), 0)
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCustomizingProduct(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wide transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const extraPrice =
                      (customEspresso === '+1 Shot' ? 30 : customEspresso === '+2 Shots' ? 60 : 0) +
                      (customMilk === 'Oat Milk' || customMilk === 'Soy Milk' ? 20 : customMilk === 'Almond Milk' ? 30 : 0) +
                      customAddons.reduce((sum, item) => sum + (item.includes('Caramel') || item.includes('Chocolate') ? 15 : 20), 0);

                    const adjustedPrice = customizingProduct.price + extraPrice;

                    // Compile bullet instructions notes
                    const sizeShort = customSize.includes('12 oz') ? '12 oz' : customSize.includes('16 oz') ? '16 oz' : '22 oz';
                    let bulletNotes = `(${sizeShort})`;
                    bulletNotes += ` • Sugar: ${customSugar}`;
                    bulletNotes += ` • Ice: ${customIce}`;

                    if (customEspresso !== 'Regular') {
                      bulletNotes += ` • ${customEspresso} Shot`;
                    }
                    if (customMilk !== 'Whole Milk') {
                      bulletNotes += ` • ${customMilk}`;
                    }
                    customAddons.forEach(addon => {
                      bulletNotes += ` • ${addon}`;
                    });
                    if (customInstructions.trim()) {
                      bulletNotes += ` • Inst: ${customInstructions.trim()}`;
                    }

                    setCart(prev => {
                      const existingUnsavedIndex = prev.findIndex(item => item.id === customizingProduct.id && !item._isSaved && item.notes === bulletNotes);
                      if (existingUnsavedIndex >= 0) {
                        const newCart = [...prev];
                        newCart[existingUnsavedIndex] = {
                          ...newCart[existingUnsavedIndex],
                          quantity: newCart[existingUnsavedIndex].quantity + 1
                        };
                        return newCart;
                      }
                      return [...prev, { ...customizingProduct, price: adjustedPrice, quantity: 1, notes: bulletNotes, _isSaved: false }];
                    });

                    setCustomizingProduct(null);
                  }}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md uppercase tracking-wide transition-all active:scale-[0.98]"
                >
                  Add to Order
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
