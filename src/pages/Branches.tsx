import React, { useState } from 'react';
import { Store, Plus, Trash2, MapPin } from 'lucide-react';
import { useBranch } from '../BranchContext';
import { cn } from '../App';
import { swalConfirm } from '../lib/swal';

export default function Branches() {
  const { branches, refreshBranches, activeBranch } = useBranch();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const res = await fetch('/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address })
    });

    if (res.ok) {
      setName('');
      setAddress('');
      await refreshBranches();
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await swalConfirm(
      'Are you sure you want to delete this branch?',
      'All associated products, tables, and orders will be deleted.'
    );
    if (!confirmed) return;
    const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await refreshBranches();
    }
  };

  return (
    <div className="p-8 h-full flex flex-col bg-slate-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Branch Management</h1>
        <p className="text-slate-500">Manage your restaurant branches and locations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Branch</h2>
          <form onSubmit={handleAddBranch} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Branch Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Downtown Branch"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Address</label>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 123 Main St"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              />
            </div>
            <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <Plus size={18} /> Add Branch
            </button>
          </form>
        </div>

        {/* Grid */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Current Branches</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {branches.map(branch => (
              <div 
                key={branch.id} 
                className={cn(
                  "p-5 rounded-2xl border flex flex-col gap-3 relative group transition-all",
                  activeBranch?.id === branch.id 
                    ? "bg-emerald-50 border-emerald-200" 
                    : "bg-slate-50 border-slate-200 hover:border-emerald-500"
                )}
              >
                {activeBranch?.id !== branch.id && (
                  <button 
                    onClick={() => handleDelete(branch.id)}
                    className="absolute top-4 right-4 p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 border border-slate-100 transition-all cursor-pointer z-10"
                    title="Delete Branch"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    activeBranch?.id === branch.id ? "bg-emerald-100 text-emerald-600" : "bg-white text-slate-400 shadow-sm"
                  )}>
                    <Store size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{branch.name}</h3>
                    {activeBranch?.id === branch.id && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Branch</span>
                    )}
                  </div>
                </div>
                {branch.address && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                    <MapPin size={14} />
                    {branch.address}
                  </div>
                )}
              </div>
            ))}
            {branches.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400">
                No branches found. Add one to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
