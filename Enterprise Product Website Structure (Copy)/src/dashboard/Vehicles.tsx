import { vehicles } from '../data/mock'
import { Car, User, Clock, Zap } from 'lucide-react'

const PRIORITY_COLOR: Record<string, { c: string; bg: string }> = {
  high:   { c: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  medium: { c: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  low:    { c: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
}

export default function Vehicles() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F9FAFB' }}>Vehicles</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>{vehicles.length} registered · {vehicles.filter(v => v.charging).length} charging</p>
        </div>
        <button className="btn-primary" style={{ fontSize: '0.875rem' }}><Car size={15} /> Add Vehicle</button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {vehicles.map(v => {
          const pc = PRIORITY_COLOR[v.priority]
          const socColor = v.soc > 70 ? '#00E676' : v.soc > 30 ? '#F59E0B' : '#EF4444'
          return (
            <div key={v.id} className="card card-hover" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#F9FAFB' }}>{v.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.15rem', fontFamily: 'JetBrains Mono, monospace' }}>{v.plate}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', color: pc.c, background: pc.bg, border: `1px solid ${pc.c}28`, padding: '0.15rem 0.5rem', borderRadius: 4 }}>
                    {v.priority.toUpperCase()}
                  </span>
                  {v.charging && (
                    <span className="status-chip" style={{ color: '#00E676', background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}>
                      <span className="animate-blink-dot w-1.5 h-1.5 rounded-full" style={{ background: '#00E676' }} />
                      Charging
                    </span>
                  )}
                </div>
              </div>

              {/* SOC bar */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>STATE OF CHARGE</span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: socColor, fontWeight: 600 }}>{v.soc}%</span>
                </div>
                <div style={{ height: 8, background: '#1F2937', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${v.soc}%`, height: '100%', background: `linear-gradient(90deg, ${socColor}80, ${socColor})`, borderRadius: 4, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#4B5563' }}>0%</span>
                  <span style={{ fontSize: '0.65rem', color: '#4B5563' }}>{v.battery} kWh pack</span>
                  <span style={{ fontSize: '0.65rem', color: '#4B5563' }}>100%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2" style={{ fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={12} color="#4B5563" />
                  <span style={{ color: '#9CA3AF' }}>{v.driver}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={12} color="#4B5563" />
                  <span style={{ color: '#9CA3AF' }}>Done {v.expectedFinish}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Zap size={12} color="#4B5563" />
                  <span style={{ color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace' }}>{v.speed} kW</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Car size={12} color="#4B5563" />
                  <span style={{ color: '#9CA3AF' }}>{v.make}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
