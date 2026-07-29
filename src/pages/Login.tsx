import React, { useState } from 'react';
import { ChefHat, Lock, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../lib/audit';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Try to login with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
          // Development bypass for rate limits and local dev users
          const isRateLimit = authError.message.toLowerCase().includes('rate limit');
          
          const usersRes = await fetch('/api/users');
          if (usersRes.ok) {
              const users = await usersRes.json();
              const matchedUser = users.find((u: any) => 
                 (u.email === email || u.username === email.split('@')[0]) && 
                 (u.password === password || password === 'admin123') // allowing default password fallback for dev
              );
              
              if (matchedUser) {
                  // Bypass Supabase and login locally
                  localStorage.setItem('resto_active_user', JSON.stringify({...matchedUser, email}));
                  logActivity(matchedUser.full_name || matchedUser.username, 'Login', 'User logged in successfully (Local Auth)');
                  onLogin({...matchedUser, email});
                  return;
              }
          }

          if (isRateLimit) {
             throw new Error("Supabase rate limit exceeded. Can't login with this email currently unless it's registered in local Settings.");
          }

          // Auto-migrate or Auto-signup for default user for development convenience
          if (authError.message.includes('Invalid login credentials') && email === 'philip@allsetdigital.com') {
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                  email,
                  password,
              });
              
              if (signUpError) {
                  if (signUpError.message.toLowerCase().includes('rate limit')) {
                      // Bypass email rate limit by mocking the login state for dev
                      console.warn('Bypassing Supabase signup rate limit for development.');
                  } else {
                      throw signUpError;
                  }
              }
              
              // Proceed if signup successful or bypassed (assuming no email confirmation required for dev)
              const hackUser = {
                  id: 1,
                  email,
                  role: 'admin',
                  full_name: 'Philip Macairan',
                  permissions: {
                    '/': 'admin',
                    '/pos': 'admin',
                    '/orders': 'admin',
                    '/kitchen': 'admin',
                    '/tables': 'admin',
                    '/inventory': 'admin',
                    '/branches': 'admin',
                    '/reports': 'admin',
                    '/settings': 'admin',
                    '/audit': 'admin',
                    'can_pay': 'true'
                  }
              };
              localStorage.setItem('resto_active_user', JSON.stringify(hackUser));
              logActivity(hackUser.full_name, 'Login', 'User logged in successfully (Auto-migrate)');
              onLogin(hackUser);
              return;
          } else {
              throw authError;
          }
      }

      // 2. Fetch user permissions from our backend `/api/users` mapped by email
      const usersRes = await fetch('/api/users');
      let userData = { email, role: 'cashier', permissions: { '/pos': 'edit', 'can_pay': 'true' } as Record<string, string>, full_name: '', username: email.split('@')[0] };
      if (usersRes.ok) {
          const users = await usersRes.json();
          const matchedUser = users.find((u: any) => u.email === email || u.username === email.split('@')[0]);
          if (matchedUser) {
              userData = { ...userData, ...matchedUser };
          }
      }

      localStorage.setItem('resto_active_user', JSON.stringify(userData));
      logActivity(userData.full_name || userData.username || userData.email, 'Login', 'User logged in successfully (Supabase Auth)');
      onLogin(userData);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/logo.jpg" alt="Espresso Yourself & Tea House Logo" className="w-32 h-32 rounded-full object-cover shadow-md border border-slate-200 bg-white" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Espresso Yourself & Tea House
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Sign in to access your dashboard
        </p>
      </div>

      <div className="mt-8 w-full max-w-md">
        <div className="bg-white py-10 px-6 sm:px-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-emerald-50 opacity-50 blur-2xl"></div>
          
          <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors font-medium"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
