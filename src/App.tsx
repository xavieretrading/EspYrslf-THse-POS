import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
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
  const isLaundryBranch = activeBranch?.name?.toLowerCase().includes('laundry') || activeBranch?.name?.toLowerCase().includes('s1p') || activeBranch?.name?.toLowerCase().includes('spin');
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
    { to: '/inventory', icon: Package, label: 'Inventory' },
    { to: '/branches', icon: Store, label: 'Branches' },
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
          <div className="p-3 pb-1.5">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5 min-w-0">
                <img src={isLaundryBranch ? "/s1p and sp1n.jpg" : "/logo.jpg"} alt="Logo" className="w-6 h-6 rounded-full object-cover border border-slate-700 bg-white" />
                <span className="truncate">{settings?.company_name || (isLaundryBranch ? 'S1p and Sp1n' : 'Espresso Yourself')}</span>
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
           {activeUser?.role === 'admin' && (
             <div className="bg-slate-800 rounded-lg p-1.5 border border-slate-700 mb-1.5">
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
           )}
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
          <div className="p-4 border-t border-slate-800 flex flex-col gap-2.5 font-sans mt-auto">
            {/* User Info (Moved Below Navigation) */}
            <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 flex flex-col font-sans mb-1 shadow-sm">
               <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                 Current User
               </label>
               <div className="text-xs text-white font-bold truncate">{activeUser?.full_name || activeUser?.email}</div>
               <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5 leading-none">{activeUser?.role}</div>
               <button 
                  onClick={onLogout}
                  className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] uppercase tracking-wider font-extrabold rounded-lg transition-colors min-h-[26px] active:scale-[0.98]"
               >
                  <LogOut size={12} /> Log Out
               </button>
            </div>


            <div className="text-[10px] text-slate-500 text-center">
              &copy; 2026 {isLaundryBranch ? 'S1p and Sp1n Laundry Shop' : 'Espresso Yourself & Tea House'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ProtectedRoute({ children, activeUser, path }: { children: React.ReactNode, activeUser: any, path: string }) {
  if (!activeUser) {
    return <Navigate to="/" replace />;
  }

  if (activeUser.role === 'admin') {
    return <>{children}</>;
  }

  const perms = activeUser.permissions;
  if (!perms) {
    return <>{children}</>;
  }

  let hasAccess = false;
  if (Array.isArray(perms)) {
    hasAccess = perms.includes(path);
  } else {
    const level = perms[path];
    hasAccess = level && level !== 'none';
  }

  if (!hasAccess) {
    const canAccessPos = Array.isArray(perms) ? perms.includes('/pos') : (perms['/pos'] && perms['/pos'] !== 'none');
    return <Navigate to={canAccessPos ? "/pos" : "/"} replace />;
  }

  return <>{children}</>;
}

function AppContent({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean, setIsSidebarOpen: (o: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeBranch, setActiveBranch, branches } = useBranch();
  const [activeUser, setActiveUser] = React.useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);

  React.useEffect(() => {
    const isLaundry = activeBranch?.name?.toLowerCase().includes('laundry') || activeBranch?.name?.toLowerCase().includes('s1p') || activeBranch?.name?.toLowerCase().includes('spin');
    
    let styleTag = document.getElementById('laundry-theme-override');
    if (isLaundry) {
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'laundry-theme-override';
        styleTag.innerHTML = `
          :root {
            --color-slate-50: #f8fafc !important;
            --color-slate-100: #f1f5f9 !important;
            --color-slate-200: #e2e8f0 !important;
            --color-slate-300: #cbd5e1 !important;
            --color-slate-400: #94a3b8 !important;
            --color-slate-500: #64748b !important;
            --color-slate-600: #475569 !important;
            --color-slate-700: #334155 !important;
            --color-slate-800: #1e293b !important;
            --color-slate-900: #0f172a !important;
            --color-slate-950: #020617 !important;
          }
          .bg-emerald-500 { background-color: #3b82f6 !important; }
          .bg-emerald-600 { background-color: #2563eb !important; }
          .bg-emerald-750 { background-color: #1d4ed8 !important; }
          .bg-emerald-50 { background-color: #eff6ff !important; }
          .bg-emerald-100 { background-color: #dbeafe !important; }
          .bg-emerald-500\\/10 { background-color: rgba(59, 130, 246, 0.1) !important; }
          .bg-emerald-600\\/10 { background-color: rgba(37, 99, 235, 0.1) !important; }
          .text-emerald-400 { color: #60a5fa !important; }
          .text-emerald-500 { color: #3b82f6 !important; }
          .text-emerald-600 { color: #2563eb !important; }
          .text-emerald-700 { color: #1d4ed8 !important; }
          .border-emerald-500 { border-color: #3b82f6 !important; }
          .border-emerald-600 { border-color: #2563eb !important; }
          .focus\\:border-emerald-500:focus { border-color: #3b82f6 !important; }
          .focus\\:ring-emerald-200:focus { --tw-ring-color: rgba(59, 130, 246, 0.2) !important; }
          .hover\\:bg-emerald-50:hover { background-color: #eff6ff !important; }
          .hover\\:bg-emerald-600:hover { background-color: #2563eb !important; }
          .hover\\:bg-emerald-700:hover { background-color: #1d4ed8 !important; }
          .hover\\:text-emerald-400:hover { color: #60a5fa !important; }
          .hover\\:text-emerald-500:hover { color: #3b82f6 !important; }
        `;
        document.head.appendChild(styleTag);
      }
    } else {
      if (styleTag) {
        styleTag.remove();
      }
    }
  }, [activeBranch]);

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
         navigate('/');
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
                  if (matchedUser.branch_id) {
                      const userBranch = branches.find(b => b.id.toString() === matchedUser.branch_id.toString());
                      if (userBranch) {
                          setActiveBranch(userBranch);
                      }
                  }
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
     navigate('/');
  };

  if (isAuthLoading) {
     return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Loading Session...</div>;
  }

  if (!activeUser) {
     return (
       <Login 
         onLogin={(user) => {
           setActiveUser(user);
           if (user?.role === 'admin' || user?.role === 'manager') {
             navigate('/');
           } else {
             navigate('/pos');
           }
         }} 
       />
     );
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
            "fixed top-4 left-4 z-40 p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg active:scale-95 transition-all border border-slate-700/50 flex items-center justify-center print:hidden",
            isSidebarOpen ? "opacity-0 pointer-events-none -translate-x-12" : "opacity-100 translate-x-0"
          )}
          title="Show Sidebar"
        >
          <Menu size={20} />
        </button>
        <Routes>
          <Route path="/" element={<ProtectedRoute activeUser={activeUser} path="/"><Dashboard /></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute activeUser={activeUser} path="/pos"><POS /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute activeUser={activeUser} path="/orders"><Orders /></ProtectedRoute>} />
          <Route path="/kitchen" element={<ProtectedRoute activeUser={activeUser} path="/kitchen"><Kitchen /></ProtectedRoute>} />
          <Route path="/tables" element={<ProtectedRoute activeUser={activeUser} path="/tables"><Tables /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute activeUser={activeUser} path="/inventory"><Inventory /></ProtectedRoute>} />
          <Route path="/branches" element={<ProtectedRoute activeUser={activeUser} path="/branches"><Branches /></ProtectedRoute>} />
          <Route path="/vouchers" element={<ProtectedRoute activeUser={activeUser} path="/vouchers"><Vouchers /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute activeUser={activeUser} path="/reports"><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute activeUser={activeUser} path="/settings"><Settings /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute activeUser={activeUser} path="/users"><UserManagement /></ProtectedRoute>} />
          <Route path="/redemption" element={<ProtectedRoute activeUser={activeUser} path="/redemption"><Redemption /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <BranchProvider>
      <SettingsProvider>
        <BrowserRouter>
          <div className="flex bg-slate-50 font-sans text-slate-900 relative">
             <AppContent isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
          </div>
        </BrowserRouter>
      </SettingsProvider>
    </BranchProvider>
  );
}
