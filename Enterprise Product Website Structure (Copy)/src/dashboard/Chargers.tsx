import { useState } from 'react'
import { Search, Filter, Play, Square, RotateCcw, FileText, Zap, Thermometer, MapPin } from 'lucide-react'
import { chargers, type ChargerStatus } from '../data/mock'

const STATUS_CONFIG: Record<ChargerStatus, { label: string; color: string; bg: string }> = {
  charging:  { label: 'Charging',  color: '#00E676', bg: 'rgba(0,230,118,0.12)' },
  available: { label: 'Available', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  queued:    { label: 'Queued',    color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  optimized: { label: 'Optimized', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  throttled: { label: 'Throttled', color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  fault:     { label: 'Fault',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  offline:   { label: 'Offline',   color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
}

function StatusChip({ status }: { status: ChargerStatus }) {
  const c = STATUS_CONFIG[status]
  return (
    <span className="status-chip" style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}28` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
      {c.label}
    </span>
  )
}

export default function Chargers() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')

  const filtered = chargers.filter(c => {
    const matchSearch = c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase()) ||
      (c.vehicle?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    all: chargers.length,
    charging: chargers.filter(c => c.status === 'charging').length,
    available: chargers.filter(c => c.status === 'available').length,
    fault: chargers.filter(c => c.status === 'fault' || c.status === 'offline').length,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F9FAFB' }}>Chargers</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>{chargers.length} total · {counts.charging} active · {counts.fault} issues</p>
        </div>
        <button className="btn-primary" style={{ fontSize: '0.875rem' }}><Zap size={15} /> Add Charger</button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([['all', 'All'], ['charging', 'Charging'], ['available', 'Available'], ['fault', 'Fault']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{
              padding: '0.3rem 0.875rem', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
              background: filter === k ? '#00E676' : 'transparent',
              color: filter === k ? '#0B1220' : '#6B7280',
              border: `1px solid ${filter === k ? '#00E676' : '#1F2937'}`,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
            {l} ({counts[k as keyof typeof counts]})
          </button>
        ))}
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chargers..."
            style={{ paddingLeft: '2rem', height: 34, width: 220, fontSize: '0.8rem' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['ID', 'Status', 'Power', 'Voltage / Current', 'Temp', 'Location', 'Connector', 'Tenant', 'Actions'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#4B5563', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="table-row">
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#00E676', fontWeight: 600 }}>{c.id}</div>
                  {c.vehicle && <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.15rem' }}>{c.vehicle}</div>}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}><StatusChip status={c.status} /></td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: c.power > 0 ? '#F9FAFB' : '#4B5563' }}>{c.power} kW</div>
                  <div style={{ width: '100%', height: 3, background: '#1F2937', borderRadius: 2, marginTop: '0.3rem', maxWidth: 60 }}>
                    <div style={{ width: `${(c.power / c.maxPower) * 100}%`, height: '100%', background: '#00E676', borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#9CA3AF' }}>
                  {c.voltage}V / {c.current}A
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div className="flex items-center gap-1">
                    <Thermometer size={12} color={c.temperature > 65 ? '#EF4444' : c.temperature > 50 ? '#F59E0B' : '#6B7280'} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: c.temperature > 65 ? '#EF4444' : c.temperature > 50 ? '#F59E0B' : '#9CA3AF' }}>{c.temperature}°C</span>
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div className="flex items-center gap-1">
                    <MapPin size={11} color="#4B5563" />
                    <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{c.location}</span>
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#6B7280' }}>{c.connector}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#9CA3AF' }}>{c.tenant}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div className="flex items-center gap-1">
                    {[
                      { icon: Play, color: '#00E676', title: 'Start' },
                      { icon: Square, color: '#EF4444', title: 'Stop' },
                      { icon: RotateCcw, color: '#F59E0B', title: 'Restart' },
                      { icon: FileText, color: '#3B82F6', title: 'Logs' },
                    ].map(({ icon: Icon, color, title }) => (
                      <button key={title} title={title}
                        style={{ width: 28, height: 28, borderRadius: 6, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Icon size={12} color={color} />
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#4B5563' }}>
            <Filter size={24} style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '0.875rem' }}>No chargers match your filter</div>
          </div>
        )}
      </div>
    </div>
  )
}
