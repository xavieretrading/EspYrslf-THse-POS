import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Info,
  Building2,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
  const { activeBranch, setActiveBranch, branches } = useBranch();
  const isLaundryBranch = activeBranch?.name?.toLowerCase().includes('laundry') || activeBranch?.name?.toLowerCase().includes('s1p') || activeBranch?.name?.toLowerCase().includes('spin');
  const [summary, setSummary] = useState<any>({});
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branchesSales, setBranchesSales] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Date filters states
  const [dateFilterType, setDateFilterType] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [startDateInput, setStartDateInput] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDateInput, setEndDateInput] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const getDateRangeParams = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateFilterType === 'today') {
      return { start: todayStr, end: todayStr };
    } else if (dateFilterType === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { start: d.toISOString().split('T')[0], end: todayStr };
    } else if (dateFilterType === 'month') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { start: d.toISOString().split('T')[0], end: todayStr };
    } else {
      return { start: startDateInput, end: endDateInput };
    }
  };

  useEffect(() => {
    const { start, end } = getDateRangeParams();
    fetch(`/api/reports/branches-sales?start_date=${start}&end_date=${end}`)
      .then(res => res.json())
      .then(data => setBranchesSales(data || []))
      .catch(err => console.error("Error fetching branches sales:", err));
  }, [activeBranch, dateFilterType, startDateInput, endDateInput]);

  useEffect(() => {
    if (!activeBranch) return;
    setIsLoading(true);

    const { start, end } = getDateRangeParams();

    // Fetch sales reports
    fetch(`/api/reports/sales?branch_id=${activeBranch.id}&start_date=${start}&end_date=${end}`)
      .then(res => res.json())
      .then(data => {
        setSummary(data.summary || {});
        setDailySales((data.dailySales || []).reverse());
        setPayments(data.payments || []);
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
  }, [activeBranch, dateFilterType, startDateInput, endDateInput]);

  // Inventory computations
  const totalStockItems = products.length;
  const totalStockQty = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.cost || 0)), 0);

  // Low stock is items with stock <= 10
  const lowStockProducts = products.filter(p => (p.stock || 0) <= 10).sort((a, b) => a.stock - b.stock);
  const lowStockCount = lowStockProducts.length;

  // Sorting branches by sales (Big Sales vs Small Sales)
  const sortedBranchesSales = [...branchesSales]
    .filter(b => b.name !== '__SYSTEM_CONFIG__')
    .sort((a, b) => b.totalSales - a.totalSales);

  // Division data computation
  const coffeeSales = summary.coffee_sales_total || 0;
  const laundrySales = summary.laundry_sales_total || 0;
  const totalDivisionSales = coffeeSales + laundrySales;

  const divisionData = [
    { name: 'Coffee Shop', value: coffeeSales, color: '#f59e0b' },
    { name: 'Laundry', value: laundrySales, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  // Payments chart data computation
  const paymentChartData = payments.map((p, idx) => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
    return {
      name: p.method,
      value: p.amount,
      color: colors[idx % colors.length]
    };
  }).filter(p => p.value > 0);

  // Branches sales chart data computation
  const branchChartColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];
  const branchChartData = sortedBranchesSales.map((b, idx) => ({
    name: b.name,
    value: b.totalSales,
    color: branchChartColors[idx % branchChartColors.length]
  })).filter(b => b.value > 0);

  const totalBranchSales = branchChartData.reduce((sum, b) => sum + b.value, 0);

  return (
    <div className="h-[calc(100vh-16px)] md:h-screen w-full p-4 flex flex-col font-sans bg-slate-50 overflow-y-auto custom-scrollbar">
      {/* Header Section */}
      <div className="pl-12 lg:pl-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3 mb-3 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 size={24} className="text-slate-800" />
            Executive Platform Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-semibold">Real-time Multi-Branch Sales Aggregation & Branch Diagnostics</p>
        </div>

        {/* Branch Selector Dropdown */}
        {activeBranch && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Branch Detail View:</span>
            <select
              value={activeBranch.id}
              onChange={(e) => {
                const selected = branches.find(b => b.id === parseInt(e.target.value));
                if (selected) setActiveBranch(selected);
              }}
              className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-black uppercase text-slate-800 tracking-wider shadow-xs outline-none cursor-pointer hover:bg-slate-50"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Date Range Selector Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-2xl shadow-xs mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sales Period:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            {(['today', 'week', 'month', 'custom'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setDateFilterType(type)}
                className={cn(
                  "px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-[0.98]",
                  dateFilterType === type
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                {type === 'today' ? 'Today' : type === 'week' ? 'This Week' : type === 'month' ? 'This Month' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date range inputs */}
        {dateFilterType === 'custom' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">From:</span>
              <input
                type="date"
                value={startDateInput}
                onChange={e => setStartDateInput(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">To:</span>
              <input
                type="date"
                value={endDateInput}
                onChange={e => setEndDateInput(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 1: MULTI-BRANCH SALES SHARE & COMPARISON (GRAPHS & DUAL VIEW)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={18} className="text-emerald-600" />
              Multi-Branch Sales Share & Revenue Breakdown
            </h2>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Dual Visual Graph: Rectangular Bar Chart & Circle Share Chart for all branches</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              Total Revenue: ₱{totalBranchSales.toFixed(2)}
            </span>
          </div>
        </div>

        {branchChartData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            
            {/* COLUMN 1: Branch List & Rectangular Bar Chart */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  1. Branch Sales Ranking (Rectangular Graph)
                </span>
              </div>

              {/* Rectangular Bar Graph */}
              <div className="h-[150px] w-full bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchChartData} layout="vertical" margin={{ top: 5, right: 25, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tickFormatter={(val) => `₱${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} stroke="#94a3b8" fontSize={10} />
                    <YAxis dataKey="name" type="category" width={110} stroke="#475569" fontSize={10} tickLine={false} />
                    <Tooltip
                      formatter={(value: any) => [`₱${Number(value).toFixed(2)}`, 'Sales']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {branchChartData.map((entry, index) => (
                        <Cell key={`cell-bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Branch Breakdown List */}
              <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                {branchChartData.map((item) => {
                  const percent = totalBranchSales > 0 ? ((item.value / totalBranchSales) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }}></span>
                        <span className="text-xs font-bold text-slate-800 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-900">₱{item.value.toFixed(2)}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: Circle Donut / Pie Graph */}
            <div className="flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 self-start lg:self-center">
                2. Multi-Branch Sales Share (Circle Graph)
              </span>

              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={branchChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {branchChartData.map((entry, index) => (
                        <Cell key={`cell-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`₱${Number(value).toFixed(2)}`, 'Sales Share']}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {branchChartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 italic text-xs">
            No multi-branch sales recorded for the selected period.
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 2: DAILY SALES TRENDS & ACTIVE BRANCH FINANCIALS
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        
        {/* Daily Sales Trend Chart (Rectangular Bar Chart) - 2 Cols */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={16} className="text-blue-600" />
              Daily Sales Revenue Trend (Rectangular Graph)
            </h3>
            <span className="text-[10px] font-bold text-slate-400">{activeBranch?.name}</span>
          </div>

          <div className="h-[220px] w-full">
            {dailySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis tickFormatter={(val) => `₱${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-md text-xs font-bold text-slate-700 space-y-1">
                            <p className="text-slate-500 font-mono text-[10px] mb-1.5">{label}</p>
                            <div className="flex items-center gap-6 justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }}></span>
                                <span>Coffee Shop:</span>
                              </div>
                              <span className="font-mono text-slate-900">₱{Number(data.coffee || 0).toFixed(2)}</span>
                            </div>
                            {isLaundryBranch && (
                              <div className="flex items-center gap-6 justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3b82f6' }}></span>
                                  <span>Laundry:</span>
                                </div>
                                <span className="font-mono text-slate-900">₱{Number(data.laundry || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-6 justify-between border-t border-slate-100 pt-1.5 mt-1 text-slate-900 font-black">
                              <span>Daily Total:</span>
                              <span className="font-mono">₱{Number(data.total || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="coffee" fill="#f59e0b" stackId="a" name="Coffee Shop" radius={!isLaundryBranch ? [4, 4, 0, 0] : undefined} />
                  {isLaundryBranch && (
                    <Bar dataKey="laundry" fill="#3b82f6" stackId="a" name="Laundry" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
                No daily sales data available.
              </div>
            )}
          </div>
        </div>

        {/* Active Branch Financials & Payment Breakdown - 1 Col */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
              {activeBranch?.name || 'Branch'} Financials
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50/50 border border-emerald-100/60 p-2.5 rounded-xl flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Net Sales</span>
                <span className="text-sm font-black text-emerald-600 truncate mt-0.5">₱{(summary.total_sales || 0).toFixed(2)}</span>
              </div>
              <div className="bg-blue-50/50 border border-blue-100/60 p-2.5 rounded-xl flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Gross Sales</span>
                <span className="text-sm font-black text-blue-600 truncate mt-0.5">₱{(summary.gross_sales || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Circle Graph for Payments / Division */}
          <div className="border-t border-slate-100 pt-3">
            {isLaundryBranch ? (
              <>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Division Sales Split</p>
                {totalDivisionSales > 0 ? (
                  <div className="flex items-center justify-between gap-3 h-[110px]">
                    <div className="w-[110px] h-[110px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={divisionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={45}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {divisionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 justify-center">
                      {divisionData.map((item) => (
                        <div key={item.name} className="flex flex-col">
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                            <span className="text-[10px] font-bold text-slate-700">{item.name}</span>
                          </div>
                          <span className="text-xs font-black text-slate-900 pl-4 mt-0.5">₱{item.value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[110px] flex items-center justify-center text-slate-400 italic text-[10px]">
                    No division sales data.
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Payment Methods Breakdown</p>
                {paymentChartData.length > 0 ? (
                  <div className="flex items-center justify-between gap-3 h-[110px]">
                    <div className="w-[110px] h-[110px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={45}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {paymentChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 flex flex-col gap-1 justify-center max-h-[110px] overflow-y-auto custom-scrollbar">
                      {paymentChartData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                            <span className="text-[10px] font-bold text-slate-700">{item.name}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-900">₱{item.value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[110px] flex items-center justify-center text-slate-400 italic text-[10px]">
                    No payment data.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 3: BRANCH PERFORMANCE TABLE & STOCK WARNINGS (POSITIONED AT BOTTOM)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        
        {/* Branch Performance Comparison Table - 2 Cols */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                Multi-Branch Performance Comparison Table
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Ranking: Highest Sales (Big) to Lowest Sales (Small)</p>
            </div>
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-semibold text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="py-2 px-3">Branch Name</th>
                  <th className="py-2 px-3 text-right">Today Sales</th>
                  <th className="py-2 px-3 text-right">Total Revenue</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedBranchesSales.map((b, idx) => {
                  const hasSales = sortedBranchesSales[0]?.totalSales > 0;
                  const isTop = idx === 0 && b.totalSales > 0;
                  const isLowest = hasSales && idx === sortedBranchesSales.length - 1 && sortedBranchesSales.length > 1;
                  const isActive = b.id === activeBranch?.id;

                  return (
                    <tr
                      key={b.id}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors",
                        isActive && "bg-slate-100/50"
                      )}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-1.5 min-w-[150px]">
                        <span>{b.name}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">₱{b.todaySales.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">₱{b.totalSales.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center min-w-[100px]">
                        {isTop ? (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full inline-flex items-center gap-0.5 border border-emerald-200">
                            Big Sales
                          </span>
                        ) : isLowest ? (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full inline-flex items-center gap-0.5 border border-rose-200">
                            Small Sales
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full inline-flex items-center gap-0.5 border border-slate-200">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            const found = branches.find(br => br.id === b.id);
                            if (found) setActiveBranch(found);
                          }}
                          disabled={isActive}
                          className={cn(
                            "px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border transition-all active:scale-[0.96] tracking-wider cursor-pointer",
                            isActive
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          Analyze
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {sortedBranchesSales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">No branch transactions found yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Warnings - 1 Col (Positioned Below Main Graphs) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col max-h-[300px]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3 shrink-0">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-amber-500" />
              Stock Warnings ({activeBranch?.name})
            </h3>
            <span className={cn(
              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-center leading-none border",
              lowStockCount > 0 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            )}>
              {lowStockCount} Alerts
            </span>
          </div>

          {/* Warning notes */}
          {lowStockCount > 0 && (
            <div className="mb-2 bg-amber-50/50 border border-amber-200/50 p-2 rounded-xl flex items-start gap-2 shrink-0">
              <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[9px] text-amber-800 leading-normal font-semibold">
                Items requiring replenishment to prevent POS lockouts.
              </p>
            </div>
          )}

          {/* List container */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {lowStockProducts.map(p => (
              <div
                key={p.id}
                className={cn(
                  "p-2 rounded-xl border transition-all flex justify-between items-center text-[11px]",
                  p.stock <= 0
                    ? "bg-rose-50/40 border-rose-100 hover:bg-rose-50"
                    : "bg-slate-50/40 border-slate-150 hover:bg-slate-50"
                )}
              >
                <div className="min-w-0 pr-2">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block leading-none mb-0.5">{p.category_name}</span>
                  <p className="font-bold text-slate-800 truncate leading-tight">{p.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn(
                    "font-bold text-[10px] px-2 py-0.5 rounded-full inline-block shadow-xs border leading-none",
                    p.stock <= 0
                      ? "bg-rose-100/90 text-rose-800 border-rose-200 font-black"
                      : "bg-amber-100 text-amber-800 border-amber-200"
                  )}>
                    {p.stock <= 0 ? 'Out' : `${p.stock} units`}
                  </span>
                </div>
              </div>
            ))}

            {lowStockProducts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-4">
                <div className="w-8 h-8 rounded-full border border-dashed border-slate-200 flex items-center justify-center mb-1.5 bg-slate-50 text-emerald-500 font-black text-xs">
                  ✓
                </div>
                <p className="font-black text-[10px] uppercase tracking-wider text-slate-700">Stock Levels Safe</p>
                <p className="text-[9px] text-slate-500">All products are stocked above alert limits.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
