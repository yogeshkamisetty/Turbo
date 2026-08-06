import { useState } from 'react'
import { invoices, tenants } from '../data/mock'
import { CreditCard, Download, TrendingUp, Zap, DollarSign } from 'lucide-react'

const STATUS_CONFIG: Record<string, { c: string; bg: string; label: string }> = {
  paid:    { c: '#00E676', bg: 'rgba(0,230,118,0.1)',   label: 'Paid' },
  pending: { c: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  label: 'Pending' },
  overdue: { c: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'Overdue' },
}

export default function Billing() {
  const [activeFilter, setActiveFilter] = useState('all')

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.cost, 0)
  const totalKwh = invoices.reduce((a, i) => a + i.kwh, 0)
  const pending = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((a, i) => a + i.cost, 0)

  const filtered = activeFilter === 'all' ? invoices : invoices.filter(i => i.status === activeFilter)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F9FAFB' }}>Billing</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>Invoice management and revenue tracking</p>
        </div>
        <button className="btn-primary" style={{ fontSize: '0.875rem' }}><CreditCard size={15} /> Generate Invoice</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: '#00E676', sub: 'All time collected' },
          { label: 'Energy Sold', value: `${totalKwh.toLocaleString()} kWh`, icon: Zap, color: '#3B82F6', sub: 'Total energy billed' },
          { label: 'Pending / Overdue', value: `$${pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: CreditCard, color: '#F59E0B', sub: `${invoices.filter(i => i.status !== 'paid').length} invoices` },
          { label: 'Avg. Rate', value: '$0.30/kWh', icon: TrendingUp, color: '#8B5CF6', sub: 'Platform average' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card" style={{ padding: '1.125rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
            </div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.4rem', color, lineHeight: 1 }}>{value}</div>
            <div style={{ color: '#9CA3AF', fontSize: '0.78rem', marginTop: '0.35rem' }}>{label}</div>
            <div style={{ color: '#4B5563', fontSize: '0.7rem', marginTop: '0.15rem', fontFamily: 'JetBrains Mono, monospace' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Tenant revenue breakdown */}
      <div className="card p-5 mb-5">
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB', marginBottom: '1rem' }}>Revenue by Tenant</div>
        <div className="grid md:grid-cols-5 gap-3">
          {tenants.map((t, i) => {
            const colors = ['#00E676', '#3B82F6', '#8B5CF6', '#F59E0B', '#14B8A6']
            const c = colors[i]
            const maxCost = Math.max(...tenants.map(t => t.cost))
            return (
              <div key={t.id} style={{ textAlign: 'center' }}>
                <div style={{ height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                  <div style={{ height: `${(t.cost / maxCost) * 100}%`, background: `linear-gradient(180deg, ${c}, ${c}80)`, borderRadius: '4px 4px 0 0', minHeight: 4, boxShadow: `0 -4px 16px ${c}30` }} />
                </div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: c, fontWeight: 600 }}>${t.cost.toLocaleString()}</div>
                <div style={{ fontSize: '0.65rem', color: '#6B7280', marginTop: '0.2rem' }}>{t.name}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Invoices table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1F2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB' }}>Invoices</div>
          <div className="flex gap-2">
            {(['all', 'paid', 'pending', 'overdue'] as const).map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                style={{
                  padding: '0.25rem 0.75rem', borderRadius: 9999, fontSize: '0.72rem', cursor: 'pointer',
                  background: activeFilter === f ? '#00E676' : 'transparent',
                  color: activeFilter === f ? '#0B1220' : '#6B7280',
                  border: `1px solid ${activeFilter === f ? '#00E676' : '#1F2937'}`,
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 500,
                }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Invoice', 'Tenant', 'Date', 'kWh', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#4B5563', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const sc = STATUS_CONFIG[inv.status]
                return (
                  <tr key={inv.id} className="table-row">
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#3B82F6' }}>{inv.id}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#E5E7EB' }}>{inv.tenant}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#9CA3AF' }}>{inv.date}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#9CA3AF' }}>{inv.kwh.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88rem', color: '#F9FAFB', fontWeight: 600 }}>${inv.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className="status-chip" style={{ color: sc.c, background: sc.bg, border: `1px solid ${sc.c}28` }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.c }} />
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: 6, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#3B82F6', fontSize: '0.75rem', cursor: 'pointer' }}>
                        <Download size={12} /> PDF
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
