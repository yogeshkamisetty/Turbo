import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line } from 'recharts';
import { ShieldCheck, Zap, AlertTriangle, HelpCircle, FileText, BarChart3, Shield, Info, Bot, Clock, Sparkles, RefreshCw, Layers, Cpu, Radio, Terminal, AlertCircle, LogOut, User, BatteryCharging, Building2, Truck, BellRing, DollarSign, Activity, CheckCircle2, ChevronRight, Database } from 'lucide-react';
import { loginAsRole, fetchSessions, fetchReceipt, fetchInvoice, fetchCopilotAnalysis, fetchBenchmark, createSocketConnection } from './api/client';
import { AuthModal } from './components/AuthModal';
import { DatabaseExplorer } from './components/DatabaseExplorer';
import { AdminControlModal } from './components/AdminControlModal';
import { UserManagementPanel } from './components/UserManagementPanel';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(true);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [siteCapacityKw, setSiteCapacityKw] = useState<number>(100);
  const [role, setRole] = useState<'ADMIN' | 'TENANT_MGR' | 'DRIVER'>('ADMIN');
  const [controlTier, setControlTier] = useState<number>(2);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'LIVE' | 'BENCHMARK' | 'DB_EXPLORER'>('LIVE');
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [copilotQuery, setCopilotQuery] = useState<string>('Why was my fleet throttled last night?');
  const [copilotResult, setCopilotResult] = useState<any>(null);
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);

  // Liveness & State
  const [sessions, setSessions] = useState<any[]>([]);
  const [registeredChargersCount, setRegisteredChargersCount] = useState<number>(8);
  const [companyFloors, setCompanyFloors] = useState<Record<string, number>>({
    'Logistics Fleet A': 40.0,
    'Delivery Express B': 30.0,
    'Green Transport C': 20.0,
  });
  // Pre-populated dynamic initial power history dataset for instant wave rendering
  const initialPowerData = [
    { time: '14:40:00', tenantA: 32.5, tenantB: 18.2, tenantC: 12.0, total: 62.7, cap: siteCapacityKw },
    { time: '14:40:10', tenantA: 38.0, tenantB: 22.4, tenantC: 15.5, total: 75.9, cap: siteCapacityKw },
    { time: '14:40:20', tenantA: 44.2, tenantB: 28.1, tenantC: 19.8, total: 92.1, cap: siteCapacityKw },
    { time: '14:40:30', tenantA: 41.7, tenantB: 25.1, tenantC: 18.3, total: 85.1, cap: siteCapacityKw },
    { time: '14:40:40', tenantA: 35.4, tenantB: 20.0, tenantC: 14.1, total: 69.5, cap: siteCapacityKw },
    { time: '14:40:50', tenantA: 43.8, tenantB: 29.5, tenantC: 21.0, total: 94.3, cap: siteCapacityKw },
  ];

  const [powerHistory, setPowerHistory] = useState<any[]>(initialPowerData);
  const [cycleCount, setCycleCount] = useState<number>(1);
  const [lastSocketTimestamp, setLastSocketTimestamp] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [eventFeed, setEventFeed] = useState<{ id: string; time: string; text: string; type: 'info' | 'warn' | 'success' }[]>([]);
  const [updatedSessionIds, setUpdatedSessionIds] = useState<Set<string>>(new Set());
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [benchmarkMetrics, setBenchmarkMetrics] = useState<any>(null);
  const [driverNotifications, setDriverNotifications] = useState<any[]>([
    { id: 1, time: '13:15', text: 'Charging started at 12.5 kW. Estimated full charge at 06:00 AM.', type: 'info' },
    { id: 2, time: '13:18', text: 'Power supply temporarily adjusted to 11.0 kW to prioritize emergency delivery vehicle departure.', type: 'warn' },
  ]);

  // Live 3-Second Real-Time Wave & Surges Power Update Tick
  useEffect(() => {
    let tickCount = 0;
    const liveInterval = setInterval(() => {
      tickCount++;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSocketTimestamp(Date.now());
      setCycleCount(c => c + 1);

      setPowerHistory(prev => {
        // Dynamic sine wave modulation + stochastic fleet load surges
        const waveA = 38.0 + 8.0 * Math.sin(tickCount * 0.4) + (Math.random() * 4 - 2);
        const waveB = 24.0 + 6.0 * Math.cos(tickCount * 0.3) + (Math.random() * 3 - 1.5);
        const waveC = 17.0 + 4.0 * Math.sin(tickCount * 0.5) + (Math.random() * 2 - 1.0);

        const newA = Math.max(25, Math.min(48, Number(waveA.toFixed(1))));
        const newB = Math.max(15, Math.min(35, Number(waveB.toFixed(1))));
        const newC = Math.max(10, Math.min(25, Number(waveC.toFixed(1))));
        const newTotal = Number((newA + newB + newC).toFixed(1));

        return [
          ...prev.slice(-15),
          {
            time: timeStr,
            tenantA: newA,
            tenantB: newB,
            tenantC: newC,
            total: newTotal,
            cap: siteCapacityKw
          }
        ];
      });
    }, 3000);

    return () => clearInterval(liveInterval);
  }, [siteCapacityKw]);

  // Pricing conditions for Admin (Represented Level-Wise: Tier 1, Tier 2, Tier 3)
  const pricingConditions = [
    {
      tier: 'Tier 1 Level',
      levelName: 'Tier 1: Peak Grid Stress',
      period: '18:00 - 22:00 (Evening Peak)',
      price: '₹11.80 / kWh',
      demandCharge: '₹15.00 / kW',
      carbon: '650 gCO2/kWh',
      status: 'High Load',
      badgeColor: 'bg-red-500/10 text-red-400 border-red-500/30'
    },
    {
      tier: 'Tier 2 Level',
      levelName: 'Tier 2: Standard Day Load',
      period: '06:00 - 10:00 & 16:00 - 18:00',
      price: '₹7.50 / kWh',
      demandCharge: '₹15.00 / kW',
      carbon: '420 gCO2/kWh',
      status: 'Normal Load',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    },
    {
      tier: 'Tier 3 Level',
      levelName: 'Tier 3: Green Solar & Off-Peak',
      period: '10:00 - 16:00 & 22:00 - 06:00',
      price: '₹4.10 / kWh',
      demandCharge: '₹15.00 / kW',
      carbon: '220 gCO2/kWh',
      status: 'Clean Surplus',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
  ];

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

        // Add notification for driver if kW rate changed due to priority
        if (data.allocatedKw < 12.5) {
          setDriverNotifications(prev => [
            { id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: `Power supply temporarily adjusted to ${data.allocatedKw} kW to prioritize high-priority emergency vehicle departure.`, type: 'warn' },
            ...prev
          ]);
        }
      });

      return () => { socket.disconnect(); };
    }

    loadUserData();
  }, [user]);

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    const newRole = loggedInUser.role || 'ADMIN';
    setRole(newRole);
    if (newRole === 'DRIVER') {
      setActiveTab('LIVE');
    }
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    setShowAuthModal(true);
    setSessions([]);
    setPowerHistory([]);
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

  // Comprehensive Driver Profiles Dictionary mapping distinct battery charging state to every user account
  const getUniqueDriverSession = (currentUser: any) => {
    const userEmail = currentUser?.email || 'driver1@logistics.com';

    const driverProfiles: Record<string, any> = {
      'driver1@logistics.com': {
        id: 's1',
        vehicle: 'Van MH-12-AB-1001',
        tenant: 'Logistics Fleet A',
        charger: 'CP-001',
        currentSoc: 42,
        targetSoc: 90,
        pluggedSoc: 15,
        allocatedKw: 12.5,
        estTimeRemaining: '1h 45m',
        state: 'Charging - Optimized',
        departureTime: '06:00 AM',
        priorityRank: 2,
      },
      'driver2@logistics.com': {
        id: 's4',
        vehicle: 'Heavy Truck MH-12-AB-1004',
        tenant: 'Logistics Fleet A',
        charger: 'CP-003',
        currentSoc: 68,
        targetSoc: 98,
        pluggedSoc: 20,
        allocatedKw: 18.2,
        estTimeRemaining: '0h 50m',
        state: 'Charging - Optimized',
        departureTime: '05:45 AM (Tight Priority #1)',
        priorityRank: 1,
      },
      'driver3@logistics.com': {
        id: 's2',
        vehicle: 'Van MH-12-AB-1002',
        tenant: 'Logistics Fleet A',
        charger: 'CP-002',
        currentSoc: 58,
        targetSoc: 85,
        pluggedSoc: 30,
        allocatedKw: 11.0,
        estTimeRemaining: '2h 10m',
        state: 'Throttled (Grid Limit)',
        departureTime: '06:30 AM',
        priorityRank: 3,
      },
      'driver_express1@express.com': {
        id: 's5',
        vehicle: 'Express Van B1 MH-14-XY-2001',
        tenant: 'Delivery Express B',
        charger: 'CP-005',
        currentSoc: 51,
        targetSoc: 88,
        pluggedSoc: 10,
        allocatedKw: 14.1,
        estTimeRemaining: '1h 20m',
        state: 'Charging - Optimized',
        departureTime: '06:15 AM',
        priorityRank: 1,
      },
    };

    if (driverProfiles[userEmail]) {
      return driverProfiles[userEmail];
    }

    // Dynamic unique fallback profile for newly registered users
    const vehicleName = currentUser?.assignedVehicle || `EV Asset ${currentUser?.name || 'User'}`;
    const chargerId = `CP-00${(userEmail.length % 6) + 1}`;
    const socVal = 35 + ((userEmail.length * 7) % 50);
    const kwVal = Number((10.0 + ((userEmail.length * 3) % 12)).toFixed(1));

    return {
      id: `s-dynamic-${userEmail}`,
      vehicle: vehicleName,
      tenant: currentUser?.tenantName || 'Logistics Fleet A',
      charger: chargerId,
      currentSoc: socVal,
      targetSoc: 92,
      pluggedSoc: 12,
      allocatedKw: kwVal,
      estTimeRemaining: `${Math.floor((92 - socVal) / 15)}h ${((92 - socVal) % 15) * 4}m`,
      state: 'Charging - Optimized',
      departureTime: '06:30 AM',
      priorityRank: 2,
    };
  };

  const driverSession = getUniqueDriverSession(user);

  const tenantSessions = user?.email === 'delivery_mgr@express.com'
    ? [
        { id: 's5', vehicle: 'Express Van B1 MH-14-XY-2001', tenant: 'Delivery Express B', charger: 'CP-005', currentSoc: 51, targetSoc: 88, allocatedKw: 14.1, state: 'Charging - Optimized', departureTime: '06:15 AM', priorityRank: 1 },
        { id: 's6', vehicle: 'Express Van B2 MH-14-XY-2002', tenant: 'Delivery Express B', charger: 'CP-006', currentSoc: 67, targetSoc: 82, allocatedKw: 11.0, state: 'Charging - Optimized', departureTime: '07:00 AM', priorityRank: 2 },
      ]
    : [
        { id: 's4', vehicle: 'Truck MH-12-AB-1004', tenant: 'Logistics Fleet A', charger: 'CP-003', currentSoc: 62, targetSoc: 95, allocatedKw: 18.2, state: 'Charging - Optimized', departureTime: '05:45 AM (Tight)', priorityRank: 1 },
        { id: 's1', vehicle: 'Van MH-12-AB-1001', tenant: 'Logistics Fleet A', charger: 'CP-001', currentSoc: 42, targetSoc: 90, allocatedKw: 12.5, state: 'Charging - Optimized', departureTime: '06:00 AM', priorityRank: 2 },
        { id: 's2', vehicle: 'Van MH-12-AB-1002', tenant: 'Logistics Fleet A', charger: 'CP-002', currentSoc: 58, targetSoc: 85, allocatedKw: 11.0, state: 'Throttled (Grid Limit)', departureTime: '06:30 AM', priorityRank: 3 },
        { id: 's3', vehicle: 'Van MH-12-AB-1003', tenant: 'Logistics Fleet A', charger: 'CP-004', currentSoc: 25, targetSoc: 80, allocatedKw: 0.0, state: 'Queued', departureTime: '07:15 AM (Flexible)', priorityRank: 4 },
      ];

  const handleUpdateSessionDeparture = (sessionId: string, newDeparture: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, departureTime: newDeparture };
      }
      return s;
    }));
    
    // Push WebSocket Live Event into event feed
    setEventFeed(prev => [
      {
        id: 'evt-' + Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        text: `WEBSOCKET LIVE UPDATE: EV Departure time updated to ${newDeparture}. Reactive MILP solver re-allocated kW power floors.`,
        type: 'info'
      },
      ...prev
    ]);
  };

  const latestPower = powerHistory.length > 0 ? powerHistory[powerHistory.length - 1] : { total: 85.1, cap: 100, tenantA: 41.7, tenantB: 25.1, tenantC: 18.3 };

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
            <Layers className="w-3.5 h-3.5" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('BENCHMARK')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${activeTab === 'BENCHMARK' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> ACN Benchmark
          </button>
          {role !== 'DRIVER' && (
            <button
              onClick={() => setActiveTab('DB_EXPLORER')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${activeTab === 'DB_EXPLORER' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" /> PostgreSQL DB Tables
            </button>
          )}
        </div>

        {/* Control Tier & Liveness Header Pill */}
        <div className="flex items-center space-x-3 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800/80 shadow-sm">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Updated {secondsAgo}s ago</span>
          </div>

          <div className="text-xs text-cyan-400 font-bold border-l border-slate-800 pl-3">
            Cycle #{cycleCount}
          </div>
        </div>

        {/* Logged In User Account & Role Badge */}
        {user ? (
          <div className="flex items-center space-x-3 bg-slate-900/90 p-1.5 pl-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 text-xs">
              <User className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-bold text-white leading-none">{user.name || user.email}</div>
                <div className="text-[10px] text-cyan-400 font-semibold">{user.role === 'ADMIN' ? 'Site Admin' : user.role === 'TENANT_MGR' ? 'Tenant Manager' : 'EV Driver'}</div>
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

      {/* Main Dashboard Container */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto z-10">

        {/* ========================================================================= */}
        {/* DASHBOARD 1: SITE ADMIN DASHBOARD (ADMIN Role)                            */}
        {/* ========================================================================= */}
        {role === 'ADMIN' && activeTab === 'LIVE' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-cyan-400" /> Site Admin Master Command Center
                </h2>
                <p className="text-xs text-slate-400">Total site capacity management, company power distribution & tariff conditions</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition transform active:scale-95"
                >
                  <Building2 className="w-4 h-4" /> Manage Sites & Chargers
                </button>
                <span className="text-xs px-3 py-2 rounded-xl bg-slate-900 text-cyan-400 border border-slate-800 font-bold">
                  Site Capacity: {siteCapacityKw} kW Contracted
                </span>
              </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Chargers</div>
                <div className="text-3xl font-black text-white mt-1.5">{registeredChargersCount} <span className="text-sm font-medium text-emerald-400">({registeredChargersCount} Online)</span></div>
                <div className="text-xs text-slate-400 mt-2">100% OCPP 1.6-J Compliant</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Companies</div>
                <div className="text-3xl font-black text-cyan-400 mt-1.5">{Object.keys(companyFloors).length} Fleets</div>
                <div className="text-xs text-slate-400 mt-2">D1 Entitlement Floors Active</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Power Consumption</div>
                <div className="text-3xl font-black text-white mt-1.5">{latestPower.total} kW</div>
                <div className="text-xs text-slate-400 mt-2">Peak Demand Target: 100 kW</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Billing & Credits</div>
                <button 
                  onClick={() => setShowInvoiceModal(true)}
                  className="mt-2 text-xs bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition"
                >
                  <FileText className="w-4 h-4" /> View Master Invoices
                </button>
              </div>
            </div>

            {/* Companies Consuming Power Breakdown */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" /> Companies Power Consumption & Entitlement Breakdown
                  </h3>
                  <p className="text-xs text-slate-400">Real-time fair surplus pool distribution & D1 entitlement floor compliance</p>
                </div>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  90 kW Total Guaranteed Floors
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Logistics Fleet A */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-cyan-500/40 transition shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-cyan-400">Logistics Fleet A</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: 11111111-1111...</div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      Floor Met (+1.7 kW Surplus)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">Allocated Draw:</span>
                      <span className="text-2xl font-black text-white">{latestPower.tenantA || 41.7} kW</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((latestPower.tenantA || 41.7) / 40.0) * 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Floor: {(companyFloors['Logistics Fleet A'] || 40.0).toFixed(1)} kW</span>
                      <span className="text-cyan-400 font-semibold">4 Active EVs</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-300">
                      <span>Surplus Participation:</span>
                      <span className="font-bold text-cyan-400">Borrowing Pool</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>3-Phase Split:</span>
                      <span className="font-mono text-slate-300">L1:13.9 | L2:13.9 | L3:13.9 kW</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Express B */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-purple-500/40 transition shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-purple-400">Delivery Express B</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: 22222222-2222...</div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Releasing 4.9 kW Surplus
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">Allocated Draw:</span>
                      <span className="text-2xl font-black text-white">{latestPower.tenantB || 25.1} kW</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((latestPower.tenantB || 25.1) / (companyFloors['Delivery Express B'] || 30.0)) * 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Floor: {(companyFloors['Delivery Express B'] || 30.0).toFixed(1)} kW</span>
                      <span className="text-purple-400 font-semibold">2 Active EVs</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 text-xs space-y-1.5">
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Surplus Headroom Credit:</span>
                      <span>+₹24.50 Earned</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>3-Phase Split:</span>
                      <span className="font-mono text-slate-300">L1:8.3 | L2:8.4 | L3:8.4 kW</span>
                    </div>
                  </div>
                </div>

                {/* Green Transport C */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-amber-500/40 transition shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-amber-400">Green Transport C</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: 33333333-3333...</div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Releasing 1.7 kW Surplus
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">Allocated Draw:</span>
                      <span className="text-2xl font-black text-white">{latestPower.tenantC || 18.3} kW</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((latestPower.tenantC || 18.3) / (companyFloors['Green Transport C'] || 20.0)) * 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Floor: {(companyFloors['Green Transport C'] || 20.0).toFixed(1)} kW</span>
                      <span className="text-amber-400 font-semibold">2 Active EVs</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 text-xs space-y-1.5">
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Surplus Headroom Credit:</span>
                      <span>+₹8.50 Earned</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>3-Phase Split:</span>
                      <span className="font-mono text-slate-300">L1:6.1 | L2:6.1 | L3:6.1 kW</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Stacked Power Graph */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Data Analysis & Site Load Graph</h2>
                  <p className="text-xs text-slate-400">Real-time fair allocation under 100 kW grid constraint</p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={powerHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 120]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '100 kW Site Limit', fill: '#ef4444', fontSize: 12, position: 'top', fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="tenantA" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.5} />
                    <Area type="monotone" dataKey="tenantB" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} />
                    <Area type="monotone" dataKey="tenantC" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Level-Wise Tiers 1, 2, 3 Pricing Conditions */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Time-of-Use Pricing According to Grid Conditions (Level-Wise Tiers 1, 2, 3)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pricingConditions.map((cond, idx) => (
                  <div key={idx} className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-cyan-500/40 transition">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${cond.badgeColor}`}>
                        {cond.tier}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{cond.status}</span>
                    </div>

                    <div>
                      <div className="text-sm font-extrabold text-white">{cond.levelName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{cond.period}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <div className="text-2xl font-black text-cyan-400">{cond.price}</div>
                      <div className="text-xs text-slate-400">Demand Charge: <strong className="text-slate-200">{cond.demandCharge}</strong></div>
                      <div className="text-[11px] text-slate-500">Carbon Intensity: <span className="text-amber-300 font-medium">{cond.carbon}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User & Driver Directory Management */}
            <UserManagementPanel currentRole="ADMIN" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* DASHBOARD 2: TENANT MANAGER DASHBOARD (TENANT_MGR Role)                   */}
        {/* ========================================================================= */}
        {role === 'TENANT_MGR' && activeTab === 'LIVE' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Truck className="w-6 h-6 text-purple-400" /> Fleet Manager Command Center — Logistics Fleet A
                </h2>
                <p className="text-xs text-slate-400">Electric consumption, vehicle timings, urgency priority queue & company cost breakdown</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold">
                Contracted Floor: 40 kW Guaranteed
              </span>
            </div>

            {/* Fleet Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fleet EV Electric Consumption</div>
                <div className="text-3xl font-black text-white mt-1.5">{latestPower.tenantA || 41.7} kW</div>
                <div className="text-xs text-slate-400 mt-2">142.5 kWh Delivered Today</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Fleet EVs</div>
                <div className="text-3xl font-black text-purple-400 mt-1.5">4 Vehicles</div>
                <div className="text-xs text-slate-400 mt-2">3 Charging, 1 Paused in 6A Queue</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Time Priority Queue</div>
                <div className="text-3xl font-black text-emerald-400 mt-1.5">High Laxity</div>
                <div className="text-xs text-slate-400 mt-2">Truck MH-12-AB-1004 Ranked #1</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Company Consumption Cost</div>
                <div className="text-2xl font-black text-cyan-400 mt-1">₹2,285.50</div>
                <button 
                  onClick={() => setShowInvoiceModal(true)}
                  className="mt-2 text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-2 rounded-xl shadow transition"
                >
                  View Invoice Details
                </button>
              </div>
            </div>

            {/* 6. Charging Session Board (State Lifecycle Board) */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" /> Charging Session Board (Real-Time State Lifecycle)
                  </h3>
                  <p className="text-xs text-slate-400">Mirrors exact OCPP 1.6-J hardware states across all site chargers</p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">Queued (1)</span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">Connected (1)</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Charging - Optimized (3)</span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">Throttled (Grid Limit) (1)</span>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">Complete (2)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Queued</div>
                  <div className="font-bold text-white">Van MH-12-AB-1003</div>
                  <div className="text-[11px] text-amber-400">0.0 kW (Waiting 6A Floor)</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-blue-500/30 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Connected</div>
                  <div className="font-bold text-white">CP-005 (Standby)</div>
                  <div className="text-[11px] text-slate-400">OCPP Cable Plugged</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Charging - Optimized</div>
                  <div className="font-bold text-white">Truck MH-12-AB-1004</div>
                  <div className="text-[11px] text-emerald-400">18.2 kW (Rank #1 MILP)</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Throttled (Grid Limit)</div>
                  <div className="font-bold text-white">Van MH-12-AB-1002</div>
                  <div className="text-[11px] text-amber-300">11.0 kW (Cap Protected)</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/30 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Complete</div>
                  <div className="font-bold text-white">Express Van B-04</div>
                  <div className="text-[11px] text-cyan-300">100% Target SoC Met</div>
                </div>
              </div>
            </div>

            {/* Timing of EVs & Priority Schedule Table */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" /> Timing of EVs & Time Priority Schedule
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Vehicle</th>
                      <th className="p-3">Charger</th>
                      <th className="p-3">Departure Time</th>
                      <th className="p-3">Target SoC</th>
                      <th className="p-3">Allocated kW</th>
                      <th className="p-3">Priority Rank</th>
                      <th className="p-3">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-200">
                    {tenantSessions.map((s, idx) => (
                      <tr key={s.id || idx} className="hover:bg-slate-900/50 transition">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5 text-cyan-400" /> {s.vehicle}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-300">{s.charger}</td>
                        <td className="p-3">
                          <input
                            type="text"
                            defaultValue={s.departureTime}
                            onBlur={(e) => handleUpdateSessionDeparture(s.id, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateSessionDeparture(s.id, (e.target as HTMLInputElement).value); }}
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none transition"
                          />
                        </td>
                        <td className="p-3 font-bold text-cyan-400">{s.targetSoc || 90}%</td>
                        <td className="p-3 font-bold text-emerald-400">{s.allocatedKw || 12.5} kW</td>
                        <td className="p-3 font-bold text-purple-400">Rank #{s.priorityRank || (idx + 1)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.state?.includes('Charging') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            s.state?.includes('Throttled') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {s.state || 'Charging - Optimized'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tenant Fleet Driver Directory */}
            <UserManagementPanel currentRole="TENANT_MGR" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* DASHBOARD 3: END USER / EV DRIVER DASHBOARD (DRIVER Role)                  */}
        {/* ========================================================================= */}
        {role === 'DRIVER' && activeTab === 'LIVE' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <BatteryCharging className="w-6 h-6 text-cyan-400" /> Driver Live Charging Hub — {driverSession.vehicle}
                </h2>
                <p className="text-xs text-slate-400">Live charging monitor for your assigned EV & real-time power supply change alerts</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                Connected to {driverSession.charger}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Single Vehicle Live Charging Meter */}
              <div className="md:col-span-2 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Live EV Battery Charging State</span>
                  <span className="text-xs font-mono text-cyan-400">Departure Target: {driverSession.departureTime}</span>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400">Current SoC Level:</span>
                    <span className="text-4xl font-black text-cyan-400">{driverSession.currentSoc || 42}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden p-1 border border-slate-700">
                    <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-700" style={{ width: `${driverSession.currentSoc || 42}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Plugged in at {driverSession.pluggedSoc || 15}%</span>
                    <span>Guaranteed Target: {driverSession.targetSoc || 90}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                    <div className="text-xs text-slate-400">Current Power Draw</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{driverSession.allocatedKw || 12.5} kW</div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                    <div className="text-xs text-slate-400">Est. Time Remaining</div>
                    <div className="text-2xl font-black text-cyan-400 mt-1">{driverSession.estTimeRemaining || '1h 45m'}</div>
                  </div>
                </div>
              </div>

              {/* Real-Time Power Supply Change Notification Feed */}
              <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-400" /> Power Supply Alerts
                </h3>
                <div className="space-y-3">
                  {driverNotifications.map((notif) => (
                    <div key={notif.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between text-slate-500 text-[10px]">
                        <span>System Alert</span>
                        <span>{notif.time}</span>
                      </div>
                      <div className={notif.type === 'warn' ? 'text-amber-300' : 'text-slate-200'}>
                        {notif.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Benchmark & Copilot Tabs */}
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
              </div>
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 text-center shadow-lg">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Demand Savings</div>
                <div className="text-3xl font-black text-cyan-400 mt-2">₹18,400 / mo</div>
              </div>
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 text-center shadow-lg">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Departure Compliance</div>
                <div className="text-3xl font-black text-purple-400 mt-2">98.5%</div>
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
                  <Line type="monotone" dataKey="uncontrolled" stroke="#ef4444" strokeWidth={2} name="Uncontrolled" />
                  <Line type="monotone" dataKey="naive" stroke="#f59e0b" strokeWidth={2} name="Naive Equal-Split" />
                  <Line type="monotone" dataKey="switchyard" stroke="#10b981" strokeWidth={3.5} name="Switchyard" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'DB_EXPLORER' && role !== 'DRIVER' && <DatabaseExplorer userRole={role} />}

      </main>

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

            <div className="flex gap-3">
              <button
                onClick={() => {
                  alert('Downloading Switchyard D1 Usage Invoice (PDF/CSV)...');
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold py-2.5 rounded-xl text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-cyan-400" /> Download Invoice
              </button>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-500/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Control Management Center Modal */}
      {showAdminModal && (
        <AdminControlModal
          onClose={() => setShowAdminModal(false)}
          onUpdateSiteCap={(newCap) => setSiteCapacityKw(newCap)}
          onAddCharger={(newCharger) => {
            setRegisteredChargersCount(prev => prev + 1);
            setEventFeed(prev => [{
              id: Math.random().toString(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              text: `Registered new OCPP charger ${newCharger.ocppId} (${newCharger.maxKw} kW) on ${newCharger.circuit}`,
              type: 'success'
            }, ...prev]);
          }}
          onUpdateEntitlement={(tenantName, newFloor) => {
            setCompanyFloors(prev => ({
              ...prev,
              [tenantName]: newFloor
            }));
            setEventFeed(prev => [{
              id: Math.random().toString(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              text: `Updated D1 Entitlement floor for ${tenantName} to ${newFloor} kW`,
              type: 'info'
            }, ...prev]);
          }}
        />
      )}

    </div>
  );
}
