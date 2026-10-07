import React, { useState } from 'react';
import { Briefcase, Lock, Mail } from 'lucide-react';
import { saveStaffSession } from '../lib/staffSession';
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
      // The server checks the password (hashed) and returns a login token for this device
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) throw new Error(data.error || 'Failed to login');

      const userData = { ...data.user, email: data.user.email || email.trim() };
      saveStaffSession(data.token, userData);
      logActivity(userData.full_name || userData.username || userData.email, 'Login', 'User logged in successfully');
      onLogin(userData);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-neutral-800 relative overflow-hidden">
      {/* Decorative gradient glowing spots */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-neutral-950/5 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-neutral-950 flex items-center justify-center shadow-2xl border border-amber-400/30">
            <Briefcase size={36} className="text-amber-400" />
          </div>
        </div>
        <h1 className="text-center text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight uppercase">
          Business Management <span className="text-amber-500">Platform</span>
        </h1>
        <p className="mt-2 text-center text-[10px] sm:text-xs font-semibold text-neutral-500 tracking-widest uppercase">
          Sign in to access your workspace
        </p>
      </div>

      <div className="mt-8 w-full max-w-md relative z-10">
        <div className="bg-neutral-950 py-10 px-6 sm:px-10 rounded-3xl shadow-2xl shadow-neutral-950/20 border border-amber-400/25 relative overflow-hidden">

          <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
            {error && (
              <div className="bg-rose-950/30 border border-rose-800/50 text-rose-400 px-4 py-3 rounded-xl text-xs font-bold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase text-amber-400 tracking-wider mb-2">
                Email Address / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-4 py-3 border border-neutral-800 rounded-xl bg-white focus:bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 sm:text-sm transition-all font-medium text-neutral-900 placeholder-neutral-400"
                  placeholder="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-amber-400 tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-4 py-3 border border-neutral-800 rounded-xl bg-white focus:bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 sm:text-sm transition-all font-medium text-neutral-900 placeholder-neutral-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-amber-500/10 text-xs font-black uppercase tracking-wider text-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-amber-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
