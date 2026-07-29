import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, ArrowLeft, CheckCircle, Save, X, Shield, Lock } from 'lucide-react';
import { useBranch } from '../BranchContext';
import { logActivity } from '../lib/audit';
import { cn } from '../App';
import { useNavigate } from 'react-router-dom';
import { swalAlert, swalConfirm } from '../lib/swal';

type User = { 
  id: number; 
  username: string; 
  email?: string; 
  role: string; 
  full_name: string; 
  branch_id: number; 
  branch_name?: string; 
  permissions?: Record<string, string> 
};

export default function UserManagement() {
  const { branches } = useBranch();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    role: 'cashier', 
    full_name: '', 
    branch_id: '', 
    permissions: {} as Record<string, string> 
  });
  const [isSaved, setIsSaved] = useState(false);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        branch_id: formData.branch_id ? parseInt(formData.branch_id) : null
      })
    });

    if (res.ok) {
      const savedUser = await res.json();
      const localUser = localStorage.getItem('resto_active_user');
      const currentUser = localUser ? JSON.parse(localUser) : null;
      
      if (currentUser && (currentUser.email === formData.email || currentUser.username === formData.username)) {
        const updatedProfile = {
          ...currentUser,
          ...formData,
          id: editingUser ? editingUser.id : (savedUser.id || currentUser.id)
        };
        localStorage.setItem('resto_active_user', JSON.stringify(updatedProfile));
      }

      logActivity(
        currentUser?.full_name || currentUser?.username || 'Admin', 
        editingUser ? 'Update User' : 'Create User', 
        `${editingUser ? 'Updated' : 'Created'} user ${formData.username} (${formData.role})`
      );
      
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setIsEditing(false);
        fetchUsers();
      }, 1500);
    } else {
      const errorData = await res.json().catch(() => ({}));
      swalAlert('Save Failed', errorData.error || 'Unknown error', 'error');
    }
  };

  const handleDeleteUser = async (id: number) => {
    const isConfirm = await swalConfirm('Are you sure you want to delete this user?');
    if (!isConfirm) return;
    const userToDelete = users.find(u => u.id === id);
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
        const localUser = localStorage.getItem('resto_active_user');
        const currentUser = localUser ? JSON.parse(localUser) : null;
        logActivity(currentUser?.full_name || currentUser?.username || 'Admin', 'Delete User', `Deleted user ${userToDelete?.username}`);
        fetchUsers();
    }
  };

  const openAddUser = () => {
    setEditingUser(null);
    setFormData({ 
      username: '', 
      email: '', 
      password: '', 
      role: 'cashier', 
      full_name: '', 
      branch_id: '', 
      permissions: { '/pos': 'edit', 'can_pay': 'true' } 
    });
    setIsEditing(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      role: user.role,
      full_name: user.full_name || '',
      branch_id: user.branch_id?.toString() || '',
      permissions: user.permissions && !Array.isArray(user.permissions) ? user.permissions : {}
    });
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="p-8 bg-slate-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => setIsEditing(false)}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{editingUser ? 'Edit User' : 'New User Profile'}</h1>
              <p className="text-slate-500">Configure account details and access permissions.</p>
            </div>
          </div>

          <form onSubmit={handleSaveUser} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <Users size={20} />
                  <h2 className="font-bold">Account Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Username / Login ID</label>
                    <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Full Name</label>
                    <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Email Address</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 mb-2 block">
                      Password / PIN {editingUser && <span className="text-slate-400 font-normal ml-2">(Leave blank to keep current)</span>}
                    </label>
                    <input type="password" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 text-indigo-600 mb-6">
                  <Shield size={20} />
                  <h2 className="font-bold">Module Access Permissions</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: '/', label: 'Dashboard' },
                    { id: '/pos', label: 'POS' },
                    { id: '/orders', label: 'Orders' },
                    { id: '/kitchen', label: 'Kitchen' },
                    { id: '/tables', label: 'Tables' },
                    { id: '/inventory', label: 'Inventory' },
                    { id: '/branches', label: 'Branches' },
                    { id: '/vouchers', label: 'Vouchers' },
                    { id: '/redemption', label: 'Redemption' },
                    { id: '/reports', label: 'Reports' },
                    { id: '/settings', label: 'Settings' },
                    { id: '/audit', label: 'Activity Logs' }
                  ].map(mod => (
                    <div key={mod.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-slate-800">{mod.label}</span>
                      </div>
                      <div className="flex gap-1">
                        {[
                          { id: 'none', label: 'None' },
                          { id: 'view', label: 'View' },
                          { id: 'edit', label: 'Edit' },
                          { id: 'admin', label: 'Full' }
                        ].map(level => {
                          const isSelected = (formData.permissions?.[mod.id] || 'none') === level.id;
                          return (
                            <button
                              key={level.id}
                              type="button"
                              onClick={() => {
                                const newPerms = { ...formData.permissions };
                                if (level.id === 'none') delete newPerms[mod.id];
                                else newPerms[mod.id] = level.id;
                                setFormData({ ...formData, permissions: newPerms });
                              }}
                              className={cn(
                                "flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all border",
                                isSelected 
                                  ? "bg-slate-900 border-slate-900 text-white shadow-sm" 
                                  : "bg-white border-slate-200 text-slate-500 hover:border-emerald-500"
                              )}
                            >
                              {level.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center gap-2 text-orange-500 mb-2">
                  <Lock size={20} />
                  <h2 className="font-bold">Level & Scope</h2>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">System Role</label>
                  <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all">
                    <option value="admin">Administrator</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="waiter">Waiter</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Branch Assignment</label>
                  <select value={formData.branch_id} onChange={e => setFormData({...formData, branch_id: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all">
                    <option value="">All Branches</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id.toString()}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 text-emerald-600 mb-6">
                  <CheckCircle size={20} />
                  <h2 className="font-bold">Feature Overrides</h2>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">Payment Processing</span>
                    <span className="text-[10px] text-slate-400">Allow user to click 'Pay' in POS</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={formData.permissions?.can_pay !== 'false'} 
                    onChange={e => {
                      const newPerms = { ...formData.permissions };
                      newPerms.can_pay = e.target.checked ? 'true' : 'false';
                      setFormData({ ...formData, permissions: newPerms });
                    }}
                    className="w-6 h-6 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="sticky top-8 space-y-3">
                <button 
                  type="submit" 
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isSaved ? <CheckCircle size={20} /> : <Save size={20} />}
                  {isSaved ? 'User Saved!' : (editingUser ? 'Update Account' : 'Create Account')}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Discard Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full bg-slate-50 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-500">Manage staff accounts, credentials, and module access levels.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/settings')}
              className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              Back to Settings
            </button>
            <button 
              onClick={openAddUser}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl transition-all font-bold shadow-lg shadow-slate-900/10 active:scale-95"
            >
              <Plus size={18} /> New Staff Member
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-slate-400 text-[10px] uppercase tracking-widest">
                  <th className="px-8 py-5 font-black">Staff Member</th>
                  <th className="px-8 py-5 font-black">Role & Scope</th>
                  <th className="px-8 py-5 font-black">Email / Contact</th>
                  <th className="px-8 py-5 font-black text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                          <Users size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{user.full_name || user.username}</div>
                          <div className="text-xs text-slate-400">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                          user.role === 'admin' ? "bg-purple-100 text-purple-700" :
                          user.role === 'manager' ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-700"
                        )}>
                          {user.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{user.branch_name || 'Global Access'}</div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                      {user.email || 'No email provided'}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => openEditUser(user)}
                          className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Edit Permissions"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Remove User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-slate-400 italic">
                      No staff members registered. Click "New Staff Member" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
