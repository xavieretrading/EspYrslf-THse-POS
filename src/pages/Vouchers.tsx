import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Ticket, Search, AlertCircle, CheckCircle2, Edit2, X } from 'lucide-react';
import { cn } from '../App';
import { useBranch } from '../BranchContext';
import { swalConfirm } from '../lib/swal';

interface Product {
  id: number;
  name: string;
  price: number;
}

interface VoucherItem {
  id: number;
  product_id: number;
  points_required: number;
  new_price: number;
  products?: {
    name: string;
    price: number;
  };
}

const Vouchers: React.FC = () => {
  const { activeBranch } = useBranch();
  const [voucherItems, setVoucherItems] = useState<VoucherItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);
  
  const [newVoucher, setNewVoucher] = useState({
    product_id: '',
    points_required: '',
    new_price: ''
  });
  const [editForm, setEditForm] = useState({
    points_required: '',
    new_price: ''
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeBranch]);

  const fetchData = async () => {
    if (!activeBranch) return;
    setLoading(true);
    try {
      const [vRes, pRes] = await Promise.all([
        fetch('/api/voucher-items'),
        fetch(`/api/products?branch_id=${activeBranch.id}`)
      ]);
      const vData = await vRes.json();
      const pData = await pRes.json();
      setVoucherItems(Array.isArray(vData) ? vData : []);
      setProducts(Array.isArray(pData) ? pData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddVoucher = async () => {
    if (!newVoucher.product_id || !newVoucher.points_required) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      const res = await fetch('/api/voucher-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(newVoucher.product_id),
          points_required: parseInt(newVoucher.points_required),
          new_price: parseFloat(newVoucher.new_price) || 0
        })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        showToast('Voucher item added successfully', 'success');
        setShowAddModal(false);
        setNewVoucher({ product_id: '', points_required: '', new_price: '' });
        fetchData();
      } else {
        showToast(result.error || 'Failed to add voucher item', 'error');
      }
    } catch (error) {
      showToast('Connection error. Failed to add voucher item', 'error');
    }
  };

  const handleUpdateVoucher = async () => {
    if (!editingVoucher) return;
    if (!editForm.points_required) {
      showToast('Points required is mandatory', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/voucher-items/${editingVoucher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points_required: parseInt(editForm.points_required),
          new_price: parseFloat(editForm.new_price) || 0
        })
      });
      
      const result = await res.json();

      if (res.ok) {
        showToast('Voucher item updated successfully', 'success');
        setEditingVoucher(null);
        fetchData();
      } else {
        showToast(result.error || 'Failed to update voucher item', 'error');
      }
    } catch (error) {
      showToast('Connection error. Failed to update voucher item', 'error');
    }
  };

  const handleDeleteVoucher = async (id: number) => {
    const isConfirm = await swalConfirm('Are you sure you want to remove this item from vouchers?');
    if (!isConfirm) return;
    
    try {
      const res = await fetch(`/api/voucher-items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Voucher item removed', 'success');
        fetchData();
      }
    } catch (error) {
      showToast('Failed to remove voucher item', 'error');
    }
  };

  const filteredVouchers = voucherItems.filter(v => 
    v.products?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Ticket className="text-emerald-600" size={32} />
            VOUCHERS MODULE
          </h1>
          <p className="text-slate-500 font-medium">Manage products redeemable via points</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95"
        >
          <Plus size={20} />
          ADD VOUCHER ITEM
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Original Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Voucher Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Points Required</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">Loading vouchers...</td></tr>
              ) : filteredVouchers.length === 0 ? (
                 <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">No voucher items found.</td></tr>
              ) : filteredVouchers.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{item.products?.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400 text-xs font-medium block">Original Price</span>
                    <span className="text-slate-500 font-bold line-through">₱{(item.products?.price || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-emerald-600 font-black text-lg">₱{(item.new_price || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-black">
                      {item.points_required} PTS
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-slate-400">
                      <button 
                        onClick={() => {
                          setEditingVoucher(item);
                          setEditForm({
                            points_required: item.points_required.toString(),
                            new_price: item.new_price.toString()
                          });
                        }}
                        className="hover:text-amber-500 p-2 transition-colors"
                        title="Edit Voucher"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteVoucher(item.id)}
                        className="hover:text-red-500 p-2 transition-colors"
                        title="Delete Voucher"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Edit2 className="text-amber-500" size={24} />
                EDIT VOUCHER ITEM
              </h3>
              <button onClick={() => setEditingVoucher(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Product</label>
                <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-600">
                  {editingVoucher.products?.name}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Voucher Price (New Price)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
                  <input 
                    type="number"
                    placeholder="Enter voucher price"
                    value={editForm.new_price}
                    onChange={(e) => setEditForm(prev => ({ ...prev, new_price: e.target.value }))}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Points Corresponding (Required)</label>
                <input 
                  type="number"
                  placeholder="Enter required points"
                  value={editForm.points_required}
                  onChange={(e) => setEditForm(prev => ({ ...prev, points_required: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-bold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setEditingVoucher(null)}
                  className="flex-1 px-6 py-3 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleUpdateVoucher}
                  className="flex-1 px-6 py-3 rounded-2xl font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all active:scale-95"
                >
                  UPDATE ITEM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Plus className="text-emerald-600" size={24} />
                ADD VOUCHER ITEM
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Select Product</label>
                <select 
                  value={newVoucher.product_id}
                  onChange={(e) => {
                    const prodId = e.target.value;
                    const prod = products.find(p => p.id === parseInt(prodId));
                    setNewVoucher(prev => ({ 
                      ...prev, 
                      product_id: prodId,
                      // Auto-fill new price with original price as default
                      new_price: prod ? prod.price.toString() : ''
                    }));
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-bold"
                >
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Original: ₱{p.price.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Voucher Price (New Price)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
                  <input 
                    type="number"
                    placeholder="Enter voucher price"
                    value={newVoucher.new_price}
                    onChange={(e) => setNewVoucher(prev => ({ ...prev, new_price: e.target.value }))}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Points Corresponding (Required)</label>
                <input 
                  type="number"
                  placeholder="Enter required points"
                  value={newVoucher.points_required}
                  onChange={(e) => setNewVoucher(prev => ({ ...prev, points_required: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-bold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleAddVoucher}
                  className="flex-1 px-6 py-3 rounded-2xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                >
                  SAVE ITEM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right",
          toast.type === 'success' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <span className="font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default Vouchers;
