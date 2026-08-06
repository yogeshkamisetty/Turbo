import React, { useState, useEffect } from 'react'
import { Zap, Wifi, WifiOff, BatteryCharging, DollarSign, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import { powerData, energyByTenant, powerDistribution, heatmapData } from '../data/mock'

const KPI_BG_COLORS = [
  { from: 'rgba(0,230,118,0.12)', to: 'rgba(0,230,118,0.02)', border: 'rgba(0,230,118,0.2)', icon: '#00E676' },
  { from: 'rgba(59,130,246,0.12)', to: 'rgba(59,130,246,0.02)', border: 'rgba(59,130,246,0.2)', icon: '#3B82F6' },
  { from: 'rgba(239,68,68,0.12)', to: 'rgba(239,68,68,0.02)', border: 'rgba(239,68,68,0.2)', icon: '#EF4444' },
  { from: 'rgba(139,92,246,0.12)', to: 'rgba(139,92,246,0.02)', border: 'rgba(139,92,246,0.2)', icon: '#8B5CF6' },
  { from: 'rgba(245,158,11,0.12)', to: 'rgba(245,158,11,0.02)', border: 'rgba(245,158,11,0.2)', icon: '#F59E0B' },
  { from: 'rgba(20,184,166,0.12)', to: 'rgba(20,184,166,0.02)', border: 'rgba(20,184,166,0.2)', icon: '#14B8A6' },
]

function KPICard({ label, value, sub, icon: Icon, colorIdx }: { label: string; value: string; sub: string; icon: React.ElementType; colorIdx: number }) {
  const c = KPI_BG_COLORS[colorIdx]
  return (
    <div style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})`, border: `1px solid ${c.border}`, borderRadius: 12, padding: '1.125rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: `${c.icon}18`, border: `1px solid ${c.icon}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={c.icon} />
        </div>
      </div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.8rem', color: '#F9FAFB', lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#9CA3AF', fontSize: '0.78rem', marginTop: '0.35rem', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '0.72rem', marginTop: '0.2rem', fontFamily: 'JetBrains Mono, monospace', color: '#6B7280' }}>{sub}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 8, padding: '0.625rem 0.875rem', fontSize: '0.78rem' }}>
      <div style={{ color: '#6B7280', marginBottom: '0.375rem', fontFamily: 'JetBrains Mono, monospace' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: '#9CA3AF' }}>{p.name}:</span>
          <span style={{ color: '#F9FAFB', fontFamily: 'JetBrains Mono, monospace' }}>{p.value} MW</span>
        </div>
      ))}
    </div>
  )
}

const HEAT_TIMES = ['12AM', '3AM', '6AM', '9AM', '12PM', '3PM', '6PM', '9PM']
const HEAT_KEYS = ['h0', 'h3', 'h6', 'h9', 'h12', 'h15', 'h18', 'h21'] as const

function HeatCell({ val }: { val: number }) {
  const alpha = 0.08 + (val / 100) * 0.85
  return (
    <div style={{
      aspectRatio: '1',
      borderRadius: 4,
      background: val > 80 ? `rgba(0,230,118,${alpha})` : val > 60 ? `rgba(59,130,246,${alpha})` : val > 30 ? `rgba(245,158,11,${alpha})` : `rgba(107,114,128,${alpha})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.6rem',
      fontFamily: 'JetBrains Mono, monospace',
      color: val > 40 ? '#F9FAFB' : '#4B5563',
      fontWeight: 500,
    }}>{val}%</div>
  )
}

export default function Home() {
  const [liveKw, setLiveKw] = useState(14.8)
  const [onlineCount, setOnlineCount] = useState(118)

  useEffect(() => {
    const t = setInterval(() => {
      setLiveKw(prev => +(prev + (Math.random() - 0.5) * 0.4).toFixed(1))
      setOnlineCount(prev => Math.max(110, Math.min(124, prev + Math.floor((Math.random() - 0.5) * 2))))
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const kpis = [
    { label: 'Total Chargers', value: '125', sub: '7 offline', icon: Zap, colorIdx: 0 },
    { label: 'Online', value: String(onlineCount), sub: `${liveKw} MW active`, icon: Wifi, colorIdx: 1 },
    { label: 'Offline / Fault', value: '7', sub: '2 critical', icon: WifiOff, colorIdx: 2 },
    { label: 'Now Charging', value: '82', sub: '36 available', icon: BatteryCharging, colorIdx: 3 },
    { label: 'Monthly Revenue', value: '$52,400', sub: '+12.4% MoM', icon: DollarSign, colorIdx: 5 },
    { label: 'Optimization Rate', value: '94.2%', sub: 'Peak efficiency', icon: TrendingUp, colorIdx: 4 },
  ]

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F9FAFB' }}>Dashboard</h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>Live overview · Updated {new Date().toLocaleTimeString()}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {kpis.map(k => <KPICard key={k.label} {...k} />)}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Area chart — 2/3 */}
        <div className="card p-5 lg:col-span-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB' }}>Power Usage</div>
              <div style={{ color: '#6B7280', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>24h · MW · Today</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['1D', '7D', '30D'].map((p, i) => (
                <button key={p} style={{ padding: '0.2rem 0.6rem', borderRadius: 5, fontSize: '0.72rem', background: i === 0 ? 'rgba(0,230,118,0.15)' : 'transparent', color: i === 0 ? '#00E676' : '#4B5563', border: `1px solid ${i === 0 ? 'rgba(0,230,118,0.3)' : '#1F2937'}`, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={powerData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E676" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="time" tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} tickLine={false} interval={3} />
              <YAxis tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="power" name="Chargers" stroke="#00E676" strokeWidth={2} fill="url(#powerGrad)" dot={false} />
              <Area type="monotone" dataKey="grid" name="Grid" stroke="#3B82F6" strokeWidth={1.5} fill="url(#gridGrad)" dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — 1/3 */}
        <div className="card p-5">
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB', marginBottom: '0.25rem' }}>Power Distribution</div>
          <div style={{ color: '#6B7280', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: '1rem' }}>Live charger states</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={powerDistribution} cx="50%" cy="50%" innerRadius={44} outerRadius={68} paddingAngle={3} dataKey="value" stroke="none">
                {powerDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v}%`]} contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 8, fontSize: '0.78rem' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {powerDistribution.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{d.name}</span>
                <span style={{ fontSize: '0.7rem', color: '#6B7280', marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Bar chart */}
        <div className="card p-5">
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB', marginBottom: '0.25rem' }}>Energy by Tenant</div>
          <div style={{ color: '#6B7280', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: '1.25rem' }}>kWh · Current month</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={energyByTenant} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="tenant" tick={{ fill: '#4B5563', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} tickLine={false} />
              <YAxis tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 8, fontSize: '0.78rem' }} formatter={(v: any) => [`${v.toLocaleString()} kWh`]} />
              <Bar dataKey="energy" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                {energyByTenant.map((_, i) => <Cell key={i} fill={['#00E676', '#3B82F6', '#8B5CF6', '#F59E0B', '#14B8A6'][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Heat map */}
        <div className="card p-5">
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB', marginBottom: '0.25rem' }}>Peak Usage Heatmap</div>
          <div style={{ color: '#6B7280', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: '1rem' }}>% utilization by hour · Last 7 days</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(8, 1fr)', gap: '3px', alignItems: 'center' }}>
            <div />
            {HEAT_TIMES.map(t => <div key={t} style={{ fontSize: '0.6rem', color: '#4B5563', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>{t}</div>)}
            {heatmapData.map(row => (
              <React.Fragment key={row.day}>
                <div style={{ fontSize: '0.68rem', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', paddingRight: '0.25rem' }}>{row.day}</div>
                {HEAT_KEYS.map(k => <HeatCell key={k} val={row[k]} />)}
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.875rem', fontSize: '0.65rem', color: '#4B5563' }}>
            <span>Low</span>
            {[8, 30, 55, 75, 90].map(v => <HeatCell key={v} val={v} />)}
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  )
}
