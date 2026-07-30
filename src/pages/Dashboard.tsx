import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Boxes, 
  Wallet,
  ArrowRight,
  Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useBranch } from '../BranchContext';
import { cn } from '../App';

type Product = { 
  id: number; 
  name: string; 
  stock: number; 
  category_name: string; 
  cost: number; 
  price: number;
};

export default function Dashboard() {
  const { activeBranch } = useBranch();
  const isLaundryBranch = activeBranch?.name?.toLowerCase().includes('laundry') || activeBranch?.name?.toLowerCase().includes('s1p') || activeBranch?.name?.toLowerCase().includes('spin');
  const [summary, setSummary] = useState<any>({});
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeBranch) return;
    setIsLoading(true);
    
    // Fetch sales reports
    fetch(`/api/reports/sales?branch_id=${activeBranch.id}`)
      .then(res => res.json())
      .then(data => {
        setSummary(data.summary || {});
        setDailySales((data.dailySales || []).reverse());
      })
      .catch(err => console.error("Error fetching sales:", err));

    // Fetch active branch products for inventory statistics
    fetch(`/api/inventory?branch_id=${activeBranch.id}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data || []);
      })
      .catch(err => console.error("Error fetching inventory:", err))
      .finally(() => setIsLoading(false));
  }, [activeBranch]);

  // Inventory computations
  const totalStockItems = products.length;
  const totalStockQty = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.cost || 0)), 0);
  
  // Low stock is items with stock <= 10
  const lowStockProducts = products.filter(p => (p.stock || 0) <= 10).sort((a,b) => a.stock - b.stock);
  const lowStockCount = lowStockProducts.length;
  const outOfStockCount = products.filter(p => (p.stock || 0) <= 0).length;

  const salesStats = [
    { title: 'Total Revenue', value: `₱${(summary.total_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 border border-emerald-100' },
    { title: 'Gross Sales', value: `₱${(summary.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-550/10 bg-blue-50 border border-blue-100' },
    { title: 'Discounts Granted', value: `₱${(summary.total_discounts || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-50 border border-amber-100' },
    { title: 'Customer Tickets', value: summary.total_transactions || 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 border border-purple-100' },
  ];

  const inventoryStats = [
    { title: 'Total Registered Items', value: totalStockItems, subtitle: `${totalStockQty} total units physical`, icon: Package, color: 'text-sky-600', bg: 'bg-sky-50 border border-sky-100' },
    { title: 'Capital Value of Stock', value: `₱${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, subtitle: 'Based on unit cost price', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50/50 border border-emerald-100/60' },
    { title: 'Critical Stock Alerts', value: lowStockCount, subtitle: `${outOfStockCount} items completely out`, icon: AlertTriangle, color: lowStockCount > 0 ? 'text-rose-500 font-extrabold animate-pulse' : 'text-slate-400', bg: lowStockCount > 0 ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50 border border-slate-100' },
    { title: 'On-Hand Stock Units', value: totalStockQty, subtitle: 'Aggregate POS stock level', icon: Boxes, color: 'text-indigo-500', bg: 'bg-indigo-50 border border-indigo-100' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 font-sans bg-slate-50 min-h-full">
      <div className="pl-12 lg:pl-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm md:text-base text-slate-500 font-semibold tracking-tight">Unified Sales Summary & Real-time Material Inventory Status</p>
        </div>
        {activeBranch && (
          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider self-start shadow-sm border border-slate-850">
            Branch: {activeBranch.name}
          </div>
        )}
      </div>

      {/* Sales Summary row */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Finance & Revenue Insights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {salesStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-150 flex items-center gap-4 hover:shadow-md transition-all">
                <div className={`p-3.5 rounded-xl ${stat.bg} shrink-0`}>
                  <Icon className={stat.color} size={22} />
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">{stat.title}</p>
                  <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Division Breakdown for Laundry hybrid branch */}
      {isLaundryBranch && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-150 font-sans">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Division Breakdown (Gross Sales)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="p-4 bg-emerald-50/50 border border-emerald-100/60 rounded-xl flex items-center gap-3.5">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 text-lg">
                ☕
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Coffee Shop Division</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">₱{(summary.coffee_sales_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50/50 border border-blue-100/60 rounded-xl flex items-center gap-3.5">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 text-lg">
                🧺
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Laundry Division</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">₱{(summary.laundry_sales_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory & Stock summary row */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">POS Stock & Material Asset Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {inventoryStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-150 flex items-center gap-4 hover:shadow-md transition-all">
                <div className={`p-3.5 rounded-xl ${stat.bg} shrink-0`}>
                  <Icon className={stat.color} size={22} />
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">{stat.title}</p>
                  <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{stat.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main performance grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Sales trend chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-150 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Revenue Generation Trend</h3>
              <p className="text-xs text-slate-500 font-semibold">Historical daily performance log over modern cycles</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-150">Last 30 Days</span>
          </div>

          <div className="h-80 flex-1 min-h-[320px]">
            {dailySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value) => `₱${value}`} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' }}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                No performance data exists for active cycles
              </div>
            )}
          </div>
        </div>

        {/* Right column: Out of stock / Low stock warnings list */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-150 flex flex-col h-[420px] lg:h-auto">
          <div className="flex justify-between items-center mb-4 border-b border-slate-105 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className={cn("text-slate-400 shrink-0", lowStockCount > 0 && "text-rose-500")} size={18} />
                Critical Low Stock Warn
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">Items requiring manual urgent reordering</p>
            </div>
            <span className={cn(
              "text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full text-center",
              lowStockCount > 0 ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
            )}>
              {lowStockCount} Flagged
            </span>
          </div>

          {/* Warning summary box */}
          {lowStockCount > 0 && (
            <div className="mb-4 bg-amber-50/50 border border-amber-200/60 p-3.5 rounded-2xl flex items-start gap-2.5">
              <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                There are <span className="font-extrabold text-amber-950">{lowStockCount} items</span> on low stock status (count limit is 10). Out-of-stock items will lock and reject sales if strict lock setting is switched on on the system.
              </p>
            </div>
          )}

          {/* List area with custom scrollbars */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {lowStockProducts.slice(0, 6).map(p => (
              <div 
                key={p.id} 
                className={cn(
                  "p-3 rounded-2xl border transition-all flex justify-between items-center",
                  p.stock <= 0 
                    ? "bg-rose-50/40 border-rose-150 hover:bg-rose-50" 
                    : "bg-slate-50/40 border-slate-150 hover:bg-slate-50"
                )}
              >
                <div className="min-w-0 pr-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block leading-none mb-1">{p.category_name}</span>
                  <p className="font-bold text-sm text-slate-800 truncate leading-tight">{p.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn(
                    "font-bold text-xs px-2.5 py-1 rounded-full inline-block shadow-sm leading-none",
                    p.stock <= 0 
                      ? "bg-rose-100/90 text-rose-800 font-black border border-rose-200" 
                      : p.stock <= 5 
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                  )}>
                    {p.stock <= 0 ? 'Out of Stock' : `${p.stock} units`}
                  </span>
                </div>
              </div>
            ))}

            {lowStockProducts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
                <div className="w-12 h-12 rounded-full border border-dashed border-slate-200 flex items-center justify-center mb-2.5 bg-slate-50 text-emerald-500">
                  ✓
                </div>
                <p className="font-black text-xs uppercase tracking-wider text-slate-700">All Items Safe</p>
                <p className="text-[10px] text-slate-500">Every product is above the low stock limits.</p>
              </div>
            )}
          </div>

          {lowStockProducts.length > 6 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                to="/inventory"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider rounded-xl transition-colors"
              >
                View all {lowStockCount} alerts in Inventory
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

