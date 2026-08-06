import { useState } from 'react'
import { BarChart2, Download, FileText, Calendar } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts'
import { powerData, energyByTenant } from '../data/mock'

const REPORT_TYPES = [
  { id: 'energy', label: 'Energy Consumption', desc: 'Total kWh by charger, tenant, and time period', color: '#00E676' },
  { id: 'sessions', label: 'Charging Sessions', desc: 'Session count, duration, and completion rates', color: '#3B82F6' },
  { id: 'revenue', label: 'Revenue Report', desc: 'Billing summary by tenant and time range', color: '#8B5CF6' },
  { id: 'efficiency', label: 'Grid Efficiency', desc: 'Load factor, peak demand, and optimization metrics', color: '#F59E0B' },
  { id: 'faults', label: 'Fault Analysis', desc: 'Downtime events, fault types, and MTTR stats', color: '#EF4444' },
  { id: 'co2', label: 'Carbon Offset', desc: 'CO₂ savings vs. ICE equivalent per kWh', color: '#14B8A6' },
]

export default function Reports() {
  const [period, setPeriod] = useState('monthly')
  const [selected, setSelected] = useState<string[]>(['energy', 'sessions'])

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F9FAFB' }}>Reports</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>Generate and export detailed analytics reports</p>
        </div>
        <div className="flex gap-2">
          {['CSV', 'Excel', 'PDF'].map(fmt => (
            <button key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.875rem', borderRadius: 7, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3B82F6', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
              <Download size={13} />{fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={14} color="#6B7280" />
            <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Period:</span>
          </div>
          {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{
                padding: '0.3rem 0.875rem', borderRadius: 9999, fontSize: '0.78rem', cursor: 'pointer',
                background: period === p ? '#00E676' : 'transparent',
                color: period === p ? '#0B1220' : '#6B7280',
                border: `1px solid ${period === p ? '#00E676' : '#1F2937'}`,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <input type="date" style={{ width: 140, fontSize: '0.78rem', height: 34 }} defaultValue="2025-01-01" />
            <span style={{ color: '#4B5563', fontSize: '0.8rem' }}>–</span>
            <input type="date" style={{ width: 140, fontSize: '0.78rem', height: 34 }} defaultValue="2025-01-31" />
          </div>
        </div>
      </div>

      {/* Report type selector */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {REPORT_TYPES.map(r => (
          <div key={r.id} onClick={() => toggle(r.id)}
            className="card cursor-pointer"
            style={{ padding: '1rem', border: `1px solid ${selected.includes(r.id) ? r.color + '40' : '#1F2937'}`, background: selected.includes(r.id) ? `${r.color}08` : '#111827', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: selected.includes(r.id) ? '#F9FAFB' : '#9CA3AF', marginBottom: '0.15rem' }}>{r.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#4B5563' }}>{r.desc}</div>
              </div>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected.includes(r.id) ? r.color : '#374151'}`, background: selected.includes(r.id) ? r.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selected.includes(r.id) && <span style={{ fontSize: 10, color: '#0B1220', fontWeight: 700 }}>✓</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB', marginBottom: '0.25rem' }}>Energy Consumption Preview</div>
          <div style={{ color: '#6B7280', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: '1.25rem' }}>24h · MW</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={powerData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="time" tick={{ fill: '#4B5563', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} tickLine={false} interval={5} />
              <YAxis tick={{ fill: '#4B5563', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 8, fontSize: '0.75rem' }} />
              <Area type="monotone" dataKey="power" stroke="#00E676" strokeWidth={2} fill="url(#rptGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB', marginBottom: '0.25rem' }}>Revenue by Tenant</div>
          <div style={{ color: '#6B7280', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: '1.25rem' }}>Monthly · USD</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={energyByTenant} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="tenant" tick={{ fill: '#4B5563', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} tickLine={false} />
              <YAxis tick={{ fill: '#4B5563', fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 8, fontSize: '0.75rem' }} />
              <Bar dataKey="sessions" radius={[3, 3, 0, 0]}>
                {energyByTenant.map((_, i) => <Cell key={i} fill={['#00E676', '#3B82F6', '#8B5CF6', '#F59E0B', '#14B8A6'][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.7rem 1.75rem' }}>
          <FileText size={15} /> Generate {selected.length} Report{selected.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}
