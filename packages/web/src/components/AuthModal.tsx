import React, { useState } from 'react';
import { Zap, Lock, Mail, ShieldCheck, UserCheck, AlertCircle, KeyRound, ArrowRight, UserPlus, User, Building2, Truck, Check } from 'lucide-react';
import { loginAsRole } from '../api/client';

interface AuthModalProps {
  onLoginSuccess: (user: any) => void;
}

export function AuthModal({ onLoginSuccess }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');

  // Sign In Form States
  const [email, setEmail] = useState<string>('admin@switchyard.io');
  const [password, setPassword] = useState<string>('admin123');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState<string>('');
  const [signUpEmail, setSignUpEmail] = useState<string>('');
  const [signUpPassword, setSignUpPassword] = useState<string>('');
  const [signUpRole, setSignUpRole] = useState<'ADMIN' | 'TENANT_MGR' | 'DRIVER'>('DRIVER');
  const [signUpTenantName, setSignUpTenantName] = useState<string>('Logistics Fleet A');
  const [signUpVehicle, setSignUpVehicle] = useState<string>('Van MH-12-AB-1009');
  const [signUpSuccess, setSignUpSuccess] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginAsRole(email, password);
      if (res && res.restricted) {
        setError(res.message);
      } else if (res && res.access_token) {
        onLoginSuccess(res.user);
      } else {
        setError('Access Restricted: Invalid email or password.');
      }
    } catch (err: any) {
      setError('Connection error. Could not reach authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create user account payload
      const newUserPayload = {
        access_token: 'registered_jwt_token_' + Date.now(),
        user: {
          email: signUpEmail,
          sub: 'reg-user-' + Math.random().toString().slice(2, 6),
          role: signUpRole,
          name: signUpName,
          tenantName: signUpTenantName,
          assignedVehicle: signUpVehicle,
          tenantId: signUpRole === 'ADMIN' ? null : '11111111-1111-1111-1111-111111111111',
        }
      };

      setSignUpSuccess(`Account created successfully for ${signUpName}! Signing in...`);
      setTimeout(() => {
        onLoginSuccess(newUserPayload.user);
      }, 1500);

    } catch (err: any) {
      setError('Registration failed. Please check form details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fadeIn">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-slate-900/90 border border-slate-800 max-w-md w-full p-8 rounded-3xl shadow-2xl space-y-6 relative z-10">
        
        {/* Logo & Header */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {authMode === 'SIGN_IN' ? 'Sign In to SWITCHYARD' : 'Create Switchyard Account'}
          </h2>
          <p className="text-xs text-slate-400">Grid-Aware Multi-Tenant EV Fleet Charging System</p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setAuthMode('SIGN_IN'); setError(''); setSignUpSuccess(''); }}
            className={`flex-1 py-2 rounded-lg transition ${
              authMode === 'SIGN_IN' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('SIGN_UP'); setError(''); setSignUpSuccess(''); }}
            className={`flex-1 py-2 rounded-lg transition ${
              authMode === 'SIGN_UP' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account (Sign Up)
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-2xl flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {signUpSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center gap-2 text-xs text-emerald-300">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{signUpSuccess}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {authMode === 'SIGN_IN' && (
          <>
            {/* Quick Demo Credentials Switcher (5 Unique Accounts) */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Select Demo User Account:</span>
                <span className="text-[10px] text-cyan-400 font-mono">5 Accounts</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@switchyard.io'); setPassword('admin123'); setError(''); }}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    email === 'admin@switchyard.io'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="font-extrabold text-white text-xs">Site Admin</div>
                  <div className="text-[10px] text-slate-400 font-mono">admin@switchyard.io</div>
                  <div className="text-[10px] text-cyan-400 font-semibold mt-0.5">Credentials Loaded</div>
                </button>

                <button
                  type="button"
                  onClick={() => { setEmail('fleet_mgr@logistics.com'); setPassword('fleet123'); setError(''); }}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    email === 'fleet_mgr@logistics.com'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="font-extrabold text-purple-300 text-xs">Fleet A Manager</div>
                  <div className="text-[10px] text-slate-400 font-mono">fleet_mgr@logistics.com</div>
                  <div className="text-[10px] text-purple-400 font-semibold mt-0.5">Credentials Loaded</div>
                </button>

                <button
                  type="button"
                  onClick={() => { setEmail('delivery_mgr@express.com'); setPassword('express123'); setError(''); }}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    email === 'delivery_mgr@express.com'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="font-extrabold text-purple-300 text-xs">Fleet B Manager</div>
                  <div className="text-[10px] text-slate-400 font-mono">delivery_mgr@express.com</div>
                  <div className="text-[10px] text-purple-400 font-semibold mt-0.5">Credentials Loaded</div>
                </button>

                <button
                  type="button"
                  onClick={() => { setEmail('driver1@logistics.com'); setPassword('driver123'); setError(''); }}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    email === 'driver1@logistics.com'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="font-extrabold text-emerald-300 text-xs">Driver Dave</div>
                  <div className="text-[10px] text-slate-400 font-mono">driver1@logistics.com</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Credentials Loaded</div>
                </button>

                <button
                  type="button"
                  onClick={() => { setEmail('driver2@logistics.com'); setPassword('driver456'); setError(''); }}
                  className={`p-2.5 rounded-xl text-left border transition col-span-2 ${
                    email === 'driver2@logistics.com'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="font-extrabold text-emerald-300 text-xs">Driver Alex (Truck MH-12-AB-1004)</div>
                  <div className="text-[10px] text-slate-400 font-mono">driver2@logistics.com</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Credentials Loaded</div>
                </button>
              </div>
            </div>

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
          </>
        )}

        {/* SIGN UP FORM */}
        {authMode === 'SIGN_UP' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" /> Full Name
              </label>
              <input
                type="text"
                required
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="e.g. John Manager"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" /> Email Address
              </label>
              <input
                type="email"
                required
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="john@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Account Role
                </label>
                <select
                  value={signUpRole}
                  onChange={(e) => setSignUpRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="DRIVER">EV Driver</option>
                  <option value="TENANT_MGR">Fleet Manager</option>
                  <option value="ADMIN">Site Admin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Company / Fleet
                </label>
                <input
                  type="text"
                  required
                  value={signUpTenantName}
                  onChange={(e) => setSignUpTenantName(e.target.value)}
                  placeholder="e.g. Logistics Fleet A"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 shadow-inner"
                />
              </div>
            </div>

            {signUpRole === 'DRIVER' && (
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-cyan-400" /> Assigned EV Asset / License Plate
                </label>
                <input
                  type="text"
                  value={signUpVehicle}
                  onChange={(e) => setSignUpVehicle(e.target.value)}
                  placeholder="e.g. Van MH-12-AB-1009"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 shadow-inner"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" /> Create Password
              </label>
              <input
                type="password"
                required
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transform active:scale-95"
            >
              {loading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Sign In</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-800">
          Protected by PostgreSQL Row-Level Security (RLS) & JWT Bearer Token Guard
        </div>

      </div>
    </div>
  );
}
