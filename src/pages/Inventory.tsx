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
  Info
} from 'lucide-react';
import { cn } from '../App';
import { useBranch } from '../BranchContext';
import { useSettings } from '../SettingsContext';
import { logActivity } from '../lib/audit';
import { swalAlert, swalConfirm } from '../lib/swal';

type Category = { id: number; name: string };
type Product = { id: number; name: string; stock: number; category_name: string; category_id: number; cost: number; price: number };

type TabType = 'active_stocks' | 'warehouses' | 'in_out_reports' | 'fast_moving' | 'cycle_counts';

export default function Inventory() {
  const { activeBranch } = useBranch();
  const { settings, refreshSettings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('active_stocks');
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', cost: '', price: '', category_id: '', stock: '' });

  // === NEW STATES FOR WAREHOUSE FEATURE ===
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<Record<string, number>>({});
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('wh-1');
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [newWarehouseDesc, setNewWarehouseDesc] = useState('');

  // Warehouse Transfer States
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferProductId, setTransferProductId] = useState<string>('');
  const [transferFromWhId, setTransferFromWhId] = useState<string>('');
  const [transferToWhId, setTransferToWhId] = useState<string>('');
  const [transferQty, setTransferQty] = useState<string>('');
  const [transferRemarks, setTransferRemarks] = useState<string>('');
  const [transfers, setTransfers] = useState<any[]>([]);

  // Manual stock update modal for Warehouses
  const [updatingWhProduct, setUpdatingWhProduct] = useState<Product | null>(null);
  const [updatingWhStockVal, setUpdatingWhStockVal] = useState<string>('');

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

  const fetchData = async () => {
    if (!activeBranch) return;
    setIsDataLoading(true);
    try {
      const [invRes, catRes] = await Promise.all([
        fetch(`/api/inventory?branch_id=${activeBranch.id}`),
        fetch('/api/categories')
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
        const uniqueCats = (catData || []).filter((cat: Category, index: number, self: Category[]) => 
          self.findIndex(t => t.name === cat.name) === index
        );
        setCategories(uniqueCats);
      }

      // Fetch warehouse details
      const [whRes, whStockRes, trRes, txRes, ccRes] = await Promise.all([
        fetch('/api/warehouses'),
        fetch('/api/warehouse/stocks'),
        fetch('/api/warehouse/transfers'),
        fetch('/api/inventory/transactions'),
        fetch('/api/cycle-counts')
      ]);

      if (whRes.ok) setWarehouses(await whRes.json());
      if (whStockRes.ok) setWarehouseStocks(await whStockRes.json());
      if (trRes.ok) setTransfers(await trRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (ccRes.ok) setCycleCounts(await ccRes.json());

    } catch (e) {
      console.error('Error fetching inventory data', e);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
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
        quantity: parseInt(quantity),
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
    
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branch_id: activeBranch.id,
        name: formData.name,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        category_id: parseInt(formData.category_id),
        stock: parseInt(formData.stock || '0')
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
    setFormData({ name: '', cost: '', price: '', category_id: categories[0]?.id.toString() || '', stock: '0' });
    setIsProductModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      cost: product.cost.toString(),
      price: product.price.toString(),
      category_id: product.category_id?.toString() || '',
      stock: (product.stock || 0).toString()
    });
    setIsProductModalOpen(true);
  };

  // Category management
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName })
    });
    if (res.ok) {
      setNewCategoryName('');
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

  // === WAREHOUSE LOGIC HANDLERS ===
  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouseName.trim()) return;

    const res = await fetch('/api/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newWarehouseName, description: newWarehouseDesc })
    });

    if (res.ok) {
      setNewWarehouseName('');
      setNewWarehouseDesc('');
      setShowAddWarehouseModal(false);
      fetchData();
    } else {
      swalAlert('Error', 'Failed to add warehouse', 'error');
    }
  };

  const handleUpdateWarehouseStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingWhProduct || !selectedWarehouseId) return;

    const stockVal = parseInt(updatingWhStockVal, 10);
    if (isNaN(stockVal)) return;

    const res = await fetch('/api/warehouse/stocks/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        warehouse_id: selectedWarehouseId,
        product_id: updatingWhProduct.id,
        stock: stockVal
      })
    });

    if (res.ok) {
      setUpdatingWhProduct(null);
      setUpdatingWhStockVal('');
      fetchData();
    } else {
      swalAlert('Error', 'Failed to update warehouse stock', 'error');
    }
  };

  const handleWarehouseTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductId || !transferFromWhId || !transferToWhId || !transferQty) return;

    if (transferFromWhId === transferToWhId) {
      swalAlert('Invalid Transfer', 'Source and destination warehouses cannot be the exact same physical warehouse!', 'warning');
      return;
    }

    const matchedProduct = products.find(p => p.id === parseInt(transferProductId, 10));
    const matchedFrom = warehouses.find(w => w.id === transferFromWhId);
    const matchedTo = warehouses.find(w => w.id === transferToWhId);
    const userObj = JSON.parse(localStorage.getItem('resto_active_user') || '{}');

    const res = await fetch('/api/warehouse/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: matchedProduct?.id,
        product_name: matchedProduct?.name,
        from_warehouse_id: transferFromWhId,
        from_warehouse_name: matchedFrom?.name,
        to_warehouse_id: transferToWhId,
        to_warehouse_name: matchedTo?.name,
        quantity: parseInt(transferQty, 10),
        remarks: transferRemarks,
        user: userObj.full_name || userObj.username || 'Staff'
      })
    });

    if (res.ok) {
      setTransferProductId('');
      setTransferFromWhId('');
      setTransferToWhId('');
      setTransferQty('');
      setTransferRemarks('');
      setShowTransferModal(false);
      fetchData();
    } else {
      const errData = await res.json();
      swalAlert('Transfer Failed', errData.error || 'Failed to complete warehouse transfer', 'error');
    }
  };

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

  // === ANALYTICS & COMPUTATIONS ===
  const getFastMovingItems = () => {
    // Group all outward transactions from inventory_transactions
    // Filter transactions by type: 'out'
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
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Filtering for transaction reports
  const filteredReports = transactions.filter(tx => {
    const matchesType = reportsFilterType === 'all' || tx.type === reportsFilterType;
    const productName = tx.products?.name || tx.product_name || 'Unknown Product';
    const matchesSearch = productName.toLowerCase().includes(reportsSearch.toLowerCase()) || (tx.remarks && tx.remarks.toLowerCase().includes(reportsSearch.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-8 h-full flex flex-col bg-slate-50 relative overflow-y-auto">
      {/* Header section */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <MapPin className="text-emerald-500" /> Inventory & Warehousing
          </h1>
          <p className="text-slate-500">Manage products, warehouse allocations, stock transfers, audit counts, and moving analytics.</p>
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
        <button 
          id="tab_warehouses"
          onClick={() => { setActiveTab('warehouses'); setIsCreatingCycleCount(false); }} 
          className={cn(
            "px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 pr-5", 
            activeTab === 'warehouses' ? "border-emerald-500 text-emerald-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <MapPin size={16} /> Warehouse & Transfers
        </button>
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
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Stock</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900 text-sm">{product.name}</td>
                        <td className="p-4 text-slate-500 text-sm">{product.category_name}</td>
                        <td className="p-4 text-right text-slate-500 font-mono text-sm">₱{product.cost?.toFixed(2)}</td>
                        <td className="p-4 text-right text-slate-500 font-mono text-sm">₱{product.price?.toFixed(2)}</td>
                        <td className="p-4 text-right">
                          <span className={cn(
                            "font-bold px-3 py-1 rounded-full cursor-pointer text-xs uppercase tracking-wide inline-block shadow-sm",
                            product.stock <= 10 ? "bg-rose-50 border border-rose-200 text-rose-700" : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                          )} onClick={() => setSelectedProduct(product)} title="Click to transact stock Level">
                            {product.stock} Units
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1 justify-center">
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
                        <td colSpan={6} className="p-12 text-center text-slate-400 font-medium italic">
                          No matching products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                      Current DB Stock: <span className="font-bold text-emerald-600">{selectedProduct.stock} Units</span>
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
                    Click a product can stock count<br/>
                    to record database ledger transact.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB: WAREHOUSES & TRANSFERS ----------------- */}
        {activeTab === 'warehouses' && (
          <div className="space-y-6">
            
            {/* Top metrics bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Active Warehouses</span>
                  <span className="text-2xl font-black text-slate-800">{warehouses.length}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl">
                  <MapPin size={24} />
                </div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Transfers Filed</span>
                  <span className="text-2xl font-black text-slate-800">{transfers.length} Logs</span>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl">
                  <ArrowLeftRight size={24} />
                </div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Allocated Warehouse Stock</span>
                  <span className="text-2xl font-black text-slate-800">
                    {(Object.values(warehouseStocks) as any[]).reduce((acc: number, current: any) => acc + (current || 0), 0)} Units
                  </span>
                </div>
                <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
                  <RefreshCw size={24} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Warehouses Side Grid */}
              <div className="lg:col-span-1 space-y-4">
                <div className="flex justify-between items-center pb-2">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Select Warehouse</h3>
                  <button 
                    id="btn_add_warehouse"
                    onClick={() => setShowAddWarehouseModal(true)}
                    className="p-1 bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                    title="Add Warehouse Location"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="space-y-2">
                  {warehouses.map(wh => (
                    <button
                      key={wh.id}
                      onClick={() => setSelectedWarehouseId(wh.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-1 relative overflow-hidden",
                        selectedWarehouseId === wh.id 
                          ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" 
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span className="font-bold text-sm">{wh.name}</span>
                      <span className={cn(
                        "text-xs truncate max-w-[200px]",
                        selectedWarehouseId === wh.id ? "text-slate-300" : "text-slate-500"
                      )}>{wh.description || 'No description'}</span>
                      {selectedWarehouseId === wh.id && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  id="btn_launch_transfer"
                  onClick={() => {
                    if (warehouses.length < 2) {
                      swalAlert('Cannot Initiate Transfer', 'You must have at least two warehouses registered to initialize transfers!', 'warning');
                      return;
                    }
                    setTransferFromWhId(selectedWarehouseId || warehouses[0]?.id || '');
                    setTransferToWhId(warehouses.find(w => w.id !== selectedWarehouseId)?.id || '');
                    if (products.length > 0) setTransferProductId(products[0]?.id.toString());
                    setShowTransferModal(true);
                  }}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15"
                >
                  <ArrowLeftRight size={14} /> Transfer warehouse stock
                </button>
              </div>

              {/* Right Stocks in Selected Warehouse Table */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Current Warehouse Content</span>
                      <h4 className="text-base font-black text-slate-800">
                        {warehouses.find(w => w.id === selectedWarehouseId)?.name || 'Central Warehouse'} Stock
                      </h4>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cost Value</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Physical Warehouse Stock</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Update</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.map(p => {
                          const stockKey = `${selectedWarehouseId}_${p.id}`;
                          const whStock = warehouseStocks[stockKey] || 0;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/20 transition-all">
                              <td className="p-4 font-bold text-slate-800 text-sm">{p.name}</td>
                              <td className="p-4 text-slate-500 text-sm">{p.category_name}</td>
                              <td className="p-4 text-right text-slate-500 font-mono text-sm">₱{p.cost?.toFixed(2)}</td>
                              <td className="p-4 text-right">
                                <span className={cn(
                                  "px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide",
                                  whStock === 0 ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                )}>
                                  {whStock} Units
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={() => {
                                    setUpdatingWhProduct(p);
                                    setUpdatingWhStockVal(whStock.toString());
                                  }}
                                  className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 px-3 py-1 border border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 rounded-lg transition-colors"
                                >
                                  Modify
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Warehouse Transfer Log history */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Movement Audit Trail</span>
                    <h4 className="text-sm font-extrabold text-slate-800">Warehouse-to-Warehouse Transfer History</h4>
                  </div>
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                          <th className="p-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="p-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Product</th>
                          <th className="p-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">From Location</th>
                          <th className="p-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">To Location</th>
                          <th className="p-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-right">Quantity</th>
                          <th className="p-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-center">Handled By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {transfers.map(tr => (
                          <tr key={tr.id} className="hover:bg-slate-50/20 transition-colors">
                            <td className="p-3 text-slate-500 font-mono">
                              {new Date(tr.created_at).toLocaleDateString('en-US', { hour: 'numeric', minute: 'numeric' })}
                            </td>
                            <td className="p-3 font-bold text-slate-800">{tr.product_name}</td>
                            <td className="p-3 text-slate-600 font-medium">{tr.from_warehouse_name}</td>
                            <td className="p-3 text-slate-600 font-medium">{tr.to_warehouse_name}</td>
                            <td className="p-3 text-right font-bold text-indigo-600 font-mono">{tr.quantity} units</td>
                            <td className="p-3 text-center text-slate-500 font-semibold">{tr.user}</td>
                          </tr>
                        ))}
                        {transfers.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-medium italic">
                              No transfers recorded in ledger.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product ID</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Direction</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Log count</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks / Document Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredReports.map((tx, idx) => {
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
                          <td className="p-4 font-mono text-slate-400 text-xs">#{tx.product_id || 'N/A'}</td>
                          <td className="p-4 font-bold text-slate-900">{prodName}</td>
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
                          <td className={cn(
                            "p-4 text-right font-black font-mono",
                            tx.type === 'in' ? "text-emerald-600" : tx.type === 'out' ? "text-rose-600" : "text-indigo-600"
                          )}>
                            {tx.type === 'in' ? '+' : tx.type === 'out' ? '-' : ''}{tx.quantity || 0} Units
                          </td>
                          <td className="p-4 text-slate-600 font-medium max-w-xs truncate" title={tx.remarks}>
                            {tx.remarks || '---'}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredReports.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400 font-medium italic">
                          No transactions found on the local ledger matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB: FAST MOVING ITEMS ----------------- */}
        {activeTab === 'fast_moving' && (
          <div className="space-y-6">
            
            {/* Summary card context */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 bg-slate-900 text-white relative overflow-hidden">
              <div className="z-10 relative max-w-xl">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Sales & Moving Metrics</span>
                <h3 className="text-xl font-extrabold mb-2">Fast Moving Items Analytics</h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Products sorted by dynamic stock-out count velocity based on live client redemptions, table order checkouts, and staff outward adjustments. Check out your inventory turn rates below to decide ordering times.
                </p>
              </div>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 text-white z-0 hidden md:block">
                <TrendingUp size={160} />
              </div>
            </div>

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
                    {getFastMovingItems().map((item, idx) => (
                      <tr key={item.product.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 text-center font-extrabold text-slate-400">
                          {idx + 1}
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
                            {item.product.stock} Units
                          </span>
                        </td>
                        <td className="p-4 text-right font-black font-mono text-rose-600">
                          {item.count} units
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            item.count >= 15 ? "bg-red-150 text-rose-800 bg-rose-50 border border-rose-200" :
                            item.count >= 5 ? "bg-yellow-100 text-yellow-800" :
                            "bg-slate-100 text-slate-500"
                          )}>
                            {item.count >= 15 ? 'Hot Velocity 🔥' : item.count >= 5 ? 'Steady Demand ⚡' : 'Slower Shelf 📋'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                              <td className="p-3 text-right font-mono font-bold text-slate-600">{expected} Units</td>
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
                        {cycleCounts.map((cc) => (
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
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD WAREHOUSE ================= */}
      {showAddWarehouseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 border-none uppercase tracking-wide text-sm">Add Warehouse Location</h3>
              <button onClick={() => setShowAddWarehouseModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddWarehouse} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Warehouse Name</label>
                <input
                  type="text"
                  required
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  placeholder="e.g. Cold storage warehouse 2"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Description / Notes</label>
                <textarea
                  value={newWarehouseDesc}
                  onChange={(e) => setNewWarehouseDesc(e.target.value)}
                  placeholder="e.g. Sub-zero cooling room, back-kitchen zone..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 outline-none h-20 text-xs resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddWarehouseModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase"
                >
                  Register location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: STOCK WAREHOUSE UPDATOR ================= */}
      {updatingWhProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 uppercase tracking-wide text-xs">Set Physical Count</h3>
              <button onClick={() => setUpdatingWhProduct(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateWarehouseStock} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Update location stock value</span>
                <span className="font-extrabold text-slate-850 text-sm mt-0.5 block">{updatingWhProduct.name}</span>
                <span className="text-[10px] font-bold text-slate-500 mt-1 block">
                  Location: {warehouses.find(w => w.id === selectedWarehouseId)?.name}
                </span>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Physical Warehouse Qty</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={updatingWhStockVal}
                  onChange={(e) => setUpdatingWhStockVal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUpdatingWhProduct(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase"
                >
                  Set Stock Value
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: WAREHOUSE TRANSFER ================= */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 uppercase tracking-wide text-sm">Transfer Inventory Stock</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWarehouseTransfer} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Transfer Product</label>
                <select
                  required
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 outline-none text-sm font-semibold"
                >
                  {products.map(p => {
                    const currentStock = warehouseStocks[`${transferFromWhId}_${p.id}`] || 0;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (Available: {currentStock} at source)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Sender Location</label>
                  <select
                    required
                    value={transferFromWhId}
                    onChange={(e) => setTransferFromWhId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-450 outline-none text-xs font-semibold"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Recipient Location</label>
                  <select
                    required
                    value={transferToWhId}
                    onChange={(e) => setTransferToWhId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-450 outline-none text-xs font-semibold"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Transfer Quantity Units</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Transfer Remarks / Notes</label>
                <textarea
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  placeholder="e.g. Restocked bar cooler annex due to high beverage demand..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-400 outline-none h-16 text-xs resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase shadow-md shadow-indigo-600/10"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                        <td className="p-3 text-right font-semibold font-mono text-slate-550">{it.expected} Units</td>
                        <td className="p-3 text-right font-bold font-mono text-slate-800">{it.actual} Units</td>
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

            <form onSubmit={handleAddCategory} className="mb-6 flex gap-2">
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
            </form>

            <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 shadow-inner">
              {categories.map(cat => (
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
              {categories.length === 0 && (
                <p className="p-8 text-center text-slate-400 text-xs italic font-medium">No categories found in system.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SAVE / ADD PRODUCT (REPLICATED ORIGINAL) ================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6 uppercase tracking-wider">{editingProduct ? 'Edit Product details' : 'Add New Product'}</h2>
            
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Product Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                  placeholder="e.g. Traditional Adobo"
                />
              </div>
              
              <div>
                <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Category</label>
                <select 
                  required
                  value={formData.category_id}
                  onChange={e => setFormData({...formData, category_id: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                >
                  <option value="" disabled>Select category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Cost Price (₱)</label>
                  <input 
                    type="number" 
                    required step="0.01" min="0"
                    value={formData.cost}
                    onChange={e => setFormData({...formData, cost: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Selling Price (₱)</label>
                  <input 
                    type="number" 
                    required step="0.01" min="0"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-705 mb-1.5 block uppercase tracking-widest">Stock Quantity</label>
                <input 
                  type="number" 
                  required min="0"
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                  placeholder="e.g. 20"
                />
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
    </div>
  );
}
