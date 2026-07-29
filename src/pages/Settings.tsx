import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, Tag, LayoutGrid, Database, Plus, Edit, Trash2, X, CheckCircle, ClipboardList, Printer, Calendar, Filter, Archive, RefreshCw } from 'lucide-react';
import { useBranch } from '../BranchContext';
import { useSettings, BusinessSettings } from '../SettingsContext';
import { logActivity } from '../lib/audit';
import { cn } from '../App';

import { useNavigate } from 'react-router-dom';
import { swalAlert, swalConfirm } from '../lib/swal';

type User = { id: number; username: string; email?: string; role: string; full_name: string; branch_id: number; branch_name?: string; permissions?: Record<string, string> };

export default function Settings() {
  const { branches, activeBranch, refreshBranches } = useBranch();
  const { settings, refreshSettings } = useSettings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // User management state - REMOVED since it's a new page now

  // System Settings state
  const [sysConfig, setSysConfig] = useState<BusinessSettings>({
    company_name: '', tin: '', address: '', permit_number: '', ptu_date: '', pos_sn: '', min: '', business_style: '', service_charge_percentage: 0, report_start_time: '10:00', report_end_time: '06:00', service_charge_basis: 'vat_exclusive'
  });
  const [sysConfigSaved, setSysConfigSaved] = useState(false);
  const [isBirCompliant, setIsBirCompliant] = useState(false);

  useEffect(() => {
    if (activeBranch) {
      setIsBirCompliant(!!activeBranch.is_bir_compliant);
    }
  }, [activeBranch]);

  // Terminals Management state
  const [terminals, setTerminals] = useState<any[]>([]);
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<any | null>(null);
  const [terminalFormData, setTerminalFormData] = useState({ name: '', status: 'active' });

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditFilters, setAuditFilters] = useState({ user: '', startDate: '', endDate: '' });
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Archived Items state
  const [archivedItems, setArchivedItems] = useState<any[]>([]);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);

  const getManilaDate = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  };

  const fetchAuditLogs = async () => {
    setIsAuditLoading(true);
    setAuditError(null);
    try {
      let url = '/api/audit-logs?';
      if (auditFilters.user) url += `user=${encodeURIComponent(auditFilters.user)}&`;
      if (auditFilters.startDate) url += `start_date=${auditFilters.startDate}&`;
      if (auditFilters.endDate) url += `end_date=${auditFilters.endDate}&`;

      const res = await fetch(url);
      if (res.ok) {
        setAuditLogs(await res.json());
      } else {
        const errData = await res.json().catch(() => ({}));
        setAuditError(errData.error || 'Failed to fetch audit logs');
      }
    } catch (err) {
      console.error('Audit Fetch Error:', err);
      setAuditError('Failed to connect to the server');
    } finally {
      setIsAuditLoading(false);
    }
  };

  const fetchArchivedItems = async () => {
    if (!activeBranch) return;
    setIsArchiveLoading(true);
    try {
      const res = await fetch(`/api/kds/archived?branch_id=${activeBranch.id}`);
      if (res.ok) setArchivedItems(await res.json());
    } finally {
      setIsArchiveLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
    if (activeTab === 'archive') {
      fetchArchivedItems();
    }
  }, [activeTab, auditFilters, activeBranch]);

  // Discounts Management state
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<any | null>(null);
  const [discountFormData, setDiscountFormData] = useState({ name: '', type: 'percentage', value: '', requires_id: false });

  const fetchDiscounts = async () => {
    const res = await fetch(`/api/discounts`);
    if (res.ok) setDiscounts(await res.json());
  };

  useEffect(() => {
    if (activeTab === 'discounts') {
      fetchDiscounts();
    }
  }, [activeTab]);

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingDiscount ? `/api/discounts/${editingDiscount.id}` : '/api/discounts';
    const method = editingDiscount ? 'PUT' : 'POST';

    // For specific configurations with activeBranch, we may or may not attach it.
    // BIR discounts are usually global, so we might pass branch_id: activeBranch?.id

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...discountFormData,
        branch_id: activeBranch?.id || null
      })
    });

    if (res.ok) {
      setIsDiscountModalOpen(false);
      fetchDiscounts();
    } else {
      const errorData = await res.json().catch(() => ({}));
      swalAlert('Save Failed', errorData.error || 'Unknown error', 'error');
    }
  };

  const handleDeleteDiscount = async (id: number) => {
    const isConfirm = await swalConfirm('Are you sure you want to delete this discount?');
    if (!isConfirm) return;
    const res = await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchDiscounts();
    } else {
      const errorData = await res.json().catch(() => ({}));
      swalAlert('Delete Failed', errorData.error || 'Unknown error', 'error');
    }
  };

  const openAddDiscount = () => {
    setEditingDiscount(null);
    setDiscountFormData({ name: '', type: 'percentage', value: '', requires_id: false });
    setIsDiscountModalOpen(true);
  };

  const openEditDiscount = (discount: any) => {
    setEditingDiscount(discount);
    setDiscountFormData({
      name: discount.name,
      type: discount.type,
      value: discount.value,
      requires_id: !!discount.requires_id
    });
    setIsDiscountModalOpen(true);
  };

  const fetchTerminals = async () => {
    const res = await fetch(`/api/terminals?branch_id=${activeBranch?.id || ''}`);
    if (res.ok) setTerminals(await res.json());
  };

  useEffect(() => {
    if (activeTab === 'terminals') {
      fetchTerminals();
    }
  }, [activeTab, activeBranch]);

  const handleSaveTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBranch) {
      swalAlert('Warning', 'Please select a branch first.', 'warning');
      return;
    }
    const url = editingTerminal ? `/api/terminals/${editingTerminal.id}` : '/api/terminals';
    const method = editingTerminal ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...terminalFormData, branch_id: activeBranch.id })
    });
    if (res.ok) {
      setIsTerminalModalOpen(false);
      fetchTerminals();
    } else {
      const errorData = await res.json().catch(() => ({}));
      swalAlert('Save Failed', errorData.error || 'Unknown error', 'error');
    }
  };

  const handleDeleteTerminal = async (id: number) => {
    const isConfirm = await swalConfirm('Are you sure you want to delete this terminal?');
    if (!isConfirm) return;
    const res = await fetch(`/api/terminals/${id}`, { method: 'DELETE' });
    if (res.ok) fetchTerminals();
  };

  const openAddTerminal = () => {
    setEditingTerminal(null);
    setTerminalFormData({ name: '', status: 'active' });
    setIsTerminalModalOpen(true);
  };

  const openEditTerminal = (terminal: any) => {
    setEditingTerminal(terminal);
    setTerminalFormData({ name: terminal.name, status: terminal.status });
    setIsTerminalModalOpen(true);
  };

  useEffect(() => {
    if (settings) {
      setSysConfig(settings);
    }
  }, [settings]);

  const handleSaveSysConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sysConfig)
    });

    if (activeBranch && activeBranch.is_bir_compliant !== isBirCompliant) {
      await fetch(`/api/branches/${activeBranch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_bir_compliant: isBirCompliant })
      });
      await refreshBranches();
    }
    if (res.ok) {
      const localUser = localStorage.getItem('resto_active_user');
      const currentUser = localUser ? JSON.parse(localUser) : null;
      logActivity(currentUser?.full_name || currentUser?.username || 'Admin', 'Update System Config', 'Updated business details and system configuration');

      refreshSettings();
      setSysConfigSaved(true);
      setTimeout(() => setSysConfigSaved(false), 3000);
    } else {
      swalAlert('Save Failed', 'Failed to save settings.', 'error');
    }
  };

  useEffect(() => {
    if (activeTab === 'discounts') {
      fetchDiscounts();
    }
  }, [activeTab]);

  const sections = [
    { id: 'menu', title: 'Menu Management', icon: LayoutGrid, description: 'Add, edit, or remove categories and products.', color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'tables', title: 'Table Setup', icon: Database, description: 'Configure restaurant layout and table numbers.', color: 'text-emerald-500', bg: 'bg-emerald-100' },
    { id: 'discounts', title: 'Discounts & Promos', icon: Tag, description: 'Manage BIR mandated discounts (Senior, PWD) and custom promos.', color: 'text-amber-500', bg: 'bg-amber-100' },
    { id: 'users', title: 'User Roles', icon: Users, description: 'Manage staff accounts, credentials, and access levels.', color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: 'terminals', title: 'POS Terminals', icon: LayoutGrid, description: 'Manage multiple POS terminals across branches.', color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { id: 'system', title: 'System Config', icon: SettingsIcon, description: 'Update receipt details, tax rates, and hardware settings.', color: 'text-slate-500', bg: 'bg-slate-100' },
    { id: 'audit', title: 'Activity Logs', icon: ClipboardList, description: 'View system audit trail and user activities.', color: 'text-rose-500', bg: 'bg-rose-100' },
    { id: 'archive', title: 'Orders Archive', icon: Archive, description: 'View completed and archived items from the kitchen.', color: 'text-emerald-500', bg: 'bg-emerald-100' }
  ];

  return (
    <div className="p-8 h-full flex flex-col bg-slate-50 relative">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-500">Configure your POS application.</p>
        </div>
        {activeTab && (
          <button onClick={() => setActiveTab(null)} className="text-sm font-bold bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-xl transition-colors">
            &larr; Back to Settings
          </button>
        )}
      </div>

      {!activeTab ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    if (section.id === 'users') {
                      navigate('/users');
                    } else {
                      setActiveTab(section.id);
                    }
                  }}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left flex flex-col gap-4 group"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${section.bg} ${section.color} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{section.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{section.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-12 bg-slate-900 rounded-3xl p-8 text-white flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">POS Pro</h3>
              <p className="text-slate-400 text-sm">Version 1.0.0 (Build 2026.03)</p>
            </div>
            <div className="flex gap-4">
              <a href="/AllSet-POS-User-Manual.pdf" download target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center">
                Download User Manual
              </a>
              <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors">
                Check for Updates
              </button>
            </div>
          </div>
        </>
      ) : activeTab === 'terminals' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">POS Terminals Management</h2>
            <button onClick={openAddTerminal} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm">
              <Plus size={16} /> Add Terminal
            </button>
          </div>
          <div className="mb-4">
            <p className="text-slate-500">Terminals for <span className="font-bold text-slate-700">{activeBranch?.name || 'Unknown Branch'}</span></p>
          </div>

          <div className="overflow-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-bold rounded-tl-xl">Terminal Name</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold rounded-tr-xl text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {terminals.map(terminal => (
                  <tr key={terminal.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">{terminal.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${terminal.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                        {terminal.status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2 justify-center">
                      <button onClick={() => openEditTerminal(terminal)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteTerminal(terminal.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {terminals.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">No terminals found for this branch.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'discounts' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Discounts & Promos</h2>
            <button onClick={openAddDiscount} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm">
              <Plus size={16} /> Add Discount
            </button>
          </div>

          <div className="overflow-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-bold rounded-tl-xl">Discount Name</th>
                  <th className="p-4 font-bold">Type</th>
                  <th className="p-4 font-bold">Value</th>
                  <th className="p-4 font-bold">Requires ID</th>
                  <th className="p-4 font-bold rounded-tr-xl text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discounts.map(discount => (
                  <tr key={discount.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{discount.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${discount.type === 'percentage' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                        {discount.type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      {discount.type === 'percentage' ? `${discount.value}%` : `₱${parseFloat(discount.value || 0).toFixed(2)}`}
                    </td>
                    <td className="p-4 text-slate-500">
                      {discount.requires_id ? <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">Yes</span> : <span className="text-slate-400">No</span>}
                    </td>
                    <td className="p-4 flex gap-2 justify-center">
                      <button onClick={() => openEditDiscount(discount)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteDiscount(discount.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {discounts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">No active discounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'system' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex-1 overflow-auto max-w-3xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Business Details</h2>
            <p className="text-slate-500 text-sm mt-1">These details will be displayed on the POS and printed receipts.</p>
          </div>

          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">BIR Strict Compliance Mode</h3>
                <p className="text-slate-500 text-sm mt-1">Enable strict adherence to EOPT and RMO 24-2023 for <span className="font-bold text-slate-700">{activeBranch?.name}</span>.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isBirCompliant} onChange={(e) => setIsBirCompliant(e.target.checked)} />
                <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            {isBirCompliant && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800">
                <p className="font-bold mb-1">Strict Mode Activated:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Official Receipts renamed to Sales Invoices</li>
                  <li>Strict VAT exemption rules applied before discounting</li>
                  <li>Invoice numbers only generated upon final payment</li>
                </ul>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveSysConfig} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 mb-2 block">Company Name</label>
                <input type="text" value={sysConfig.company_name} onChange={e => setSysConfig({ ...sysConfig, company_name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 mb-2 block">Address</label>
                <input type="text" value={sysConfig.address} onChange={e => setSysConfig({ ...sysConfig, address: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">TIN</label>
                <input type="text" value={sysConfig.tin} onChange={e => setSysConfig({ ...sysConfig, tin: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Permit Number</label>
                <input type="text" value={sysConfig.permit_number} onChange={e => setSysConfig({ ...sysConfig, permit_number: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">PTU Date Issued On</label>
                <input type="text" value={sysConfig.ptu_date} onChange={e => setSysConfig({ ...sysConfig, ptu_date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">POS SN</label>
                <input type="text" value={sysConfig.pos_sn} onChange={e => setSysConfig({ ...sysConfig, pos_sn: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">MIN (Machine ID)</label>
                <input type="text" value={sysConfig.min} onChange={e => setSysConfig({ ...sysConfig, min: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Business Style</label>
                <input type="text" value={sysConfig.business_style} onChange={e => setSysConfig({ ...sysConfig, business_style: e.target.value })} placeholder="e.g. RESTAURANT" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Service Charge (%)</label>
                <input type="number" step="0.01" min="0" max="100" value={sysConfig.service_charge_percentage || 0} onChange={e => setSysConfig({ ...sysConfig, service_charge_percentage: parseFloat(e.target.value) || 0 })} placeholder="e.g. 5" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Service Charge Computation Basis</label>
                <div className="flex flex-wrap gap-4 items-center min-h-[50px]">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="service_charge_basis"
                      value="vat_exclusive"
                      checked={(sysConfig.service_charge_basis || 'vat_exclusive') === 'vat_exclusive'}
                      onChange={() => setSysConfig({ ...sysConfig, service_charge_basis: 'vat_exclusive' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    VAT-Exclusive Sales (Recommended)
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="service_charge_basis"
                      value="gross"
                      checked={sysConfig.service_charge_basis === 'gross'}
                      onChange={() => setSysConfig({ ...sysConfig, service_charge_basis: 'gross' })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    Gross Sales
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-100">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Report Operating Hours</h3>
                <p className="text-slate-500 text-sm mt-1">Define the time window for Z-Reading and daily reports (e.g., 10:00 AM to 06:00 AM).</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Start Time (24h)</label>
                  <input type="time" value={sysConfig.report_start_time || '10:00'} onChange={e => setSysConfig({ ...sysConfig, report_start_time: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">End Time (24h)</label>
                  <input type="time" value={sysConfig.report_end_time || '06:00'} onChange={e => setSysConfig({ ...sysConfig, report_end_time: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
              <div>
                {sysConfigSaved && <span className="text-emerald-600 font-bold flex items-center gap-2"><CheckCircle size={18} /> Settings Saved!</span>}
              </div>
              <button type="submit" className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all active:scale-[0.98]">
                Save Business Details
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === 'audit' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex-1 overflow-auto max-w-5xl mx-auto w-full">
          <div className="mb-8 flex justify-between items-start print:hidden">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Activity Logs & Audit Trail</h2>
              <p className="text-slate-500 text-sm mt-1">System audit logs showing time stamp, user ID, activity performed, and values involved.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors flex gap-2 items-center">
                <Printer size={16} /> Print
              </button>
              <button onClick={fetchAuditLogs} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 print:hidden">
            <div className="md:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Filter User</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select
                  value={auditFilters.user}
                  onChange={(e) => setAuditFilters({ ...auditFilters, user: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">All Users</option>
                  {[...new Set(auditLogs.map(l => l.user))].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Date From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="date"
                  value={auditFilters.startDate}
                  onChange={(e) => setAuditFilters({ ...auditFilters, startDate: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Date To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="date"
                  value={auditFilters.endDate}
                  onChange={(e) => setAuditFilters({ ...auditFilters, endDate: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setAuditFilters({ user: '', startDate: '', endDate: '' })}
                className="w-full py-2 bg-white text-slate-500 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="hidden print:block mb-8 text-center border-b-2 border-slate-900 pb-4">
            <h2 className="text-2xl font-black uppercase">System Audit Trail</h2>
            <p className="text-slate-600 mt-2">Generated exactly as of: {getManilaDate().toLocaleString()}</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 print:border-none print:shadow-none">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider print:bg-transparent print:border-b-2 print:border-slate-900">
                  <th className="p-4 font-bold">Date and Time Stamp</th>
                  <th className="p-4 font-bold">User Name / ID</th>
                  <th className="p-4 font-bold">Activity Performed</th>
                  <th className="p-4 font-bold">Values / Data Involved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm print:divide-slate-300">
                {auditLogs.length > 0 ? auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 print:break-inside-avoid">
                    <td className="p-4 whitespace-nowrap text-slate-500">{new Date(log.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}</td>
                    <td className="p-4 font-medium text-slate-900">{log.user}</td>
                    <td className="p-4 text-emerald-600 font-medium">{log.activity}</td>
                    <td className="p-4 text-slate-600 max-w-sm truncate whitespace-pre-wrap print:whitespace-normal">{log.details}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList size={48} className="opacity-10 mb-2" />
                        <p className="font-bold">No activity logs found.</p>
                        <p className="text-xs">System activities will appear here as users interact with the POS.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'archive' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex-1 overflow-auto max-w-5xl mx-auto w-full">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Orders/KDS Archive</h2>
              <p className="text-slate-500 text-sm mt-1">History of items processed and archived from the kitchen display server.</p>
            </div>
            <button onClick={fetchArchivedItems} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
              <RefreshCw size={16} className={cn(isArchiveLoading && "animate-spin")} />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Time Archived</th>
                  <th className="p-4 font-bold">Order ID</th>
                  <th className="p-4 font-bold">Item</th>
                  <th className="p-4 font-bold">Table/Type</th>
                  <th className="p-4 font-bold">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {archivedItems.length > 0 ? archivedItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-4 whitespace-nowrap text-slate-500">
                      {new Date(item.order_time).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-slate-900">#{item.order_id}</td>
                    <td className="p-4">
                      <span className="font-medium text-slate-900">{item.product_name}</span>
                      {item.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">{item.notes}</p>}
                    </td>
                    <td className="p-4 italic text-slate-500">{item.table_name || 'Take Out'}</td>
                    <td className="p-4 font-black text-slate-900">{item.quantity}x</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Archive size={48} className="opacity-10 mb-2" />
                        <p className="font-bold">No archived items found.</p>
                        <p className="text-xs">Items archived from the KDS will appear here.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 bg-white rounded-3xl border border-slate-200">
          <SettingsIcon size={48} className="mb-4 opacity-20" />
          <p className="text-center font-medium">This module is nothing to displayed</p>
          <p className="text-sm mt-2">Currently previewing {sections.find(s => s.id === activeTab)?.title}</p>
        </div>
      )}
      {/* Terminal Modal */}
      {isTerminalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full m-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingTerminal ? 'Edit Terminal' : 'Add Terminal'}</h2>

            <form onSubmit={handleSaveTerminal} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Terminal Name</label>
                <input type="text" required value={terminalFormData.name} onChange={e => setTerminalFormData({ ...terminalFormData, name: e.target.value })} placeholder="e.g. Counter 1, Kitchen Tablet" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Status</label>
                <select required value={terminalFormData.status} onChange={e => setTerminalFormData({ ...terminalFormData, status: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsTerminalModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all active:scale-[0.98]">Save Terminal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full m-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingDiscount ? 'Edit Discount' : 'Add Discount'}</h2>

            <form onSubmit={handleSaveDiscount} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Discount Name</label>
                <input type="text" required value={discountFormData.name} onChange={e => setDiscountFormData({ ...discountFormData, name: e.target.value })} placeholder="e.g. Senior Citizen, 10% Off" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1 block">Type</label>
                  <select required value={discountFormData.type} onChange={e => setDiscountFormData({ ...discountFormData, type: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₱)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1 block">Value</label>
                  <input type="number" required min="0" step="0.01" value={discountFormData.value} onChange={e => setDiscountFormData({ ...discountFormData, value: e.target.value })} placeholder="e.g. 20" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="requiresId"
                  checked={discountFormData.requires_id}
                  onChange={(e) => setDiscountFormData({ ...discountFormData, requires_id: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="requiresId" className="text-sm font-bold text-slate-700 cursor-pointer">Requires ID (e.g. Senior/PWD ID)</label>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsDiscountModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all active:scale-[0.98]">Save Discount</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
