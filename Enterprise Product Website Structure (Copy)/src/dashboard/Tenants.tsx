import { tenants } from '../data/mock'
import { Building2, Zap, Users, CreditCard } from 'lucide-react'

const PLAN_COLOR: Record<string, { c: string; bg: string }> = {
  Enterprise: { c: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  Business:   { c: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  Starter:    { c: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
}

const TENANT_COLORS = ['#00E676', '#3B82F6', '#8B5CF6', '#F59E0B', '#14B8A6']

export default function Tenants() {
  const totalEnergy = tenants.reduce((a, t) => a + t.energy, 0)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F9FAFB' }}>Tenants</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>{tenants.length} organizations · {tenants.reduce((a, t) => a + t.chargers, 0)} total chargers</p>
        </div>
        <button className="btn-primary" style={{ fontSize: '0.875rem' }}><Building2 size={15} /> Add Tenant</button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {tenants.map((t, i) => {
          const pc = PLAN_COLOR[t.plan]
          const color = TENANT_COLORS[i % TENANT_COLORS.length]
          const utilizationPct = Math.round((t.active / t.chargers) * 100)
          const energyPct = Math.round((t.energy / totalEnergy) * 100)
          return (
            <div key={t.id} className="card card-hover" style={{ padding: '1.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={19} color={color} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB' }}>{t.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>{t.id}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', color: pc.c, background: pc.bg, border: `1px solid ${pc.c}28`, padding: '0.15rem 0.5rem', borderRadius: 4 }}>{t.plan}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { label: 'Chargers', value: `${t.active}/${t.chargers}`, icon: Zap, color: '#00E676' },
                  { label: 'Drivers', value: String(t.drivers), icon: Users, color: '#3B82F6' },
                  { label: 'Energy (kWh)', value: t.energy.toLocaleString(), icon: Zap, color: '#8B5CF6' },
                  { label: 'Revenue', value: `$${t.cost.toLocaleString()}`, icon: CreditCard, color: '#F59E0B' },
                ].map(({ label, value, icon: Icon, color: c }) => (
                  <div key={label} style={{ background: '#0d1526', borderRadius: 8, padding: '0.625rem 0.75rem', border: '1px solid #1F2937' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                      <Icon size={11} color={c} />
                      <span style={{ fontSize: '0.65rem', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: '0.9rem', color: '#F9FAFB' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Utilization */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#6B7280', marginBottom: '0.3rem' }}>
                  <span>Charger utilization</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color }}>{utilizationPct}%</span>
                </div>
                <div style={{ height: 5, background: '#1F2937', borderRadius: 3 }}>
                  <div style={{ width: `${utilizationPct}%`, height: '100%', background: color, borderRadius: 3 }} />
                </div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#6B7280', marginBottom: '0.3rem' }}>
                  <span>Energy share</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#9CA3AF' }}>{energyPct}%</span>
                </div>
                <div style={{ height: 5, background: '#1F2937', borderRadius: 3 }}>
                  <div style={{ width: `${energyPct}%`, height: '100%', background: '#3B82F6', borderRadius: 3 }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
