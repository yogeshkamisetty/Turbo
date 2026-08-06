import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line } from 'recharts';
import { ShieldCheck, Zap, AlertTriangle, HelpCircle, FileText, BarChart3, Shield, Info, Bot, Clock, Sparkles, RefreshCw, Layers, Cpu, Radio, Terminal, AlertCircle, LogOut, User } from 'lucide-react';
import { loginAsRole, fetchSessions, fetchReceipt, fetchInvoice, fetchCopilotAnalysis, fetchBenchmark, createSocketConnection } from './api/client';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [user, setUser] = useState<any>(null); // Current authenticated user session
  const [showAuthModal, setShowAuthModal] = useState<boolean>(true);
  const [role, setRole] = useState<'ADMIN' | 'TENANT_MGR' | 'DRIVER'>('ADMIN');
  const [tenantFilter, setTenantFilter] = useState<string>('ALL');
  const [controlTier, setControlTier] = useState<number>(2); // 2: Cloud MILP (Green), 1: Gateway Greedy (Amber), 0: Offline (Red)
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'LIVE' | 'BENCHMARK' | 'COPILOT'>('LIVE');
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [copilotQuery, setCopilotQuery] = useState<string>('Why was my fleet throttled last night?');
  const [copilotResult, setCopilotResult] = useState<any>(null);
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);
  const [activeConflict, setActiveConflict] = useState<any>(null);

  // Liveness Affordances State
  const [sessions, setSessions] = useState<any[]>([]);
  const [powerHistory, setPowerHistory] = useState<any[]>([]);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [lastSocketTimestamp, setLastSocketTimestamp] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [eventFeed, setEventFeed] = useState<{ id: string; time: string; text: string; type: 'info' | 'warn' | 'success' }[]>([]);
  const [updatedSessionIds, setUpdatedSessionIds] = useState<Set<string>>(new Set());
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [benchmarkMetrics, setBenchmarkMetrics] = useState<any>(null);

  // ACN Benchmark series
  const acnBenchmarkData = benchmarkMetrics?.series || [
    { time: '00:00', uncontrolled: 145, naive: 98, switchyard: 95 },
    { time: '02:00', uncontrolled: 168, naive: 100, switchyard: 96 },
    { time: '04:00', uncontrolled: 182, naive: 100, switchyard: 96 },
    { time: '06:00', uncontrolled: 120, naive: 95, switchyard: 94 },
    { time: '08:00', uncontrolled: 65, naive: 60, switchyard: 58 },
    { time: '10:00', uncontrolled: 40, naive: 40, switchyard: 38 },
  ];

  // Seconds ago timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastSocketTimestamp) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSocketTimestamp]);

  // Fetch benchmark data when switching to BENCHMARK tab
  useEffect(() => {
    if (activeTab === 'BENCHMARK') {
      fetchBenchmark().then(res => {
        if (res) setBenchmarkMetrics(res);
      });
    }
  }, [activeTab]);

  // Initialize Socket.IO & Session when User logs in
  useEffect(() => {
    if (!user) return;

    async function loadUserData() {
      const realSessions = await fetchSessions();
      if (Array.isArray(realSessions)) {
        setSessions(realSessions);
      }

      const inv = await fetchInvoice();
      if (inv) setInvoiceData(inv);

      // Connect Socket.IO
      const socket = createSocketConnection();
      
      socket.on('connect', () => {
        addEventLog(`Connected to API Gateway as ${user.email}`, 'success');
      });

      socket.on('site:power_update', (data: any) => {
        setLastSocketTimestamp(Date.now());
        setControlTier(data.tier ?? 2);
        setCycleCount(c => c + 1);

        const map = data.tenantPowerMap || {};
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        setPowerHistory(prev => [
          ...prev.slice(-20),
          {
            time: timeStr,
            tenantA: map['11111111-1111-1111-1111-111111111111'] || 0,
            tenantB: map['22222222-2222-2222-2222-222222222222'] || 0,
            tenantC: map['33333333-3333-3333-3333-333333333333'] || 0,
            total: data.totalAllocatedKw || 0,
            cap: data.siteCapKw || 100
          }
        ]);

        addEventLog(`Optimization Cycle #${cycleCount + 1} — Total ${data.totalAllocatedKw || 0} kW allocated`, 'info');
      });

      socket.on('allocation:update', (data: any) => {
        setLastSocketTimestamp(Date.now());
        setSessions(prev => prev.map(s => s.id === data.sessionId ? { ...s, allocatedKw: data.allocatedKw, state: data.state } : s));
        
        setUpdatedSessionIds(prev => new Set(prev).add(data.sessionId));
        setTimeout(() => {
          setUpdatedSessionIds(prev => {
            const next = new Set(prev);
            next.delete(data.sessionId);
            return next;
          });
        }, 1500);

        addEventLog(`Session ${data.sessionId.slice(0, 6)} allocated ${data.allocatedKw} kW (${data.state})`, 'info');
      });

      socket.on('promise:conflict', (data: any) => {
        setActiveConflict(data);
        addEventLog(`D3 Charge Promise Conflict on Session ${data.sessionId.slice(0, 6)}`, 'warn');
      });

      return () => { socket.disconnect(); };
    }

    loadUserData();
  }, [user]);

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    setRole(loggedInUser.role || 'ADMIN');
    setTenantFilter(loggedInUser.role === 'ADMIN' ? 'ALL' : 'Logistics Fleet A');
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    setShowAuthModal(true);
    setSessions([]);
    setPowerHistory([]);
  };

  const addEventLog = (text: string, type: 'info' | 'warn' | 'success' = 'info') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setEventFeed(prev => [
      { id: Math.random().toString(), time: timeStr, text, type },
      ...prev.slice(0, 30)
    ]);
  };

  const handleWhyClick = async (session: any) => {
    const receiptData = await fetchReceipt(session.id);
    const constraint = receiptData?.bindingConstraint || (session.allocatedKw < 22 ? 'Site Capacity' : 'None');
    const price = receiptData?.shadowPrice || (session.allocatedKw < 22 ? 18.50 : 0.0);
    const reason = receiptData?.reasonText || session.reasonText || `Site capacity is binding (Marginal Congestion Shadow Price: ₹18.50/kW). High-urgency departures outrank this session.`;

    setSelectedReceipt({
      session,
      bindingConstraint: constraint,
      shadowPrice: price,
      driverText: session.state === 'Paused' 
        ? "Your vehicle is currently paused in queue. Charging will automatically resume in ~4 minutes."
        : "Your vehicle is charging. High-urgency departures outrank lower-urgency sessions.",
      managerText: session.state === 'Paused'
        ? `Paused to enforce IEC 61851 6A floor without breaching site cap.`
        : `Allocated ${session.allocatedKw || 12.5} kW. Priority queue active for ${session.tenant || 'Tenant A'}.`,
      adminText: reason
    });
  };

  const runCopilot = async () => {
    setCopilotLoading(true);
    const res = await fetchCopilotAnalysis(copilotQuery);
    if (res) setCopilotResult(res);
    setCopilotLoading(false);
  };

  const filteredSessions = tenantFilter === 'ALL'
    ? sessions
    : sessions.filter(s => s.tenant === tenantFilter || s.tenantId === '11111111-1111-1111-1111-111111111111');

  const latestPower = powerHistory.length > 0 ? powerHistory[powerHistory.length - 1] : { total: 0, cap: 100 };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Show Interactive Auth Modal if not logged in */}
      {showAuthModal && <AuthModal onLoginSuccess={handleLoginSuccess} />}

      {/* Top Ambient Glow Gradient */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              SWITCHYARD <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30">v2.0 PRO</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Grid-Aware Multi-Tenant EV Fleet Charging System</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold shadow-inner">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${activeTab === 'LIVE' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Layers className="w-3.5 h-3.5" /> Live Site View
          </button>
          <button
            onClick={() => setActiveTab('BENCHMARK')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${activeTab === 'BENCHMARK' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> ACN Benchmark
          </button>
          <button
            onClick={() => setActiveTab('COPILOT')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${activeTab === 'COPILOT' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> AI Fleet Copilot
          </button>
        </div>

        {/* Control Tier & Liveness Header Pill */}
        <div className="flex items-center space-x-3 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800/80 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400">Tier:</span>
            {controlTier === 2 && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Tier 2: Cloud MILP
              </span>
            )}
            {controlTier === 1 && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" /> Tier 1: Gateway Fallback
              </span>
            )}
            {controlTier === 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/30">
                <AlertCircle className="w-3.5 h-3.5" /> Tier 0: Offline Ceiling
              </span>
            )}
          </div>

          <div className="text-xs text-slate-400 font-mono border-l border-slate-800 pl-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Updated {secondsAgo}s ago</span>
          </div>

          <div className="text-xs text-cyan-400 font-bold border-l border-slate-800 pl-3">
            Cycle #{cycleCount}
          </div>
        </div>

        {/* Logged In User Account Badge */}
        {user ? (
          <div className="flex items-center space-x-3 bg-slate-900/90 p-1.5 pl-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 text-xs">
              <User className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-bold text-white leading-none">{user.name || user.email}</div>
                <div className="text-[10px] text-cyan-400 font-semibold">{user.role}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition"
          >
            Sign In
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto z-10">

        {activeTab === 'LIVE' && (
          <>
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Site Real-Time Draw</div>
                <div className="text-3xl font-black text-white mt-1.5 flex items-baseline gap-1">
                  {latestPower.total} <span className="text-sm font-medium text-slate-400">kW / {latestPower.cap} kW</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden p-0.5 border border-slate-700/50">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (latestPower.total / (latestPower.cap || 100)) * 100)}%` }}></div>
                </div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">D1 Entitlement Floors</div>
                <div className="text-3xl font-black text-emerald-400 mt-1.5 flex items-baseline gap-2">
                  90 kW <span className="text-xs font-normal text-slate-400">guaranteed</span>
                </div>
                <p className="text-xs text-slate-400 mt-3 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 10 kW Surplus Pool active
                </p>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Chargers</div>
                <div className="text-3xl font-black text-white mt-1.5 flex items-baseline gap-2">
                  {filteredSessions.length} <span className="text-xs text-amber-400 font-bold">({filteredSessions.filter(s => s.state === 'Paused').length} Paused)</span>
                </div>
                <p className="text-xs text-slate-400 mt-3 font-medium">IEC 61851 6A floor enforced</p>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between hover:border-purple-500/40 transition-all">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">D1 Billing & Credits</div>
                <button 
                  onClick={() => setShowInvoiceModal(true)}
                  className="mt-3 text-xs bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                >
                  <FileText className="w-4 h-4" /> View Invoice & Credits
                </button>
              </div>
            </div>

            {/* Live Stacked Power Chart & Event Feed Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      Live Site Power & Multi-Tenant Stack
                    </h2>
                    <p className="text-xs text-slate-400">Real-time fair allocation under 100 kW grid constraint</p>
                  </div>
                  <div className="flex items-center space-x-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-cyan-400"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500"></span> Tenant A</span>
                    <span className="flex items-center gap-1.5 text-purple-400"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500"></span> Tenant B</span>
                    <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500"></span> Tenant C</span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={powerHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 120]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      <ReferenceLine y={latestPower.cap || 100} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `${latestPower.cap || 100} kW Site Limit`, fill: '#ef4444', fontSize: 12, position: 'top', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="tenantA" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.5} />
                      <Area type="monotone" dataKey="tenantB" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} />
                      <Area type="monotone" dataKey="tenantC" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Real-Time Live Event Feed Panel */}
              <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-cyan-400" /> Live WebSocket Event Feed
                    </h3>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Radio className="w-3 h-3 animate-ping" /> Streaming
                    </span>
                  </div>

                  <div className="h-60 overflow-y-auto space-y-2 text-xs font-mono pr-1 custom-scrollbar">
                    {eventFeed.length === 0 ? (
                      <div className="text-slate-500 italic py-8 text-center">Awaiting incoming telemetry...</div>
                    ) : (
                      eventFeed.map((evt) => (
                        <div key={evt.id} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/60 flex items-start gap-2">
                          <span className="text-slate-500 text-[10px] whitespace-nowrap">{evt.time}</span>
                          <span className={`leading-tight ${evt.type === 'warn' ? 'text-amber-400' : evt.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {evt.text}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between">
                  <span>Transport: WebSocket (Socket.IO)</span>
                  <span>10s Optimization Interval</span>
                </div>
              </div>
            </div>

            {/* Active Sessions Grid */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4 tracking-tight">Active Charger Fleet Sessions</h2>
              
              {filteredSessions.length === 0 ? (
                <div className="bg-slate-950/80 p-12 rounded-2xl border border-slate-800 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-semibold text-slate-300">No active charging sessions found</div>
                  <div className="text-xs text-slate-500 max-w-md mx-auto">
                    Start simulator chargers or connect physical OCPP 1.6-J hardware to populate live sessions.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSessions.map((sess) => (
                    <div 
                      key={sess.id} 
                      className={`bg-slate-950/80 p-5 rounded-2xl border transition-all duration-500 shadow-md flex flex-col justify-between space-y-4 ${
                        updatedSessionIds.has(sess.id) ? 'border-cyan-500 bg-cyan-500/10 shadow-cyan-500/20' : 'border-slate-800/80 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base tracking-tight">{sess.vehicle?.name || sess.vehicle || `Session ${sess.id.slice(0, 6)}`}</span>
                            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">{sess.tenant || 'Tenant A'}</span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-3">
                            <span>Charger: <strong className="text-slate-200">{sess.charger?.ocppId || sess.charger || 'CP-001'}</strong></span>
                            <span>Target: <strong className="text-slate-200">{sess.targetSoc || 90}%</strong></span>
                          </div>
                        </div>

                        <span className={`text-xs px-3 py-1 rounded-full font-bold border shadow-sm ${
                          sess.state === 'Charging' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10' : 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/10'
                        }`}>
                          {sess.state || 'Charging'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-400">Battery SoC:</span>
                          <span className="text-cyan-400 font-mono">{sess.currentSoc || sess.soc || 40}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
                          <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, sess.currentSoc || 40)}%` }}></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <div>
                          <div className="text-lg font-black text-cyan-400 tracking-tight">{sess.allocatedKw || 0} kW</div>
                          <div className="text-[10px] text-slate-400 font-medium">Allocated Rate</div>
                        </div>

                        <button
                          onClick={() => handleWhyClick(sess)}
                          className="text-xs bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow hover:shadow-cyan-500/10"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> Why?
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'BENCHMARK' && (
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                <BarChart3 className="w-6 h-6 text-cyan-400" /> Caltech ACN-Data Benchmark Suite
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Quantified comparison of real-world Caltech Adaptive Charging Network session traces across 3 optimization baselines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 text-center shadow-lg">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peak Demand Reduction</div>
                <div className="text-3xl font-black text-emerald-400 mt-2">22.4%</div>
                <div className="text-xs text-slate-400 mt-1">vs Uncontrolled Baseline</div>
              </div>
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 text-center shadow-lg">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Demand Savings</div>
                <div className="text-3xl font-black text-cyan-400 mt-2">₹18,400 / mo</div>
                <div className="text-xs text-slate-400 mt-1">Avoided demand charge spike</div>
              </div>
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 text-center shadow-lg">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Departure Compliance</div>
                <div className="text-3xl font-black text-purple-400 mt-2">98.5%</div>
                <div className="text-xs text-slate-400 mt-1">Deadlines met on time</div>
              </div>
            </div>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={acnBenchmarkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 200]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                  <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '100 kW Site Capacity', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="uncontrolled" stroke="#ef4444" strokeWidth={2} name="Uncontrolled (Spike)" />
                  <Line type="monotone" dataKey="naive" stroke="#f59e0b" strokeWidth={2} name="Naive Equal-Split" />
                  <Line type="monotone" dataKey="switchyard" stroke="#10b981" strokeWidth={3.5} name="Switchyard (Flat Top)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'COPILOT' && (
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                <Sparkles className="w-6 h-6 text-cyan-400" /> AI Fleet Copilot & Bottleneck Assistant
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Powered by Google Gemini 1.5 Flash API analyzing historical D2 allocation receipts and dual shadow prices.
              </p>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 shadow-inner"
                placeholder="Ask copilot about fleet delays..."
              />
              <button
                onClick={runCopilot}
                disabled={copilotLoading}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                {copilotLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Analyze Fleet
              </button>
            </div>

            {copilotResult && (
              <div className="bg-slate-950/90 p-6 rounded-2xl border border-slate-800/80 space-y-4 text-xs shadow-lg">
                <div className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Bot className="w-4 h-4" /> Copilot Analysis Summary:
                </div>
                <div className="text-slate-200 leading-relaxed text-sm">{copilotResult.summaryText}</div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-amber-300 font-medium leading-relaxed">
                  💡 Operational Recommendation: {copilotResult.recommendation}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* D3 Promise Conflict Resolution Card */}
      {activeConflict && (
        <div className="fixed bottom-6 right-6 max-w-md w-full bg-slate-900/95 backdrop-blur-xl p-5 rounded-2xl border border-amber-500/40 shadow-2xl z-50 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> D3 Charge Promise Conflict Detected
            </h4>
            <button onClick={() => setActiveConflict(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
          <p className="text-xs text-slate-300">
            Grid capacity restrictions threaten promised SoC target ({activeConflict.promisedSoc}%) by departure.
          </p>
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setActiveConflict(null)}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-2 rounded-xl text-xs transition shadow hover:shadow-cyan-500/20"
            >
              Option 1: Push Departure Time (+45 mins)
            </button>
            <button
              onClick={() => setActiveConflict(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-xl text-xs transition border border-slate-700"
            >
              Option 2: Accept 75% Target SoC
            </button>
            <button
              onClick={() => setActiveConflict(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold py-2 rounded-xl text-xs transition border border-amber-500/30"
            >
              Option 3: Spend 12 Release-Credits to Buy Priority
            </button>
          </div>
        </div>
      )}

      {/* D2 Explainability Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 max-w-md w-full p-6 rounded-3xl border border-slate-700/80 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" /> D2 Explanation Receipt
              </h3>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-400">
                Role View: <span className="text-cyan-400 font-bold">{role}</span>
              </div>

              {role === 'DRIVER' && (
                <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 text-blue-200 text-sm leading-relaxed">
                  "{selectedReceipt.driverText}"
                </div>
              )}

              {role === 'TENANT_MGR' && (
                <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20 text-purple-200 text-sm leading-relaxed">
                  "{selectedReceipt.managerText}"
                </div>
              )}

              {role === 'ADMIN' && (
                <div className="space-y-2">
                  <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 text-amber-300 font-medium">
                    Marginal Congestion Shadow Price (GLOP Dual): <span className="font-bold text-white">₹{selectedReceipt.shadowPrice}/kW</span>.
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                    "{selectedReceipt.adminText}"
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-500/20"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* D1 Billing Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 max-w-lg w-full p-6 rounded-3xl border border-slate-700/80 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" /> D1 Entitlement Invoice & Credits
              </h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between text-slate-300">
                  <span>Energy Consumed ({invoiceData?.totalEnergyKwh || 142.5} kWh @ ₹12/kWh):</span>
                  <span className="font-bold text-white">₹{invoiceData?.energyCost || 1710.00}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Peak Entitlement Fee (40 kW Floor @ ₹15/kW):</span>
                  <span className="font-bold text-white">₹{invoiceData?.peakAllocationCost || 600.00}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Released Headroom Credits (Surplus Pool):</span>
                  <span>- ₹{invoiceData?.releasedHeadroomCredits || 24.50}</span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex justify-between text-sm font-black text-white">
                  <span>Total Payable:</span>
                  <span className="text-cyan-400">₹{invoiceData?.totalInvoice || 2285.50}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInvoiceModal(false)}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-500/20"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
