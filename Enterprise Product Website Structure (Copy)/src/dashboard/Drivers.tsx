import { drivers } from '../data/mock'
import { Users, Mail, Phone, Zap, Activity } from 'lucide-react'

const STATUS_COLOR: Record<string, { c: string; bg: string }> = {
  active:  { c: '#00E676', bg: 'rgba(0,230,118,0.1)' },
  idle:    { c: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  offline: { c: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
}

export default function Drivers() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F9FAFB' }}>Drivers</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>{drivers.length} registered · {drivers.filter(d => d.status === 'active').length} active now</p>
        </div>
        <button className="btn-primary" style={{ fontSize: '0.875rem' }}><Users size={15} /> Add Driver</button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['Driver', 'Contact', 'Tenant', 'Vehicle', 'Sessions', 'Energy', 'Cost', 'Status'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#4B5563', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.map(d => {
              const sc = STATUS_COLOR[d.status]
              const initials = d.name.split(' ').map(n => n[0]).join('')
              const colors = ['#00E676', '#3B82F6', '#8B5CF6', '#F59E0B', '#F97316', '#14B8A6']
              const avatarColor = colors[d.name.charCodeAt(0) % colors.length]
              return (
                <tr key={d.id} className="table-row">
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${avatarColor}22`, border: `1px solid ${avatarColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: avatarColor, fontFamily: 'Outfit, sans-serif', flexShrink: 0 }}>{initials}</div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#F9FAFB' }}>{d.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>{d.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#9CA3AF' }}>
                        <Mail size={11} color="#4B5563" />{d.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#6B7280' }}>
                        <Phone size={11} color="#4B5563" />{d.phone}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#9CA3AF' }}>{d.tenant}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#9CA3AF' }}>{d.vehicle}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Activity size={12} color="#3B82F6" />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#F9FAFB' }}>{d.sessions}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Zap size={12} color="#00E676" />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#F9FAFB' }}>{d.energy.toLocaleString()} kWh</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#F9FAFB' }}>${d.cost.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="status-chip" style={{ color: sc.c, background: sc.bg, border: `1px solid ${sc.c}28` }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.c }} />
                      {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
