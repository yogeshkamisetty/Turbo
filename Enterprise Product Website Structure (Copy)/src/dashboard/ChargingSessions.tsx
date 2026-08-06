import { useState, useEffect } from 'react'
import { Battery, Zap, User, Building2, Timer } from 'lucide-react'
import { sessions as initialSessions, type Session } from '../data/mock'

const STATUS_COLOR: Record<string, { c: string; bg: string; border: string }> = {
  charging:  { c: '#00E676', bg: 'rgba(0,230,118,0.08)',  border: 'rgba(0,230,118,0.25)' },
  available: { c: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
  queued:    { c: '#60A5FA', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)' },
  optimized: { c: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  throttled: { c: '#F97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)' },
  fault:     { c: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)' },
  offline:   { c: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.25)' },
}

const PRIORITY_COLOR: Record<string, string> = {
  high: '#EF4444', medium: '#F59E0B', low: '#3B82F6'
}

function useTimer(start: string) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const [h, m] = start.split(':').map(Number)
    const startMs = Date.now() - (Date.now() % 86400000) + h * 3600000 + m * 60000
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [start])
  const h = Math.floor(elapsed / 3600)
  const min = Math.floor((elapsed % 3600) / 60)
  const sec = elapsed % 60
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function TimerDisplay({ start }: { start: string }) {
  const t = useTimer(start)
  return <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#F9FAFB' }}>{t}</span>
}

function BatteryBar({ soc, color }: { soc: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>SOC</span>
        <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color }}>{soc}%</span>
      </div>
      <div style={{ width: '100%', height: 6, background: '#1F2937', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${soc}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

function SessionCard({ s, live }: { s: Session; live: boolean }) {
  const sc = STATUS_COLOR[s.status]
  const pc = PRIORITY_COLOR[s.priority]
  return (
    <div style={{
      background: '#111827',
      border: `1px solid ${sc.border}`,
      borderRadius: 12,
      padding: '1.125rem',
      boxShadow: `0 0 20px ${sc.bg}`,
      transition: 'box-shadow 0.3s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top left accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: sc.c, borderRadius: '12px 0 0 12px' }} />

      <div style={{ paddingLeft: '0.5rem' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: '0.85rem', color: sc.c }}>{s.chargerId}</div>
            <div style={{ fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif', fontWeight: 600, color: '#F9FAFB', marginTop: '0.15rem' }}>{s.vehicle}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem' }}>
            <span className="status-chip" style={{ color: sc.c, background: sc.bg, border: `1px solid ${sc.border}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.c }} />
              {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
            </span>
            <span style={{ fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', color: pc, background: `${pc}18`, border: `1px solid ${pc}28`, padding: '0.1rem 0.4rem', borderRadius: 4 }}>
              {s.priority.toUpperCase()} PRIORITY
            </span>
          </div>
        </div>

        <BatteryBar soc={s.battery} color={sc.c} />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
          <div>
            <div style={{ color: '#4B5563', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.15rem' }}>CHARGING</div>
            <div className="flex items-center gap-1">
              <Zap size={12} color="#00E676" />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#F9FAFB' }}>{s.power} kW</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#4B5563', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.15rem' }}>ENERGY</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#F9FAFB' }}>{s.energy} kWh</div>
          </div>
          <div>
            <div style={{ color: '#4B5563', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.15rem' }}>COST</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#F9FAFB' }}>${s.cost.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: '#4B5563', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.15rem' }}>TIMER</div>
            {live && s.startTime ? <TimerDisplay start={s.startTime} /> : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#4B5563' }}>--:--:--</span>}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #1F2937', marginTop: '0.875rem', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="flex items-center gap-1.5">
            <User size={11} color="#4B5563" />
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{s.driver}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 size={11} color="#4B5563" />
            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{s.tenant}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChargingSessions() {
  const [sessions, setSessions] = useState(initialSessions)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const t = setInterval(() => {
      setSessions(prev => prev.map(s => ({
        ...s,
        battery: s.status === 'charging' ? Math.min(100, s.battery + 0.02) : s.battery,
        energy: s.status === 'charging' ? +(s.energy + 0.01).toFixed(2) : s.energy,
        cost: s.status === 'charging' ? +(s.cost + 0.003).toFixed(3) : s.cost,
      })))
    }, 2000)
    return () => clearInterval(t)
  }, [])

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter)

  const statuses: Array<[string, string]> = [['all', 'All'], ['charging', 'Charging'], ['queued', 'Queued'], ['optimized', 'Optimized'], ['throttled', 'Throttled']]

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="flex items-center gap-3 mb-1">
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F9FAFB' }}>Charging Sessions</h1>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: '#00E676' }}>
            <span className="animate-blink-dot w-2 h-2 rounded-full" style={{ background: '#00E676' }} />
            LIVE
          </span>
        </div>
        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>{sessions.length} active sessions · Updates every 2s</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Power', value: `${sessions.reduce((a, s) => a + s.power, 0)} kW`, color: '#00E676' },
          { label: 'Energy Today', value: `${sessions.reduce((a, s) => a + s.energy, 0).toFixed(1)} kWh`, color: '#3B82F6' },
          { label: 'Revenue Today', value: `$${sessions.reduce((a, s) => a + s.cost, 0).toFixed(2)}`, color: '#8B5CF6' },
          { label: 'Active Sessions', value: String(sessions.filter(s => s.status === 'charging').length), color: '#F59E0B' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: '0.875rem 1.125rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.35rem' }}>{label}</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.3rem', color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {statuses.map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{
              padding: '0.3rem 0.875rem', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
              background: filter === k ? '#00E676' : 'transparent',
              color: filter === k ? '#0B1220' : '#6B7280',
              border: `1px solid ${filter === k ? '#00E676' : '#1F2937'}`,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
            {l}
          </button>
        ))}
      </div>

      {/* Session cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(s => <SessionCard key={s.id} s={s} live />)}
      </div>
    </div>
  )
}
