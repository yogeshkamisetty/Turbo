import { useState, useEffect } from 'react'
import { Zap, Activity, TrendingUp } from 'lucide-react'

interface GridNode {
  id: string
  label: string
  sub: string
  kw: number
  maxKw: number
  color: string
  status: 'active' | 'throttled' | 'fault' | 'idle'
}

const INITIAL_CHARGERS: GridNode[] = [
  { id: 'CHG-101', label: 'CHG-101', sub: 'Tesla Model Y', kw: 45, maxKw: 50, color: '#00E676', status: 'active' },
  { id: 'CHG-102', label: 'CHG-102', sub: 'Rivian R1T', kw: 22, maxKw: 22, color: '#00E676', status: 'active' },
  { id: 'CHG-103', label: 'CHG-103', sub: 'Available', kw: 0, maxKw: 150, color: '#3B82F6', status: 'idle' },
  { id: 'CHG-104', label: 'CHG-104', sub: 'Rivian R1S', kw: 18, maxKw: 50, color: '#F97316', status: 'throttled' },
  { id: 'CHG-105', label: 'CHG-105', sub: 'BMW iX', kw: 30, maxKw: 50, color: '#F59E0B', status: 'active' },
  { id: 'CHG-106', label: 'CHG-106', sub: 'Tesla Model 3', kw: 150, maxKw: 150, color: '#00E676', status: 'active' },
  { id: 'CHG-107', label: 'CHG-107', sub: 'FAULT', kw: 0, maxKw: 50, color: '#EF4444', status: 'fault' },
  { id: 'CHG-108', label: 'CHG-108', sub: 'Offline', kw: 0, maxKw: 22, color: '#6B7280', status: 'idle' },
]

function FlowLine({ x1, y1, x2, y2, color, active }: { x1: number; y1: number; x2: number; y2: number; color: string; active: boolean }) {
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1F2937" strokeWidth="2" />
      {active && (
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color} strokeWidth="2" strokeDasharray="12 6" opacity={0.8}
          style={{ animation: 'flow-dash 1.5s linear infinite' }}
        />
      )}
    </g>
  )
}

function GridDiagram({ chargers }: { chargers: GridNode[] }) {
  const totalKw = chargers.reduce((a, c) => a + c.kw, 0)
  const activeChargers = chargers.filter(c => c.kw > 0)

  const W = 700
  const H = 480
  const cx = W / 2

  // Layout: Grid → Transformer → Distribution bar → 8 chargers in 2 rows
  const gridY = 40
  const transY = 120
  const distY = 200
  const row1Y = 310
  const row2Y = 420

  const cols = 4
  const spacing = W / (cols + 1)
  const charger8Xs = [1, 2, 3, 4].map(i => i * spacing)
  const charger8Ys = [row1Y, row1Y, row1Y, row1Y, row2Y, row2Y, row2Y, row2Y]
  const charger8XsFull = [...charger8Xs, ...charger8Xs]

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%' }}>
      <defs>
        <filter id="nodeGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid source */}
      <rect x={cx - 60} y={gridY} width={120} height={54} rx={8} fill="#0d1526" stroke="#3B82F6" strokeWidth={1.5} />
      <text x={cx} y={gridY + 22} textAnchor="middle" fill="#3B82F6" fontSize={11} fontFamily="JetBrains Mono, monospace" fontWeight="600">UTILITY GRID</text>
      <text x={cx} y={gridY + 39} textAnchor="middle" fill="#60A5FA" fontSize={10} fontFamily="JetBrains Mono, monospace">{(totalKw / 1000).toFixed(2)} MW total</text>

      {/* Grid → Transformer */}
      <FlowLine x1={cx} y1={gridY + 54} x2={cx} y2={transY} color="#3B82F6" active={totalKw > 0} />

      {/* Transformer */}
      <rect x={cx - 55} y={transY} width={110} height={48} rx={6} fill="#111827" stroke="#374151" strokeWidth={1} />
      <text x={cx} y={transY + 18} textAnchor="middle" fill="#9CA3AF" fontSize={9} fontFamily="JetBrains Mono, monospace">TRANSFORMER</text>
      <text x={cx} y={transY + 33} textAnchor="middle" fill="#6B7280" fontSize={8.5} fontFamily="JetBrains Mono, monospace">400V / 800V · 20 MW cap</text>
      <text x={cx} y={transY + 45} textAnchor="middle" fill="#6B7280" fontSize={8} fontFamily="JetBrains Mono, monospace">Efficiency 98.6%</text>

      {/* Transformer → Distribution */}
      <FlowLine x1={cx} y1={transY + 48} x2={cx} y2={distY} color="#00E676" active={totalKw > 0} />

      {/* Distribution bus */}
      <rect x={spacing * 0.6} y={distY} width={spacing * (cols + 0.8)} height={36} rx={5} fill="#0d1526" stroke="#374151" strokeWidth={1} />
      <text x={cx} y={distY + 15} textAnchor="middle" fill="#9CA3AF" fontSize={9} fontFamily="JetBrains Mono, monospace">MAIN DISTRIBUTION BUS</text>
      <text x={cx} y={distY + 29} textAnchor="middle" fill="#6B7280" fontSize={8} fontFamily="JetBrains Mono, monospace">{activeChargers.length} active · {totalKw} kW load</text>

      {/* Distribution → Chargers */}
      {chargers.map((c, i) => (
        <FlowLine
          key={c.id}
          x1={charger8XsFull[i]}
          y1={distY + 36}
          x2={charger8XsFull[i]}
          y2={charger8Ys[i]}
          color={c.color}
          active={c.kw > 0}
        />
      ))}

      {/* Charger nodes */}
      {chargers.map((c, i) => {
        const x = charger8XsFull[i]
        const y = charger8Ys[i]
        const pct = c.maxKw > 0 ? c.kw / c.maxKw : 0
        return (
          <g key={c.id} filter={c.kw > 0 ? 'url(#nodeGlow)' : undefined}>
            <rect x={x - 46} y={y} width={92} height={72} rx={7} fill="#111827" stroke={c.color} strokeWidth={c.kw > 0 ? 1.5 : 0.5} opacity={c.status === 'idle' ? 0.6 : 1} />
            <text x={x} y={y + 15} textAnchor="middle" fill={c.color} fontSize={8.5} fontFamily="JetBrains Mono, monospace" fontWeight="600">{c.label}</text>
            <text x={x} y={y + 27} textAnchor="middle" fill="#6B7280" fontSize={7.5} fontFamily="JetBrains Mono, monospace">{c.sub}</text>
            {/* Power bar */}
            <rect x={x - 36} y={y + 33} width={72} height={5} rx={2} fill="#1F2937" />
            <rect x={x - 36} y={y + 33} width={72 * pct} height={5} rx={2} fill={c.color} style={{ transition: 'width 0.8s ease' }} />
            <text x={x} y={y + 50} textAnchor="middle" fill={c.kw > 0 ? '#F9FAFB' : '#4B5563'} fontSize={10} fontFamily="JetBrains Mono, monospace" fontWeight="600">{c.kw} kW</text>
            <text x={x} y={y + 63} textAnchor="middle" fill="#4B5563" fontSize={7.5} fontFamily="JetBrains Mono, monospace">of {c.maxKw} kW</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function LiveGrid() {
  const [chargers, setChargers] = useState(INITIAL_CHARGERS)

  useEffect(() => {
    const t = setInterval(() => {
      setChargers(prev => prev.map(c => {
        if (c.status === 'fault' || c.status === 'idle') return c
        const delta = (Math.random() - 0.5) * 2
        const newKw = Math.max(0, Math.min(c.maxKw, c.kw + delta))
        return { ...c, kw: Math.round(newKw) }
      }))
    }, 2500)
    return () => clearInterval(t)
  }, [])

  const totalKw = chargers.reduce((a, c) => a + c.kw, 0)
  const activeCount = chargers.filter(c => c.kw > 0).length
  const faultCount = chargers.filter(c => c.status === 'fault').length
  const efficiency = 98.6

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F9FAFB' }}>Live Grid</h1>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: '#00E676' }}>
              <span className="animate-blink-dot w-2 h-2 rounded-full" style={{ background: '#00E676' }} />
              LIVE · 2.5s refresh
            </span>
          </div>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Animated power flow from utility grid to individual chargers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Load', value: `${totalKw} kW`, icon: Zap, color: '#00E676' },
          { label: 'Active Chargers', value: `${activeCount} / ${chargers.length}`, icon: Activity, color: '#3B82F6' },
          { label: 'Grid Efficiency', value: `${efficiency}%`, icon: TrendingUp, color: '#8B5CF6' },
          { label: 'Faults', value: String(faultCount), icon: Zap, color: faultCount > 0 ? '#EF4444' : '#6B7280' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: '0.875rem 1.125rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={17} color={color} />
            </div>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1.1rem', color }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid diagram */}
      <div className="card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB' }}>Power Flow Diagram</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {[['#00E676', 'Active'], ['#F59E0B', 'Optimized'], ['#F97316', 'Throttled'], ['#EF4444', 'Fault'], ['#6B7280', 'Idle']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: '#6B7280' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>
        <GridDiagram chargers={chargers} />
      </div>

      {/* Charger power bars */}
      <div className="card mt-4" style={{ padding: '1.25rem' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB', marginBottom: '1rem' }}>Live Power Allocation</div>
        <div className="grid md:grid-cols-2 gap-3">
          {chargers.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: c.color, width: 64, flexShrink: 0 }}>{c.id}</div>
              <div style={{ flex: 1, height: 10, background: '#1F2937', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${(c.kw / c.maxKw) * 100}%`, height: '100%', background: c.color, borderRadius: 5, transition: 'width 0.8s ease', boxShadow: c.kw > 0 ? `0 0 8px ${c.color}60` : 'none' }} />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#9CA3AF', width: 60, textAlign: 'right', flexShrink: 0 }}>{c.kw} / {c.maxKw} kW</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
