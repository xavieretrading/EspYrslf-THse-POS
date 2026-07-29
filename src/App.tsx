import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Coffee, Package, FileText, Settings as SettingsIcon, Database, MapPin, Store, LogOut, Ticket, Users, Menu, ChefHat, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { BranchProvider, useBranch } from './BranchContext';
import { SettingsProvider, useSettings } from './SettingsContext';
import { supabase } from './lib/supabase';

import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Kitchen from './pages/Kitchen';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Tables from './pages/Tables';
import Branches from './pages/Branches';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Vouchers from './pages/Vouchers';
import UserManagement from './pages/UserManagement';
import Redemption from './pages/Redemption';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Sidebar({ activeUser, onLogout, isOpen, setIsOpen }: { activeUser: any, onLogout: () => void, isOpen: boolean, setIsOpen: (o: boolean) => void }) {
  const location = useLocation();
  const { branches, activeBranch, setActiveBranch, isLoading } = useBranch();
  const { settings } = useSettings();
  const [terminals, setTerminals] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (activeBranch) {
      fetch(`/api/terminals?branch_id=${activeBranch.id}`)
        .then(res => res.json())
        .then(data => setTerminals(data || []))
        .catch(console.error);
    } else {
      setTerminals([]);
    }
  }, [activeBranch]);

  const allLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pos', icon: ShoppingCart, label: 'POS' },
    { to: '/orders', icon: FileText, label: 'Orders' },
    { to: '/kitchen', icon: Coffee, label: 'Espresso Bar' },
    { to: '/tables', icon: Database, label: 'Tables' },
    { to: '/inventory', icon: Package, label: 'Inventory' },
    { to: '/branches', icon: Store, label: 'Branches' },
    { to: '/vouchers', icon: Ticket, label: 'Vouchers' },
    { to: '/redemption', icon: Ticket, label: 'Redemption' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/users', icon: Users, label: 'User Management' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const links = allLinks.filter(link => {
     if (!activeUser) return false;
     if (activeUser.role === 'admin') return true;
     
     const perms = activeUser.permissions;
     if (!perms) return true; // Default if no perms defined (backward compatibility)
     
     if (Array.isArray(perms)) {
        return perms.includes(link.to);
     }
     
     // New object format
     const level = perms[link.to];
     return level && level !== 'none';
  });

  if (isLoading) return <div className="w-52 bg-slate-900 h-screen"></div>;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={cn(
        "fixed lg:relative inset-y-0 left-0 bg-slate-900 text-slate-300 flex flex-col h-full z-50 transition-all duration-300 print:hidden shrink-0 overflow-hidden",
        isOpen ? "translate-x-0 w-52" : "-translate-x-full w-0"
      )}>
        <div className="w-52 flex flex-col h-full shrink-0">
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5 min-w-0">
                <img src="/logo.jpg" alt="Logo" className="w-6 h-6 rounded-full object-cover border border-slate-700 bg-white" />
                <span className="truncate">{settings?.company_name || 'Espresso'}</span>
              </h1>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors flex items-center justify-center"
                title="Hide Sidebar"
              >
                 <X size={16} />
              </button>
            </div>
          
          {/* Branch Selector */}
          <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 mb-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 block flex items-center gap-1 font-sans">
              <MapPin size={9} /> Current Branch
            </label>
            <select 
              className="w-full bg-transparent text-white font-medium outline-none appearance-none cursor-pointer text-xs font-sans"
              value={activeBranch?.id || ''}
              onChange={(e) => {
                const b = branches.find(br => br.id === parseInt(e.target.value));
                if (b) setActiveBranch(b);
              }}
            >
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-800 text-white">{b.name}</option>
              ))}
            </select>
          </div>

          {/* User Info */}
          <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 flex flex-col font-sans">
             <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Current User
             </label>
             <div className="text-xs text-white font-medium truncate">{activeUser?.full_name || activeUser?.email}</div>
             <div className="text-[10px] text-slate-405 uppercase tracking-wider mt-0.5 leading-none">{activeUser?.role}</div>
             <button 
                onClick={onLogout}
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold rounded-lg transition-colors min-h-[28px]"
             >
                <LogOut size={12} /> Log Out
             </button>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-1 custom-scrollbar font-sans">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <React.Fragment key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsOpen(false);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors min-h-[36px]",
                    isActive 
                      ? "bg-emerald-500/10 text-emerald-400 font-medium" 
                      : "hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon size={16} />
                  <span className="text-xs font-medium">{link.label}</span>
                </Link>
                {/* POS Terminals Sub-menu */}
                {link.to === '/pos' && isActive && terminals.length > 0 && (
                   <div className="pl-12 flex flex-col gap-1 py-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Terminals</p>
                      {terminals.map(terminal => (
                         <Link 
                           key={`term-${terminal.id}`} 
                           to={`/pos?terminal_id=${terminal.id}`}
                           onClick={() => {
                             if (window.innerWidth < 1024) {
                               setIsOpen(false);
                             }
                           }}
                           className={cn(
                             "text-xs px-3 py-2 rounded-lg transition-colors flex items-center min-h-[36px]",
                             location.search.includes(`terminal_id=${terminal.id}`) 
                               ? "bg-emerald-500/10 text-emerald-400 font-bold" 
                               : "text-slate-400 hover:bg-slate-800 hover:text-white"
                           )}
                         >
                           {terminal.name}
                           {!terminal.status || terminal.status === 'inactive' ? ' (Inactive)' : ''}
                         </Link>
                      ))}
                   </div>
                )}
              </React.Fragment>
            );
          })}
          </nav>
          <div className="p-4 border-t border-slate-800 flex flex-col gap-2 font-sans">
            <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-bold text-slate-300">Online</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400">
                v1.0.0
              </div>
            </div>
            <div className="text-[10px] text-slate-500 text-center">
              &copy; 2026 Espresso Yourself & Tea House
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AppContent({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean, setIsSidebarOpen: (o: boolean) => void }) {
  const location = useLocation();
  const [activeUser, setActiveUser] = React.useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  
  const isStandalonePOS = location.pathname.startsWith('/standalone-pos');
  const isStandaloneKitchen = location.pathname.startsWith('/standalone-kitchen');

  React.useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
         fetchUserProfile(session.user.email);
      } else {
         const localUser = localStorage.getItem('resto_active_user');
         if (localUser) {
             setActiveUser(JSON.parse(localUser));
         }
         setIsAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
         setActiveUser(null);
         localStorage.removeItem('resto_active_user');
      } else if (session?.user) {
         fetchUserProfile(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (email: string | undefined) => {
      if (!email) return;
      try {
          const res = await fetch('/api/users');
          if (res.ok) {
              const users = await res.json();
              const matchedUser = users.find((u: any) => u.email === email || u.username === email.split('@')[0]);
              let finalUser;
              if (matchedUser) {
                  finalUser = { ...matchedUser, email };
              } else {
                  finalUser = { email, role: 'cashier', permissions: ['/pos'] };
              }
              setActiveUser(finalUser);
              localStorage.setItem('resto_active_user', JSON.stringify(finalUser));
          }
      } catch (err) {
          console.error('Failed to fetch user profile', err);
      } finally {
          setIsAuthLoading(false);
      }
  };

  const handleLogout = async () => {
     await supabase.auth.signOut();
     localStorage.removeItem('resto_active_user');
     setActiveUser(null);
  };

  if (isAuthLoading) {
     return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Loading Session...</div>;
  }

  if (!activeUser) {
     return <Login onLogin={setActiveUser} />;
  }

  if (isStandalonePOS) {
    return (
      <main className="w-full h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 relative">
        <Routes>
          <Route path="/standalone-pos" element={<POS />} />
        </Routes>
      </main>
    );
  }

  if (isStandaloneKitchen) {
    return (
      <main className="w-full h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 relative">
        <Routes>
          <Route path="/standalone-kitchen" element={<Kitchen />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 relative w-full overflow-hidden">
      <Sidebar activeUser={activeUser} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="flex-1 overflow-auto print:overflow-visible transition-all duration-300 relative">
        {/* Sidebar Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className={cn(
            "fixed top-4 left-4 z-40 p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg active:scale-95 transition-all border border-slate-700/50 flex items-center justify-center",
            isSidebarOpen ? "opacity-0 pointer-events-none -translate-x-12" : "opacity-100 translate-x-0"
          )}
          title="Show Sidebar"
        >
          <Menu size={20} />
        </button>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/vouchers" element={<Vouchers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/redemption" element={<Redemption />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <SettingsProvider>
      <BranchProvider>
        <BrowserRouter>
          <div className="flex bg-slate-50 font-sans text-slate-900 relative">
             <AppContent isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
          </div>
        </BrowserRouter>
      </BranchProvider>
    </SettingsProvider>
  );
}
