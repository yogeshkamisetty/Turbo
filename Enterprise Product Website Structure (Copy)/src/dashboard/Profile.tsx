import { Zap, Activity, CreditCard, MapPin, Mail, Phone, Building2, Calendar } from 'lucide-react'
import { sessions, drivers } from '../data/mock'

export default function Profile() {
  const driver = drivers[0]
  const mySessions = sessions.filter(s => s.driver === 'James Carter')
  const totalEnergy = mySessions.reduce((a, s) => a + s.energy, 0)
  const totalCost = mySessions.reduce((a, s) => a + s.cost, 0)

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F9FAFB' }}>Profile</h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>Your account and charging history</p>
      </div>

      <div className="grid lg:grid-cols-[320px,1fr] gap-5">
        {/* Profile card */}
        <div>
          <div className="card" style={{ padding: '1.75rem', textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #00E676, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800, color: '#0B1220', fontFamily: 'Outfit, sans-serif', margin: '0 auto 1rem', boxShadow: '0 0 30px rgba(0,230,118,0.25)' }}>JC</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#F9FAFB', marginBottom: '0.25rem' }}>James Carter</div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.75rem' }}>Fleet Operations Manager</div>
            <span className="status-chip" style={{ color: '#00E676', background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E676' }} />
              Active
            </span>

            <div style={{ borderTop: '1px solid #1F2937', marginTop: '1.25rem', paddingTop: '1.25rem', textAlign: 'left' }}>
              {[
                { icon: Mail, label: 'j.carter@tesla.com' },
                { icon: Phone, label: '+1 415-234-5678' },
                { icon: Building2, label: 'Tesla Fleet' },
                { icon: MapPin, label: 'San Francisco, CA' },
                { icon: Calendar, label: 'Joined Jan 2024' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
                  <Icon size={13} color="#4B5563" />
                  <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.875rem', color: '#F9FAFB', marginBottom: '1rem' }}>Charging Stats</div>
            {[
              { label: 'Total Sessions', value: String(driver.sessions), color: '#3B82F6', icon: Activity },
              { label: 'Energy Used', value: `${driver.energy.toLocaleString()} kWh`, color: '#00E676', icon: Zap },
              { label: 'Total Cost', value: `$${driver.cost.toLocaleString()}`, color: '#8B5CF6', icon: CreditCard },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid #1F2937' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon size={13} color={color} />
                  <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{label}</span>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color: '#F9FAFB', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div>
          {/* Active session */}
          {mySessions.length > 0 && (
            <div className="card mb-4" style={{ padding: '1.375rem', border: '1px solid rgba(0,230,118,0.2)', background: 'rgba(0,230,118,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="animate-blink-dot w-2.5 h-2.5 rounded-full" style={{ background: '#00E676' }} />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB' }}>Active Charging Session</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Charger', value: mySessions[0].chargerId, color: '#00E676' },
                  { label: 'Vehicle', value: mySessions[0].vehicle, color: '#F9FAFB' },
                  { label: 'Power', value: `${mySessions[0].power} kW`, color: '#3B82F6' },
                  { label: 'Energy', value: `${mySessions[0].energy} kWh`, color: '#8B5CF6' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: '#111827', borderRadius: 8, padding: '0.75rem', border: '1px solid #1F2937' }}>
                    <div style={{ fontSize: '0.65rem', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.25rem' }}>{label}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88rem', color, fontWeight: 600 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Battery indicator */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>BATTERY STATE OF CHARGE</span>
                  <span style={{ fontSize: '0.75rem', color: '#00E676', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{mySessions[0].battery}%</span>
                </div>
                <div style={{ height: 10, background: '#1F2937', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${mySessions[0].battery}%`, height: '100%', background: 'linear-gradient(90deg, #00c864, #00E676)', borderRadius: 5, boxShadow: '0 0 12px rgba(0,230,118,0.4)' }} />
                </div>
              </div>
            </div>
          )}

          {/* Recent sessions */}
          <div className="card" style={{ padding: '1.375rem' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB', marginBottom: '1rem' }}>Recent Sessions</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1F2937' }}>
                    {['Charger', 'Vehicle', 'Energy', 'Cost', 'Status'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.875rem', textAlign: 'left', color: '#4B5563', fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 6).map(s => (
                    <tr key={s.id} className="table-row">
                      <td style={{ padding: '0.625rem 0.875rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#00E676' }}>{s.chargerId}</td>
                      <td style={{ padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: '#E5E7EB' }}>{s.vehicle}</td>
                      <td style={{ padding: '0.625rem 0.875rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#9CA3AF' }}>{s.energy} kWh</td>
                      <td style={{ padding: '0.625rem 0.875rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#F9FAFB' }}>${s.cost.toFixed(2)}</td>
                      <td style={{ padding: '0.625rem 0.875rem' }}>
                        <span style={{ fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', color: s.status === 'charging' ? '#00E676' : '#6B7280', background: s.status === 'charging' ? 'rgba(0,230,118,0.1)' : 'rgba(107,114,128,0.1)', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
