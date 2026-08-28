import React, { useEffect, useState } from 'react';
import {
  PackagePlus,
  PackageMinus,
  RefreshCw,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  X,
  List,
  MapPin,
  ArrowLeftRight,
  TrendingUp,
  ClipboardCheck,
  Filter,
  Search,
  Calendar,
  Check,
  AlertTriangle,
  FileText,
  ChevronRight,
  Info,
  UploadCloud,
  Package
} from 'lucide-react';
import { cn } from '../App';
import { useBranch } from '../BranchContext';
import { useSettings } from '../SettingsContext';
import { logActivity } from '../lib/audit';
import { swalAlert, swalConfirm } from '../lib/swal';
import { getProductImage } from './POS';

type Category = { id: number; name: string };
type Product = { id: number; name: string; stock: number; category_name: string; category_id: number; cost: number; price: number; division?: string };

type TabType = 'active_stocks' | 'warehouses' | 'in_out_reports' | 'fast_moving' | 'cycle_counts';

export default function Inventory() {
  const { activeBranch } = useBranch();
  const { settings, refreshSettings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('active_stocks');
  const [selectedDivision, setSelectedDivision] = useState<'coffee' | 'laundry'>('coffee');
  const isLaundryBranch = activeBranch?.name.toLowerCase().includes('laundry') || activeBranch?.name.toLowerCase().includes('s1p') || activeBranch?.name.toLowerCase().includes('spin');
  const [isTogglingStrict, setIsTogglingStrict] = useState(false);

  const handleToggleStrictLock = async () => {
    if (!settings) return;
    setIsTogglingStrict(true);
    const updatedSettings = {
      ...settings,
      strict_item_locked: !settings.strict_item_locked
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      if (res.ok) {
        const activeUser = JSON.parse(localStorage.getItem('resto_active_user') || '{}');
        logActivity(
          activeUser.full_name || activeUser.username || 'Staff',
          'Toggle Stock Strict Lock',
          `Turned strict out-of-stock item lock ${!settings.strict_item_locked ? 'ON' : 'OFF'}`
        );
        refreshSettings();
      } else {
        swalAlert('Error', 'Failed to save strict lock setting.', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTogglingStrict(false);
    }
  };

  // Loaders
  const [isDataLoading, setIsDataLoading] = useState(false);

  // States for Transaction Panel
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transactionType, setTransactionType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');

  // States for Edit / Add Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDivision, setNewCategoryDivision] = useState<'coffee' | 'laundry'>('coffee');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', cost: '', price: '', category_id: '', stock: '', is_sellable: '1', unit: 'pcs', received_date: '', expire_date: '', no_expiry: true });
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeProduct, setRecipeProduct] = useState<Product | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<{ ingredient_id: number; quantity: number }[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('1');

  // Warehouse and Transfers states removed

  // === PAGINATION STATES ===
  const [productsPage, setProductsPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);
  const [fastMovingPage, setFastMovingPage] = useState(1);
  const [cycleCountsPage, setCycleCountsPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // === NEW STATES FOR IN & OUT REPORTS ===
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reportsFilterType, setReportsFilterType] = useState<'all' | 'in' | 'out' | 'adjustment'>('all');
  const [reportsSearch, setReportsSearch] = useState('');

  // === NEW STATES FOR CYCLE COUNTS ===
  const [cycleCounts, setCycleCounts] = useState<any[]>([]);
  const [isCreatingCycleCount, setIsCreatingCycleCount] = useState(false);
  const [cycleCountTitle, setCycleCountTitle] = useState('');
  const [cycleCountRemarks, setCycleCountRemarks] = useState('');
  const [cycleCountCommit, setCycleCountCommit] = useState(true);
  const [cycleCountItems, setCycleCountItems] = useState<Record<number, number>>({}); // product_id -> actual count
  const [cycleCountFilterCategory, setCycleCountFilterCategory] = useState<string>('all');
  const [selectedCycleCountDetail, setSelectedCycleCountDetail] = useState<any | null>(null);

  useEffect(() => {
    setProductsPage(1);
  }, [searchQuery, selectedDivision]);

  useEffect(() => {
    setReportsPage(1);
  }, [reportsSearch, reportsFilterType]);

  useEffect(() => {
    setProductsPage(1);
    setReportsPage(1);
    setFastMovingPage(1);
    setCycleCountsPage(1);
  }, [activeTab]);

  const fetchData = async () => {
    if (!activeBranch) return;
    setIsDataLoading(true);
    try {
      const [invRes, catRes] = await Promise.all([
        fetch(`/api/inventory?branch_id=${activeBranch.id}`),
        fetch(`/api/categories?branch_id=${activeBranch.id}`)
      ]);
      if (invRes.ok) {
        const data = await invRes.json();
        const uniqueProducts = data.filter((p: Product, i: number, self: Product[]) =>
          self.findIndex(t => t.id === p.id) === i
        );
        setProducts(uniqueProducts);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData || []);
      }

      // Fetch details
      const [txRes, ccRes] = await Promise.all([
        fetch(`/api/inventory/transactions?branch_id=${activeBranch.id}`),
        fetch('/api/cycle-counts')
      ]);

      if (txRes.ok) setTransactions(await txRes.json());
      if (ccRes.ok) setCycleCounts(await ccRes.json());

    } catch (e) {
      console.error('Error fetching inventory data', e);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    setSelectedDivision('coffee');
    fetchData();
  }, [activeBranch]);

  // Handle standard stock transactions
  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) return;

    const res = await fetch('/api/inventory/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: selectedProduct.id,
        type: transactionType,
        quantity: parseFloat(quantity),
        remarks
      })
    });

    if (res.ok) {
      const user = JSON.parse(localStorage.getItem('resto_active_user') || '{}');
      logActivity(user.full_name || user.username || 'Staff', 'Inventory Update', `${transactionType.toUpperCase()}: ${selectedProduct.name} x ${quantity}. Remarks: ${remarks || 'None'}`);

      setSelectedProduct(null);
      setQuantity('');
      setRemarks('');
      fetchData();
    }
  };

  // Create/Edit main product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBranch) return;

    let imageUrl = editingProduct ? (editingProduct as any).image_url : null;

    if (uploadedImageBase64 && uploadedImageBase64.startsWith('data:image/')) {
      try {
        const uploadRes = await fetch('/api/products/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            base64Image: uploadedImageBase64
          })
        });
        if (uploadRes.ok) {
          const uploadResult = await uploadRes.json();
          imageUrl = uploadResult.url;
        }
      } catch (uploadErr) {
        console.error('Failed to upload image:', uploadErr);
      }
    } else if (uploadedImageBase64 === null) {
      imageUrl = null;
    }

    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    const selectedCat = categories.find(c => c.id === parseInt(formData.category_id));
    const isService = selectedDivision === 'laundry' && 
      selectedCat && 
      !['detergents & additives', 'add on', 'add-on', 'supplies', 'detergents', 'additives'].includes(selectedCat.name.toLowerCase());

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branch_id: activeBranch.id,
        name: formData.name,
        price: parseFloat(formData.price),
        cost: isService ? 0 : parseFloat(formData.cost || '0'),
        category_id: parseInt(formData.category_id),
        stock: isService ? 9999 : parseInt(formData.stock || '0'),
        image_url: imageUrl,
        is_sellable: parseInt(formData.is_sellable || '1'),
        unit: formData.unit || 'pcs',
        received_date: formData.received_date || null,
        expire_date: formData.no_expiry ? null : (formData.expire_date || null)
      })
    });

    if (res.ok) {
      const user = JSON.parse(localStorage.getItem('resto_active_user') || '{}');
      logActivity(user.full_name || user.username || 'Admin', editingProduct ? 'Edit Product' : 'Add Product', `${editingProduct ? 'Updated' : 'Created'} product: ${formData.name}`);
      setIsProductModalOpen(false);
      fetchData();
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const isConfirm = await swalConfirm('Are you sure you want to delete this product?');
    if (!isConfirm) return;
    const productToDelete = products.find(p => p.id === id);
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const user = JSON.parse(localStorage.getItem('resto_active_user') || '{}');
      logActivity(user.full_name || user.username || 'Admin', 'Delete Product', `Deleted product: ${productToDelete?.name || id}`);
      if (selectedProduct?.id === id) setSelectedProduct(null);
      fetchData();
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setUploadedImageBase64(null);
    const firstCatOfDivision = categories.find(c => c.division === selectedDivision);
    const todayStr = new Date().toISOString().split('T')[0];
    setFormData({
      name: '',
      cost: '',
      price: '',
      category_id: firstCatOfDivision?.id.toString() || categories[0]?.id.toString() || '',
      stock: '0',
      is_sellable: '1',
      unit: 'pcs',
      received_date: todayStr,
      expire_date: '',
      no_expiry: true
    });
    setIsProductModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setUploadedImageBase64((product as any).image_url || null);
    const pAny = product as any;
    const recDate = pAny.received_date ? new Date(pAny.received_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const expDate = pAny.expire_date ? new Date(pAny.expire_date).toISOString().split('T')[0] : '';
    setFormData({
      name: product.name,
      cost: product.cost.toString(),
      price: product.price.toString(),
      category_id: product.category_id?.toString() || '',
      stock: (product.stock || 0).toString(),
      is_sellable: pAny.is_sellable !== 0 ? '1' : '0',
      unit: pAny.unit || 'pcs',
      received_date: recDate,
      expire_date: expDate,
      no_expiry: !pAny.expire_date
    });
    setIsProductModalOpen(true);
  };

  const openRecipeModal = async (product: Product) => {
    setRecipeProduct(product);
    setSelectedIngredientId('');
    setIngredientQuantity('1');
    try {
      const res = await fetch(`/api/products/${product.id}/recipe`);
      if (res.ok) {
        const data = await res.json();
        setRecipeIngredients(data.map((item: any) => ({
          ingredient_id: item.ingredient_id,
          quantity: item.quantity
        })));
      }
    } catch (err) {
      console.error('Failed to load recipe:', err);
    }
    setIsRecipeModalOpen(true);
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeProduct) return;

    const res = await fetch(`/api/products/${recipeProduct.id}/recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients: recipeIngredients
      })
    });

    if (res.ok) {
      swalAlert('Recipe Saved', `Ingredients recipe for ${recipeProduct.name} saved successfully!`, 'success');
      setIsRecipeModalOpen(false);
    } else {
      swalAlert('Error', 'Failed to save ingredients recipe', 'error');
    }
  };

  // Category management
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName, division: newCategoryDivision, branch_id: activeBranch?.id })
    });
    if (res.ok) {
      setNewCategoryName('');
      setNewCategoryDivision('coffee');
      fetchData();
    } else {
      const data = await res.json();
      swalAlert('Error', data.error || 'Failed to add category', 'error');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const isConfirm = await swalConfirm('Are you sure you want to delete this category?');
    if (!isConfirm) return;
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchData();
    } else {
      const data = await res.json();
      swalAlert('Error', data.error || 'Failed to delete category', 'error');
    }
  };

  // Warehouse logic handlers removed

  // === CYCLE COUNT LOGIC HANDLERS ===
  const startNewCycleCount = () => {
    const initialCounts: Record<number, number> = {};
    products.forEach(p => {
      initialCounts[p.id] = p.stock || 0;
    });
    setCycleCountItems(initialCounts);
    setCycleCountTitle(`Cycle Count Audit - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
    setCycleCountRemarks('');
    setCycleCountCommit(true);
    setIsCreatingCycleCount(true);
  };

  const handleSubmitCycleCount = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeUser = JSON.parse(localStorage.getItem('resto_active_user') || '{}');

    // Build the count items list
    const itemsToLog = products
      .filter(p => cycleCountFilterCategory === 'all' || p.category_id.toString() === cycleCountFilterCategory)
      .map(p => {
        const actual = cycleCountItems[p.id] !== undefined ? cycleCountItems[p.id] : (p.stock || 0);
        return {
          product_id: p.id,
          name: p.name,
          expected: p.stock || 0,
          actual: actual,
          discrepancy: actual - (p.stock || 0)
        };
      });

    const res = await fetch('/api/cycle-counts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: cycleCountTitle,
        remarks: cycleCountRemarks,
        user: activeUser.full_name || activeUser.username || 'Staff/Auditor',
        items: itemsToLog,
        commit_to_main: cycleCountCommit
      })
    });

    if (res.ok) {
      logActivity(
        activeUser.full_name || activeUser.username || 'Auditor',
        'Cycle Count Submitted',
        `Submitted "${cycleCountTitle}". Status: ${cycleCountCommit ? 'Stocks Adjusted to Hand Count' : 'Calculated Audit Record Only'}`
      );
      setIsCreatingCycleCount(false);
      fetchData();
    } else {
      swalAlert('Audit Failed', 'Failed to save cycle count audit', 'error');
    }
  };

  const getFastMovingItems = () => {
    const countsMap: Record<number, { product: Product; count: number }> = {};

    products.forEach(p => {
      countsMap[p.id] = { product: p, count: 0 };
    });

    transactions.forEach(tx => {
      if (tx.type === 'out') {
        const id = tx.product_id;
        if (countsMap[id]) {
          countsMap[id].count += (tx.quantity || 1);
        }
      }
    });

    // Convert to sorted array
    const sorted = Object.values(countsMap).sort((a, b) => b.count - a.count);
    return sorted;
  };

  // Filtering for stocks
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && (!isLaundryBranch || (p.division || 'coffee') === selectedDivision));

  // Paginated Products
  const productsStartIdx = (productsPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(productsStartIdx, productsStartIdx + ITEMS_PER_PAGE);
  const totalProductsPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const selectedCat = categories.find(c => c.id === parseInt(formData.category_id));
  const isServiceCategory = selectedDivision === 'laundry' && 
    selectedCat && 
    !['detergents & additives', 'add on', 'add-on', 'supplies', 'detergents', 'additives'].includes(selectedCat.name.toLowerCase());

  // Filtering for transaction reports
  const filteredReports = transactions.filter(tx => {
    const matchesType = reportsFilterType === 'all' || tx.type === reportsFilterType;
    const productName = tx.products?.name || tx.product_name || 'Unknown Product';
    const matchesSearch = productName.toLowerCase().includes(reportsSearch.toLowerCase()) || (tx.remarks && tx.remarks.toLowerCase().includes(reportsSearch.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Paginated Reports
  const reportsStartIdx = (reportsPage - 1) * ITEMS_PER_PAGE;
  const paginatedReports = filteredReports.slice(reportsStartIdx, reportsStartIdx + ITEMS_PER_PAGE);
  const totalReportsPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);

  // Paginated Fast Moving Items
  const fastMovingItems = getFastMovingItems();
  const fastMovingStartIdx = (fastMovingPage - 1) * ITEMS_PER_PAGE;
  const paginatedFastMoving = fastMovingItems.slice(fastMovingStartIdx, fastMovingStartIdx + ITEMS_PER_PAGE);
  const totalFastMovingPages = Math.ceil(fastMovingItems.length / ITEMS_PER_PAGE);

  // Paginated Cycle Counts
  const cycleCountsStartIdx = (cycleCountsPage - 1) * ITEMS_PER_PAGE;
  const paginatedCycleCounts = cycleCounts.slice(cycleCountsStartIdx, cycleCountsStartIdx + ITEMS_PER_PAGE);
  const totalCycleCountsPages = Math.ceil(cycleCounts.length / ITEMS_PER_PAGE);

  return (
    <div className="p-8 h-full flex flex-col bg-slate-50 relative overflow-y-auto">
      {/* Header section */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <MapPin className="text-emerald-500" /> Inventory Products
          </h1>
          <p className="text-slate-500">Manage products, stock adjustments and analytics.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Strict Item Locked Toggle */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-1.5 rounded-xl shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Strict Stock Lock</span>
              <span className="text-[11px] font-semibold text-slate-600">Lock out-of-stock items</span>
            </div>
            <button
              id="switch_strict_item_locked"
              type="button"
              disabled={isTogglingStrict}
              onClick={handleToggleStrictLock}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                settings?.strict_item_locked ? "bg-emerald-600" : "bg-slate-200",
                isTogglingStrict && "opacity-60 cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  settings?.strict_item_locked ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <button
            id="btn_manage_categories"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-xs uppercase tracking-wider shadow-sm"
          >
            Manage Categories
          </button>
          <button
            id="btn_add_product"
            onClick={openAddModal}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl transition-colors font-semibold text-xs uppercase tracking-wider shadow-sm"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Tabs list bar */}
      <div className="flex flex-wrap border-b border-slate-200 mb-6 gap-2">
        <button
          id="tab_active_stocks"
          onClick={() => { setActiveTab('active_stocks'); setIsCreatingCycleCount(false); }}
          className={cn(
            "px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 pr-5",
            activeTab === 'active_stocks' ? "border-emerald-500 text-emerald-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <List size={16} /> Active Stocks
        </button>
        {/* Warehouse and Transfers tab button removed */}
        <button
          id="tab_in_out_reports"
          onClick={() => { setActiveTab('in_out_reports'); setIsCreatingCycleCount(false); }}
          className={cn(
            "px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 pr-5",
            activeTab === 'in_out_reports' ? "border-emerald-500 text-emerald-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <RefreshCw size={16} /> In & Out Reports
        </button>
        <button
          id="tab_fast_moving"
          onClick={() => { setActiveTab('fast_moving'); setIsCreatingCycleCount(false); }}
          className={cn(
            "px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 pr-5",
            activeTab === 'fast_moving' ? "border-emerald-500 text-emerald-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <TrendingUp size={16} /> Fast Moving Items
        </button>
        <button
          id="tab_cycle_counts"
          onClick={() => { setActiveTab('cycle_counts'); }}
          className={cn(
            "px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 pr-5",
            activeTab === 'cycle_counts' ? "border-emerald-500 text-emerald-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <ClipboardCheck size={16} /> Cycle Counts
        </button>
      </div>

      {/* Main rendering area */}
      <div className="flex-1 min-h-[500px]">

        {/* ----------------- TAB: ACTIVE STOCKS (ORIGINAL FLOW UPDATED) ----------------- */}
        {activeTab === 'active_stocks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              {isLaundryBranch && (
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex gap-2 font-sans">
                  <button
                    onClick={() => setSelectedDivision('coffee')}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all active:scale-[0.97] uppercase tracking-wide min-h-[38px]",
                      selectedDivision === 'coffee'
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    Coffee Shop Supplies
                  </button>
                  <button
                    onClick={() => setSelectedDivision('laundry')}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all active:scale-[0.97] uppercase tracking-wide min-h-[38px]",
                      selectedDivision === 'laundry'
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    Laundry Supplies / Services
                  </button>
                </div>
              )}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Products Listing</span>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search active inventory..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none text-sm"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cost</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Price</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Received</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Expires</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Stock</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedProducts.map(product => (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900 text-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 relative">
                              <img
                                src={(product as any).image_url || `/${product.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}.jpg`}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                                alt={product.name}
                                className="w-full h-full object-cover absolute inset-0 z-10"
                              />
                              <Package size={14} className="text-slate-450" strokeWidth={1.5} />
                            </div>
                            <span className="truncate">{product.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 text-sm">{product.category_name}</td>
                        <td className="p-4 text-right text-slate-500 font-mono text-sm">₱{product.cost?.toFixed(2)}</td>
                        <td className="p-4 text-right text-slate-500 font-mono text-sm">₱{product.price?.toFixed(2)}</td>
                        <td className="p-4 text-center text-slate-500 text-xs font-semibold">
                          {(product as any).received_date ? new Date((product as any).received_date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : '-'}
                        </td>
                        <td className="p-4 text-center text-xs font-semibold">
                          {(product as any).expire_date ? (
                            <span className={cn(
                              "px-2 py-0.5 rounded-md",
                              new Date((product as any).expire_date).getTime() < new Date().getTime()
                                ? "bg-rose-100 text-rose-700 font-black animate-pulse"
                                : "text-slate-500"
                            )}>
                              {new Date((product as any).expire_date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No Expiry</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <span className={cn(
                            "font-bold px-3 py-1 rounded-full cursor-pointer text-xs uppercase tracking-wide inline-block shadow-sm",
                            product.stock <= 10 ? "bg-rose-50 border border-rose-200 text-rose-700" : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                          )} onClick={() => setSelectedProduct(product)} title="Click to transact stock Level">
                            {product.stock} {(product as any).unit || 'pcs'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1 justify-center">
                            {product.is_sellable !== 0 && (
                              <button
                                onClick={() => openRecipeModal(product)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Configure Ingredients Recipe (BOM)"
                              >
                                <List size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit Product Details"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400 font-medium italic">
                          No matching products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalProductsPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-slate-50/30">
                  <div className="text-xs text-slate-500 font-semibold">
                    Showing <span className="font-bold text-slate-700">{productsStartIdx + 1}</span> to{' '}
                    <span className="font-bold text-slate-700">
                      {Math.min(productsStartIdx + ITEMS_PER_PAGE, filteredProducts.length)}
                    </span>{' '}
                    of <span className="font-bold text-slate-700">{filteredProducts.length}</span> products
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setProductsPage(prev => Math.max(1, prev - 1))}
                      disabled={productsPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalProductsPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalProductsPages ||
                        Math.abs(page - productsPage) <= 1
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setProductsPage(page)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                              productsPage === page
                                ? "bg-emerald-600 text-white border-emerald-700"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            {page}
                          </button>
                        );
                      }
                      if (
                        (page === 2 && productsPage > 3) ||
                        (page === totalProductsPages - 1 && productsPage < totalProductsPages - 2)
                      ) {
                        return (
                          <span key={`prod-ellipsis-${page}`} className="px-2 py-1.5 text-xs text-slate-400 font-bold select-none">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    <button
                      onClick={() => setProductsPage(prev => Math.min(totalProductsPages, prev + 1))}
                      disabled={productsPage === totalProductsPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Transaction Panel */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-fit">
              <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-4 uppercase tracking-wider text-xs text-slate-500">Record Stock Transaction</h2>

              {selectedProduct ? (
                <form onSubmit={handleTransaction} className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 relative">
                    <button type="button" onClick={() => setSelectedProduct(null)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-1">
                      <X size={16} />
                    </button>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Selected Product</p>
                    <p className="font-extrabold text-slate-900 text-base">{selectedProduct.name}</p>
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-semibold">
                      Current DB Stock: <span className="font-bold text-emerald-600">{selectedProduct.stock} {(selectedProduct as any).unit || 'pcs'}</span>
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Transaction Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => setTransactionType('in')} className={cn("py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wider border flex flex-col items-center gap-1 transition-colors", transactionType === 'in' ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>
                        <PackagePlus size={16} /> Stock In
                      </button>
                      <button type="button" onClick={() => setTransactionType('out')} className={cn("py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wider border flex flex-col items-center gap-1 transition-colors", transactionType === 'out' ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>
                        <PackageMinus size={16} /> Stock Out
                      </button>
                      <button type="button" onClick={() => setTransactionType('adjustment')} className={cn("py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wider border flex flex-col items-center gap-1 transition-colors", transactionType === 'adjustment' ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>
                        <RefreshCw size={16} /> Adjust Stock
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                      {transactionType === 'adjustment' ? 'New absolute stock target level' : 'Quantity'}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Remarks / Notes</label>
                    <textarea
                      required
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none h-20 text-xs font-medium"
                      placeholder="e.g. Received weekly cargo, waste loss, etc..."
                    ></textarea>
                  </div>

                  <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/10 transition-all active:scale-[0.98]">
                    Commit Transaction
                  </button>
                </form>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                  <AlertCircle size={40} className="mb-3 opacity-30" />
                  <p className="text-center text-xs font-semibold leading-relaxed">
                    Click a product can stock count<br />
                    to record database ledger transact.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB: WAREHOUSES & TRANSFERS ----------------- */}
        {/* Warehouse and Transfers tab render block removed */}

        {/* ----------------- TAB: IN & OUT REPORTS ----------------- */}
        {activeTab === 'in_out_reports' && (
          <div className="space-y-6">

            {/* IN vs OUT analytics helper metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Total Records Checked</span>
                <span className="text-xl font-extrabold text-slate-800 mt-1 block">{filteredReports.length} Logs</span>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-emerald-100 bg-emerald-50/10">
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block">Total Stock-In Handled</span>
                <span className="text-xl font-extrabold text-emerald-800 mt-1 block">
                  {filteredReports.filter(tx => tx.type === 'in').reduce((sum: number, tx: any) => sum + (tx.quantity || 0), 0)} Units
                </span>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-rose-100 bg-rose-50/10">
                <span className="text-[10px] font-black uppercase text-rose-600 tracking-widest block">Total Outbound Deductions</span>
                <span className="text-xl font-extrabold text-rose-800 mt-1 block">
                  {filteredReports.filter(tx => tx.type === 'out').reduce((sum: number, tx: any) => sum + (tx.quantity || 0), 0)} Units
                </span>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-indigo-100 bg-indigo-50/10">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block">Adjustments Recorded</span>
                <span className="text-xl font-extrabold text-indigo-800 mt-1 block">
                  {filteredReports.filter(tx => tx.type === 'adjustment').length} Logs
                </span>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setReportsFilterType('all')}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
                    reportsFilterType === 'all'
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  All Transactions
                </button>
                <button
                  onClick={() => setReportsFilterType('in')}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
                    reportsFilterType === 'in'
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  Stock In Only
                </button>
                <button
                  onClick={() => setReportsFilterType('out')}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
                    reportsFilterType === 'out'
                      ? "bg-rose-600 border-rose-600 text-white shadow-sm shadow-rose-600/10"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  Stock Out Only
                </button>
                <button
                  onClick={() => setReportsFilterType('adjustment')}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
                    reportsFilterType === 'adjustment'
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/10"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  Adjustments Only
                </button>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Filter by product or remarks..."
                  value={reportsSearch}
                  onChange={(e) => setReportsSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none text-sm font-semibold"
                />
              </div>
            </div>

            {/* Reports list */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Type</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Beginning</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Quantity</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ending</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks / Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {paginatedReports.map((tx, idx) => {
                      const prodName = tx.products?.name || tx.product_name || 'Unknown Product/Legacy';
                      return (
                        <tr key={tx.id || idx} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-4 text-slate-500 font-mono text-xs">
                            {tx.created_at ? new Date(tx.created_at).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </td>
                          <td className="p-4 font-bold text-slate-900">
                            {prodName}
                            <span className="block text-[10px] text-slate-400 font-mono font-normal">ID: #{tx.product_id || 'N/A'}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                              tx.type === 'in' ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                                tx.type === 'out' ? "bg-rose-50 border-rose-200 text-rose-700" :
                                  "bg-indigo-50 border-indigo-200 text-indigo-700"
                            )}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono text-slate-500">
                            {tx.beginning_stock !== undefined ? tx.beginning_stock : '---'}
                          </td>
                          <td className={cn(
                            "p-4 text-right font-black font-mono",
                            tx.type === 'in' ? "text-emerald-600" : tx.type === 'out' ? "text-rose-600" : "text-indigo-600"
                          )}>
                            {tx.type === 'in' ? '+' : tx.type === 'out' ? '-' : ''}{tx.quantity || 0} Units
                          </td>
                          <td className="p-4 text-right font-black font-mono text-slate-800">
                            {tx.ending_stock !== undefined ? tx.ending_stock : '---'}
                          </td>
                          <td className="p-4 text-slate-600 font-medium max-w-xs truncate" title={tx.remarks}>
                            {tx.remarks || '---'}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredReports.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400 font-medium italic">
                          No transactions found on the local ledger matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalReportsPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-slate-50/30">
                  <div className="text-xs text-slate-500 font-semibold">
                    Showing <span className="font-bold text-slate-700">{reportsStartIdx + 1}</span> to{' '}
                    <span className="font-bold text-slate-700">
                      {Math.min(reportsStartIdx + ITEMS_PER_PAGE, filteredReports.length)}
                    </span>{' '}
                    of <span className="font-bold text-slate-700">{filteredReports.length}</span> logs
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setReportsPage(prev => Math.max(1, prev - 1))}
                      disabled={reportsPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalReportsPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalReportsPages ||
                        Math.abs(page - reportsPage) <= 1
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setReportsPage(page)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                              reportsPage === page
                                ? "bg-emerald-600 text-white border-emerald-700"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            {page}
                          </button>
                        );
                      }
                      if (
                        (page === 2 && reportsPage > 3) ||
                        (page === totalReportsPages - 1 && reportsPage < totalReportsPages - 2)
                      ) {
                        return (
                          <span key={`rep-ellipsis-${page}`} className="px-2 py-1.5 text-xs text-slate-400 font-bold select-none">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    <button
                      onClick={() => setReportsPage(prev => Math.min(totalReportsPages, prev + 1))}
                      disabled={reportsPage === totalReportsPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB: FAST MOVING ITEMS ----------------- */}
        {activeTab === 'fast_moving' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Top 3 highlight Bento cards */}
              {getFastMovingItems().slice(0, 3).map((item, index) => {
                const ranks = ['1st', '2nd', '3rd'];
                const rankColors = ['from-amber-100 to-yellow-50 border-yellow-200 text-yellow-800', 'from-slate-100 to-zinc-50 border-slate-200 text-slate-700', 'from-amber-50 to-orange-50 border-orange-200 text-orange-700'];
                return (
                  <div key={item.product.id} className={cn("p-5 rounded-3xl border shadow-sm bg-gradient-to-tr flex flex-col justify-between h-40", rankColors[index])}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest block">Rank {ranks[index]} Hotspot</span>
                        <h4 className="text-lg font-black mt-1">{item.product.name}</h4>
                      </div>
                      <span className="bg-white/80 backdrop-blur-md px-3 py-1 text-xs font-black rounded-xl">
                        {item.count} SOLD
                      </span>
                    </div>

                    <div className="flex justify-between items-end border-t border-black/5 pt-3">
                      <div>
                        <span className="text-[10px] block font-semibold opacity-70">Stock level</span>
                        <span className="font-extrabold text-sm">{item.product.stock} Left</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-rose-600 text-white rounded-full">
                        HIGH TURN 🔥
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* General Fast Moving Items Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Stock Turn-rate Listing</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-center">Rank</th>
                      <th className="p-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Product Name</th>
                      <th className="p-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Category</th>
                      <th className="p-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-right">In Stock (System)</th>
                      <th className="p-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-right">Cumulative Movements (Out)</th>
                      <th className="p-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-center">Demand Velocity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {paginatedFastMoving.map((item, idx) => (
                      <tr key={item.product.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 text-center font-extrabold text-slate-400">
                          {fastMovingStartIdx + idx + 1}
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {item.product.name}
                        </td>
                        <td className="p-4 text-slate-500 font-semibold">{item.product.category_name}</td>
                        <td className="p-4 text-right">
                          <span className={cn(
                            "px-2.5 py-1 text-xs font-extrabold rounded-full",
                            item.product.stock <= 10 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                          )}>
                            {item.product.stock} {(item.product as any).unit || 'pcs'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-black font-mono text-rose-600">
                          {item.count} {(item.product as any).unit || 'pcs'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            item.count >= 15 ? "bg-red-150 text-rose-800 bg-rose-50 border border-rose-200" :
                              item.count >= 5 ? "bg-yellow-100 text-yellow-800" :
                                "bg-slate-100 text-slate-500"
                          )}>
                            {item.count >= 15 ? 'Hot Velocity' : item.count >= 5 ? 'Steady Demand' : 'Slower Shelf'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalFastMovingPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-slate-50/30">
                  <div className="text-xs text-slate-500 font-semibold">
                    Showing <span className="font-bold text-slate-700">{fastMovingStartIdx + 1}</span> to{' '}
                    <span className="font-bold text-slate-700">
                      {Math.min(fastMovingStartIdx + ITEMS_PER_PAGE, fastMovingItems.length)}
                    </span>{' '}
                    of <span className="font-bold text-slate-700">{fastMovingItems.length}</span> items
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setFastMovingPage(prev => Math.max(1, prev - 1))}
                      disabled={fastMovingPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalFastMovingPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalFastMovingPages ||
                        Math.abs(page - fastMovingPage) <= 1
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setFastMovingPage(page)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                              fastMovingPage === page
                                ? "bg-emerald-600 text-white border-emerald-700"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            {page}
                          </button>
                        );
                      }
                      if (
                        (page === 2 && fastMovingPage > 3) ||
                        (page === totalFastMovingPages - 1 && fastMovingPage < totalFastMovingPages - 2)
                      ) {
                        return (
                          <span key={`fm-ellipsis-${page}`} className="px-2 py-1.5 text-xs text-slate-400 font-bold select-none">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    <button
                      onClick={() => setFastMovingPage(prev => Math.min(totalFastMovingPages, prev + 1))}
                      disabled={fastMovingPage === totalFastMovingPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB: CYCLE COUNTS ----------------- */}
        {activeTab === 'cycle_counts' && (
          <div className="space-y-6">

            {/* If user is interacting inside physical count worksheet sheet */}
            {isCreatingCycleCount ? (
              <form onSubmit={handleSubmitCycleCount} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Count Audit Sheet</span>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-wide">Perform New Cycle Count</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCycleCount(false)}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider border text-slate-600 border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl transition-all"
                  >
                    <X size={16} /> Cancel count
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Audit Sheet Title</label>
                    <input
                      type="text"
                      required
                      value={cycleCountTitle}
                      onChange={(e) => setCycleCountTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Filter Products Category</label>
                    <select
                      value={cycleCountFilterCategory}
                      onChange={(e) => setCycleCountFilterCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-semibold"
                    >
                      <option value="all">Compare All Categories</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-950 text-xs">
                  <Info size={20} className="shrink-0 text-amber-600" />
                  <div>
                    <span className="font-extrabold block uppercase tracking-wider mb-0.5">Instructions</span>
                    Type the precise, physical on-hand stock count measured in the store for each item beneath the <b>"Actual Counted"</b> column field. The system instantly checks for discrepancies (surpluses or deficits) to match stock records.
                  </div>
                </div>

                {/* Audit Items Table */}
                <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-150">
                      <tr>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">System Expected</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-40">Actual Counted</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Discrepancy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {products
                        .filter(p => cycleCountFilterCategory === 'all' || p.category_id.toString() === cycleCountFilterCategory)
                        .map(p => {
                          const expected = p.stock || 0;
                          const actual = cycleCountItems[p.id] !== undefined ? cycleCountItems[p.id] : expected;
                          const discrepancy = actual - expected;

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/20">
                              <td className="p-3 font-bold text-slate-800">{p.name}</td>
                              <td className="p-3 text-slate-500">{p.category_name}</td>
                              <td className="p-3 text-right font-mono font-bold text-slate-600">{expected} {(p as any).unit || 'pcs'}</td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  value={actual}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 0;
                                    setCycleCountItems({
                                      ...cycleCountItems,
                                      [p.id]: val
                                    });
                                  }}
                                  className="w-full text-center py-1.5 bg-white border border-slate-300 rounded-lg outline-none font-bold text-sm focus:border-indigo-500"
                                />
                              </td>
                              <td className="p-3 text-right font-bold font-mono">
                                {discrepancy === 0 ? (
                                  <span className="text-emerald-600">0 Match</span>
                                ) : discrepancy > 0 ? (
                                  <span className="text-purple-600">+{discrepancy} Surplus</span>
                                ) : (
                                  <span className="text-rose-600">{discrepancy} Deficit</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Audit Notes / Explanations</label>
                    <textarea
                      value={cycleCountRemarks}
                      onChange={(e) => setCycleCountRemarks(e.target.value)}
                      placeholder="e.g. Audit finished without massive differences, standard shrinkage verified..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none h-20 text-xs font-semibold"
                    ></textarea>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="commit_checkbox"
                      checked={cycleCountCommit}
                      onChange={(e) => setCycleCountCommit(e.target.checked)}
                      className="w-4 h-4 text-emerald-650 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="commit_checkbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                      Update system expected stock values to match counted numbers upon saving count
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCycleCount(false)}
                    className="flex-1 py-3 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider"
                  >
                    Back to history
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md"
                  >
                    Submit and close Audit
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">

                {/* Audit trigger section */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wide">Physical Inventory Auditing</h3>
                    <p className="text-slate-500 text-xs leading-relaxed mt-1">
                      Cycle counting ensures your physical stock levels match your computer database records without interrupting operations. Ensure counting at least every 2 weeks.
                    </p>
                  </div>
                  <button
                    id="btn_start_cycle_count"
                    onClick={startNewCycleCount}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md shadow-slate-900/10 shrink-0"
                  >
                    <ClipboardCheck size={16} /> Start Cycle Count audit
                  </button>
                </div>

                {/* Audit History Logs */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Audit Logs</span>
                    <h4 className="text-sm font-extrabold text-slate-800">Cycle Count history</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Sheet Title</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Items audited</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Outcome Status</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Auditor</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Inspect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {paginatedCycleCounts.map((cc) => (
                          <tr key={cc.id} className="hover:bg-slate-50/20">
                            <td className="p-4 text-slate-500 font-mono text-xs">
                              {new Date(cc.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-4 font-bold text-slate-950 text-sm">{cc.title}</td>
                            <td className="p-4 text-slate-600 font-medium">{(cc.items || []).length} items registered</td>
                            <td className="p-4 text-center">
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                cc.status === 'committed' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"
                              )}>
                                {cc.status === 'committed' ? 'Stocks Sync Adjusted' : 'Manual Record only'}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 font-bold text-xs">{cc.user || 'Auditor'}</td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setSelectedCycleCountDetail(cc)}
                                className="p-1 px-2 text-[10px] font-black uppercase text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg bg-slate-50/50 hover:bg-indigo-50/10 transition-colors"
                              >
                                View Detailed Sheet
                              </button>
                            </td>
                          </tr>
                        ))}
                        {cycleCounts.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-400 font-medium italic">
                              No prior cycle count audit procedures recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalCycleCountsPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-slate-50/30">
                      <div className="text-xs text-slate-500 font-semibold">
                        Showing <span className="font-bold text-slate-700">{cycleCountsStartIdx + 1}</span> to{' '}
                        <span className="font-bold text-slate-700">
                          {Math.min(cycleCountsStartIdx + ITEMS_PER_PAGE, cycleCounts.length)}
                        </span>{' '}
                        of <span className="font-bold text-slate-700">{cycleCounts.length}</span> logs
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setCycleCountsPage(prev => Math.max(1, prev - 1))}
                          disabled={cycleCountsPage === 1}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalCycleCountsPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalCycleCountsPages ||
                            Math.abs(page - cycleCountsPage) <= 1
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCycleCountsPage(page)}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                  cycleCountsPage === page
                                    ? "bg-emerald-600 text-white border-emerald-700"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                )}
                              >
                                {page}
                              </button>
                            );
                          }
                          if (
                            (page === 2 && cycleCountsPage > 3) ||
                            (page === totalCycleCountsPages - 1 && cycleCountsPage < totalCycleCountsPages - 2)
                          ) {
                            return (
                              <span key={`cc-ellipsis-${page}`} className="px-2 py-1.5 text-xs text-slate-400 font-bold select-none">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                        <button
                          onClick={() => setCycleCountsPage(prev => Math.min(totalCycleCountsPages, prev + 1))}
                          disabled={cycleCountsPage === totalCycleCountsPages}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warehouse modals removed */}

      {/* ================= MODAL: VIEW DETAILED CYCLE COUNT ================= */}
      {selectedCycleCountDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Cycle Audit Document Inspector</span>
                <h3 className="font-extrabold text-slate-850 text-base">{selectedCycleCountDetail.title}</h3>
              </div>
              <button onClick={() => setSelectedCycleCountDetail(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-2xl">
                <div>
                  <span className="text-slate-450 block font-semibold">Audit Timestamp:</span>
                  <span className="font-bold text-slate-800">{new Date(selectedCycleCountDetail.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-450 block font-semibold">Inspected By Staff:</span>
                  <span className="font-bold text-slate-800">{selectedCycleCountDetail.user}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-450 block font-semibold">Audit General Records / Details:</span>
                  <span className="font-bold text-slate-800 block mt-1">{selectedCycleCountDetail.remarks || 'No detailed audit notes recorded.'}</span>
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-3 text-slate-500 font-bold uppercase tracking-wider">Product Name</th>
                      <th className="p-3 text-slate-500 font-bold uppercase tracking-wider text-right">System expected</th>
                      <th className="p-3 text-slate-500 font-bold uppercase tracking-wider text-right">Physical Hand-count</th>
                      <th className="p-3 text-slate-500 font-bold uppercase tracking-wider text-right">Measured Discrepancy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedCycleCountDetail.items || []).map((it: any, index: number) => (
                      <tr key={index} className="hover:bg-slate-50/20">
                        <td className="p-3 font-bold text-slate-800">{it.name}</td>
                        <td className="p-3 text-right font-semibold font-mono text-slate-550">{it.expected} {it.unit || 'pcs'}</td>
                        <td className="p-3 text-right font-bold font-mono text-slate-800">{it.actual} {it.unit || 'pcs'}</td>
                        <td className="p-3 text-right font-bold font-mono">
                          {it.discrepancy === 0 ? (
                            <span className="text-emerald-600">Perfect Match</span>
                          ) : it.discrepancy > 0 ? (
                            <span className="text-indigo-600">+{it.discrepancy} Surplus</span>
                          ) : (
                            <span className="text-rose-600">{it.discrepancy} Deficit</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setSelectedCycleCountDetail(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase"
              >
                Close inspect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CATEGORIES MANAGEMENT (REPLICATED ORIGINAL) ================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Manage Categories</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="mb-6 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all text-xs font-semibold"
                  placeholder="New category name..."
                />
                <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold hover:bg-slate-800 transition-colors">
                  Add
                </button>
              </div>
              {isLaundryBranch && (
                <div className="flex items-center gap-3 mt-1.5 px-1 font-sans">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Division:</span>
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-bold select-none">
                    <input
                      type="radio"
                      name="cat_division"
                      value="coffee"
                      checked={newCategoryDivision === 'coffee'}
                      onChange={() => setNewCategoryDivision('coffee')}
                      className="accent-emerald-600"
                    />
                    Coffee Shop
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-bold select-none ml-2">
                    <input
                      type="radio"
                      name="cat_division"
                      value="laundry"
                      checked={newCategoryDivision === 'laundry'}
                      onChange={() => setNewCategoryDivision('laundry')}
                      className="accent-emerald-600"
                    />
                    Laundry
                  </label>
                </div>
              )}
            </form>

            <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 shadow-inner">
              {(() => {
                const filteredCats = categories.filter(cat => {
                  if (isLaundryBranch) {
                    return (cat.division || 'coffee') === newCategoryDivision;
                  }
                  return true;
                });
                return (
                  <>
                    {filteredCats.map(cat => (
                      <div key={cat.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50/50">
                        <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">{cat.name}</span>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-[10px] font-bold uppercase"
                        >
                          Delete Category
                        </button>
                      </div>
                    ))}
                    {filteredCats.length === 0 && (
                      <p className="p-8 text-center text-slate-400 text-xs italic font-medium">No categories found for this division.</p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SAVE / ADD PRODUCT (REPLICATED ORIGINAL) ================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-wider">{editingProduct ? 'Edit details' : 'Add New '}</h2>
            <div className="mb-6 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
              {selectedDivision === 'coffee' ? 'Café / Coffee Supply Item' : 'Laundry Shop Service / Supply'}
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                  placeholder="Product Name"
                />
              </div>
 
              {/* Product Image drag & drop */}
              <div>
                <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Product Image</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setUploadedImageBase64(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[100px]",
                    dragActive ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 bg-slate-50 hover:bg-slate-100/50"
                  )}
                  onClick={() => document.getElementById('product-image-file')?.click()}
                >
                  <input
                    id="product-image-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setUploadedImageBase64(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {uploadedImageBase64 ? (
                    <div className="relative flex flex-col items-center gap-2">
                      <img
                        src={uploadedImageBase64}
                        onError={(e) => {
                          if (editingProduct) {
                            (e.target as HTMLImageElement).src = getProductImage(editingProduct.name);
                          }
                        }}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedImageBase64(null);
                        }}
                        className="text-[10px] text-rose-600 font-extrabold uppercase hover:underline"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <UploadCloud size={24} className="mx-auto text-slate-400 mb-1.5" />
                      <p className="text-[10px] font-bold text-slate-600">Drag & drop product picture here, or <span className="text-blue-500 hover:underline">browse</span></p>
                      <p className="text-[8px] text-slate-400 mt-0.5">Supports PNG, JPG, JPEG</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Category</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                >
                  <option value="" disabled>Select category...</option>
                  {categories
                    .filter(c => c.division === selectedDivision)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              {isServiceCategory ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Selling Price / Rate (₱)</label>
                    <input
                      type="number"
                      required step="0.01" min="0"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                      placeholder="Amount"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Unit of Measure</label>
                    <select
                      required
                      value={formData.unit || 'pcs'}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                    >
                      <option value="kg">kg (kilos)</option>
                      <option value="pcs">pcs (pieces)</option>
                      <option value="pair">pair</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Cost Price (₱)</label>
                      <input
                        type="number"
                        required step="0.01" min="0"
                        value={formData.cost}
                        onChange={e => setFormData({ ...formData, cost: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Selling Price (₱)</label>
                      <input
                        type="number"
                        required step="0.01" min="0"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Stock Quantity</label>
                      <input
                        type="number"
                        required min="0"
                        value={formData.stock}
                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                        placeholder="e.g. 20"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Unit of Measure</label>
                      <input
                        type="text"
                        list="common-uom-units"
                        required
                        value={formData.unit || ''}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                        placeholder="e.g. pcs, bottles"
                      />
                      <datalist id="common-uom-units">
                        <option value="pcs" />
                        <option value="bottles" />
                        <option value="cans" />
                        <option value="cups" />
                        <option value="boxes" />
                        <option value="packs" />
                        <option value="sacks" />
                        <option value="grams" />
                        <option value="kg" />
                        <option value="ml" />
                        <option value="liters" />
                      </datalist>
                    </div>
                  </div>

                  {/* Received & Expiration Dates */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Received Date</label>
                      <input
                        type="date"
                        required
                        value={formData.received_date}
                        onChange={e => setFormData({ ...formData, received_date: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-extrabold text-slate-705 block uppercase tracking-widest">Expiration Date</label>
                        <label className="flex items-center gap-1 text-[10px] text-slate-500 font-bold select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.no_expiry}
                            onChange={e => setFormData({ ...formData, no_expiry: e.target.checked, expire_date: e.target.checked ? '' : formData.expire_date })}
                            className="w-3.5 h-3.5 text-emerald-600 border-slate-350 rounded focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                          />
                          No Expiry
                        </label>
                      </div>
                      <input
                        type="date"
                        disabled={formData.no_expiry}
                        required={!formData.no_expiry}
                        value={formData.expire_date}
                        onChange={e => setFormData({ ...formData, expire_date: e.target.value })}
                        className={cn(
                          "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold",
                          formData.no_expiry && "opacity-50 bg-slate-100 cursor-not-allowed"
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Sellable / Display on POS Toggle */}
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl mt-4">
                <input
                  type="checkbox"
                  id="product-is-sellable"
                  checked={formData.is_sellable === '1'}
                  onChange={e => setFormData({ ...formData, is_sellable: e.target.checked ? '1' : '0' })}
                  className="w-4 h-4 text-emerald-600 border-slate-350 rounded focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <label htmlFor="product-is-sellable" className="text-xs font-bold text-slate-700 select-none cursor-pointer flex flex-col">
                  <span>Display on POS Screen</span>
                  <span className="text-[10px] text-slate-450 font-normal leading-none mt-0.5">If unchecked, this stays as raw inventory and won't show on checkout catalog.</span>
                </label>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase shadow-md transition-all active:scale-[0.98]"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIGURE RECIPE / BOM ================= */}
      {isRecipeModalOpen && recipeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full border border-slate-100 flex flex-col max-h-[90vh]">
            <h2 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">Recipe Ingredients (BOM)</h2>
            <p className="text-xs text-slate-500 font-bold mb-4">Configure automatic inventory deductions when selling: <span className="text-emerald-600 underline font-black">{recipeProduct.name}</span></p>

            {/* Add Ingredient Bar */}
            <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-2xl flex flex-col sm:flex-row gap-3 items-end mb-4">
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-black text-slate-700 block mb-1 uppercase tracking-wider">Select Ingredient / Supply</label>
                <select
                  value={selectedIngredientId}
                  onChange={e => setSelectedIngredientId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-205 rounded-xl outline-none text-xs font-semibold"
                >
                  <option value="">-- Select ingredient --</option>
                  {products
                    .filter(p => p.id !== recipeProduct.id && !recipeIngredients.some(ri => ri.ingredient_id === p.id))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} {(p as any).unit || 'pcs'})</option>
                    ))}
                </select>
              </div>
              <div className="w-24 shrink-0">
                <label className="text-[10px] font-black text-slate-700 block mb-1 uppercase tracking-wider">Qty Per Unit</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={ingredientQuantity}
                  onChange={e => setIngredientQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-205 rounded-xl outline-none text-xs font-semibold"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!selectedIngredientId) return;
                  setRecipeIngredients([
                    ...recipeIngredients,
                    {
                      ingredient_id: parseInt(selectedIngredientId),
                      quantity: parseFloat(ingredientQuantity || '1')
                    }
                  ]);
                  setSelectedIngredientId('');
                  setIngredientQuantity('1');
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Add
              </button>
            </div>

            {/* Ingredients List */}
            <div className="flex-1 overflow-y-auto mb-4 border border-slate-100 rounded-2xl custom-scrollbar">
              {recipeIngredients.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                    <tr>
                      <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Ingredient</th>
                      <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Deduct Qty</th>
                      <th className="p-3 text-[10px] font-black text-slate-500 tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recipeIngredients.map((item, idx) => {
                      const ingProduct = products.find(p => p.id === item.ingredient_id);
                      return (
                        <tr key={item.ingredient_id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <p className="text-xs font-bold text-slate-800">{ingProduct?.name || 'Unknown Item'}</p>
                            <p className="text-[9px] text-slate-400 font-bold">Current stock: {ingProduct?.stock || 0} {(ingProduct as any)?.unit || 'pcs'}</p>
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="0.001"
                              min="0.001"
                              value={item.quantity}
                              onChange={e => {
                                const newRecipe = [...recipeIngredients];
                                newRecipe[idx].quantity = parseFloat(e.target.value || '1');
                                setRecipeIngredients(newRecipe);
                              }}
                              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right text-xs font-semibold focus:bg-white"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setRecipeIngredients(recipeIngredients.filter(ri => ri.ingredient_id !== item.ingredient_id));
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-slate-400 text-center">
                  <List size={28} strokeWidth={1.5} className="mb-2 text-slate-300" />
                  <p className="text-xs font-bold">No ingredients linked yet.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Use the bar above to define stock deductions for this product.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-auto">
              <button
                type="button"
                onClick={() => setIsRecipeModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRecipe}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase shadow-md transition-all active:scale-[0.98]"
              >
                Save Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
