import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Info,
  Building2,
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
  const outOfStockCount = products.filter(p => (p.stock || 0) <= 0).length;

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
    <div className="h-[calc(100vh-16px)] md:h-screen w-full p-4 flex flex-col font-sans bg-slate-50 overflow-hidden">
      {/* Header Section */}
      <div className="pl-12 lg:pl-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3 mb-3 flex-shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <Building2 className="text-slate-700" size={24} /> Executive Platform Dashboard
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-2xl shadow-xs mb-3 flex-shrink-0">
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

      {/* Main Grid Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 overflow-hidden">

        {/* Left Columns Container (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0 overflow-hidden">

          {/* Branch comparative Sales List (Big Sales vs Small Sales) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2 flex-shrink-0">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  Multi-Branch Performance Comparison
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Ranking: Highest Sales (Big) to Lowest Sales (Small)</p>
              </div>
              <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">Live aggregated</span>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs font-semibold text-slate-600">
                <thead className="sticky top-0 bg-white border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-2">Branch Name</th>
                    <th className="py-2 text-right">Today Sales</th>
                    <th className="py-2 text-right">Total Revenue</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="py-2 text-center">Actions</th>
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
                        <td className="py-2.5 font-bold text-slate-800 flex items-center gap-1.5 min-w-[150px]">
                          <span>{b.name}</span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                        </td>
                        <td className="py-2.5 text-right font-black text-slate-900">₱{b.todaySales.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-black text-slate-900">₱{b.totalSales.toFixed(2)}</td>
                        <td className="py-2.5 text-center min-w-[100px]">
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
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => {
                              const found = branches.find(br => br.id === b.id);
                              if (found) setActiveBranch(found);
                            }}
                            disabled={isActive}
                            className={cn(
                              "px-2 py-1 text-[10px] font-black uppercase rounded-lg border transition-all active:scale-[0.96] tracking-wider",
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
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">No branch transactions found yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock Alerts for Active Branch */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col h-[200px] flex-shrink-0">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3 flex-shrink-0">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                Stock Warnings
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
              <div className="mb-2 bg-amber-50/50 border border-amber-200/50 p-2 rounded-xl flex items-start gap-2 flex-shrink-0">
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

        {/* Right Column Container (1/3 width) */}
        <div className="flex flex-col gap-4 min-h-0 overflow-hidden">

          {/* Active Branch Summary Cards & Inline Division details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col flex-shrink-0">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
              {activeBranch?.name || 'Branch'} Financials
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/50 border border-emerald-100/60 p-2.5 rounded-xl flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Revenue</span>
                <span className="text-sm font-black text-emerald-600 truncate mt-0.5">₱{(summary.total_sales || 0).toFixed(2)}</span>
              </div>
              <div className="bg-blue-50/50 border border-blue-100/60 p-2.5 rounded-xl flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Gross Sales</span>
                <span className="text-sm font-black text-blue-600 truncate mt-0.5">₱{(summary.gross_sales || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Circle Graph (Pie/Doughnut Chart) */}
            <div className="border-t border-slate-100 pt-3 mt-3 flex flex-col gap-2">
              {isLaundryBranch ? (
                // Division Sales Doughnut Chart
                <>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Division Sales Split</p>
                  {totalDivisionSales > 0 ? (
                    <div className="flex items-center justify-between gap-4 h-[120px]">
                      <div className="w-[120px] h-[120px] shrink-0">
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
                            <Tooltip
                              formatter={(value: any) => `₱${Number(value).toFixed(2)}`}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 flex flex-col gap-2 justify-center">
                        {divisionData.map((item) => {
                          const percent = ((item.value / totalDivisionSales) * 100).toFixed(0);
                          return (
                            <div key={item.name} className="flex flex-col">
                              <div className="flex items-center gap-1.5 leading-none">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                                <span className="text-[10px] font-bold text-slate-700">{item.name}</span>
                                <span className="text-[9px] text-slate-400 font-bold ml-auto">{percent}%</span>
                              </div>
                              <span className="text-xs font-black text-slate-900 pl-4 mt-0.5">₱{item.value.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[120px] flex items-center justify-center text-slate-400 italic text-[10px]">
                      No division sales data available.
                    </div>
                  )}
                </>
              ) : (
                // Payment Methods Doughnut Chart
                <>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Payment Breakdown</p>
                  {paymentChartData.length > 0 ? (
                    <div className="flex items-center justify-between gap-4 h-[120px]">
                      <div className="w-[120px] h-[120px] shrink-0">
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
                            <Tooltip
                              formatter={(value: any) => `₱${Number(value).toFixed(2)}`}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5 justify-center max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                        {paymentChartData.map((item) => {
                          const totalPaymentsAmount = paymentChartData.reduce((sum, p) => sum + p.value, 0);
                          const percent = totalPaymentsAmount > 0 ? ((item.value / totalPaymentsAmount) * 100).toFixed(0) : '0';
                          return (
                            <div key={item.name} className="flex flex-col">
                              <div className="flex items-center gap-1.5 leading-none">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                                <span className="text-[9px] font-bold text-slate-700 truncate max-w-[80px]">{item.name}</span>
                                <span className="text-[8px] text-slate-400 font-bold ml-auto">{percent}%</span>
                              </div>
                              <span className="text-[10px] font-black text-slate-900 pl-3.5 mt-0.5">₱{item.value.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[120px] flex items-center justify-center text-slate-400 italic text-[10px]">
                      No transaction payments data available.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Multi-Branch Sales Share Pie/Doughnut Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col min-h-0 flex-1">
            <div className="flex justify-between items-center mb-2 flex-shrink-0 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                Multi-Branch Sales Share
              </h3>
              <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">Sales Comparison</span>
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-4 mt-2">
              {branchChartData.length > 0 ? (
                <>
                  <div className="h-[160px] w-full shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={branchChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {branchChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => `₱${Number(value).toFixed(2)}`}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {branchChartData.map((item) => {
                      const percent = ((item.value / totalBranchSales) * 100).toFixed(0);
                      return (
                        <div key={item.name} className="flex flex-col bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[180px]">{item.name}</span>
                            <span className="text-[9px] text-slate-400 font-bold ml-auto">{percent}%</span>
                          </div>
                          <span className="text-[11px] font-black text-slate-900 pl-4 mt-0.5">₱{item.value.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-xs py-8 text-center">
                  No branch sales data available for the selected period.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
