import React, { useState } from 'react';
import { Zap, Lock, Mail, ShieldCheck, UserCheck, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import { loginAsRole } from '../api/client';

interface AuthModalProps {
  onLoginSuccess: (user: any) => void;
}

export function AuthModal({ onLoginSuccess }: AuthModalProps) {
  const [email, setEmail] = useState<string>('admin@switchyard.io');
  const [password, setPassword] = useState<string>('password123');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginAsRole(email, password);
      if (res && res.access_token) {
        onLoginSuccess(res.user || { email, role: 'ADMIN', name: 'System Admin' });
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      setError('Connection error. Could not reach authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fadeIn">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-slate-900/90 border border-slate-800 max-w-md w-full p-8 rounded-3xl shadow-2xl space-y-6 relative z-10">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white mb-1">
            <Zap className="h-8 w-8 fill-current" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Sign In to SWITCHYARD</h2>
          <p className="text-xs text-slate-400">Grid-Aware Multi-Tenant EV Fleet Charging System</p>
        </div>

        {/* Quick Demo Credentials Switcher */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Select Quick Demo Persona:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoSelect('admin@switchyard.io')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition ${
                email === 'admin@switchyard.io'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoSelect('fleet_mgr@logistics.com')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition ${
                email === 'fleet_mgr@logistics.com'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Fleet Mgr
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoSelect('driver1@logistics.com')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition ${
                email === 'driver1@logistics.com'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Driver
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-2xl flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition shadow-inner"
              placeholder="user@domain.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transform active:scale-95"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-800">
          Protected by PostgreSQL Row-Level Security (RLS) & JWT Bearer Token Guard
        </div>

      </div>
    </div>
  );
}
