import { useState } from 'react'
import { alerts } from '../data/mock'
import { Bell, CheckCheck, Filter } from 'lucide-react'

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  fault:   { icon: '⚠',  color: '#EF4444', bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.15)' },
  warning: { icon: '⚡', color: '#F59E0B', bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.15)' },
  success: { icon: '✅', color: '#00E676', bg: 'rgba(0,230,118,0.07)',   border: 'rgba(0,230,118,0.15)' },
  info:    { icon: 'ℹ️', color: '#3B82F6', bg: 'rgba(59,130,246,0.07)',  border: 'rgba(59,130,246,0.15)' },
}

export default function Alerts() {
  const [items, setItems] = useState(alerts)
  const [filter, setFilter] = useState('all')

  const markAll = () => setItems(prev => prev.map(a => ({ ...a, read: true })))
  const markOne = (id: string) => setItems(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))

  const filtered = filter === 'all' ? items : filter === 'unread' ? items.filter(a => !a.read) : items.filter(a => a.type === filter)
  const unread = items.filter(a => !a.read).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F9FAFB' }}>Alerts</h1>
            {unread > 0 && <span style={{ background: '#EF4444', color: '#fff', fontSize: '0.72rem', fontWeight: 700, borderRadius: 9999, padding: '0.1rem 0.6rem', fontFamily: 'JetBrains Mono, monospace' }}>{unread} new</span>}
          </div>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Real-time system notifications and events</p>
        </div>
        {unread > 0 && (
          <button onClick={markAll} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 8, background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', color: '#00E676', fontSize: '0.8rem', cursor: 'pointer' }}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: items.length, color: '#6B7280' },
          { label: 'Faults', value: items.filter(a => a.type === 'fault').length, color: '#EF4444' },
          { label: 'Warnings', value: items.filter(a => a.type === 'warning').length, color: '#F59E0B' },
          { label: 'Unread', value: unread, color: '#3B82F6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: '0.875rem 1.125rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.8rem', color, lineHeight: 1 }}>{value}</div>
            <div style={{ color: '#6B7280', fontSize: '0.78rem', marginTop: '0.25rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[['all', 'All'], ['unread', 'Unread'], ['fault', 'Faults'], ['warning', 'Warnings'], ['success', 'Success'], ['info', 'Info']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{
              padding: '0.3rem 0.875rem', borderRadius: 9999, fontSize: '0.78rem', cursor: 'pointer',
              background: filter === k ? '#00E676' : 'transparent',
              color: filter === k ? '#0B1220' : '#6B7280',
              border: `1px solid ${filter === k ? '#00E676' : '#1F2937'}`,
              fontFamily: 'JetBrains Mono, monospace',
            }}>{l}</button>
        ))}
      </div>

      {/* Alert list */}
      <div className="flex flex-col gap-2">
        {filtered.map(a => {
          const c = TYPE_CONFIG[a.type]
          return (
            <div key={a.id} style={{ background: a.read ? '#111827' : c.bg, border: `1px solid ${a.read ? '#1F2937' : c.border}`, borderRadius: 10, padding: '1rem 1.125rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem', transition: 'background 0.2s, border-color 0.2s' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${c.color}18`, border: `1px solid ${c.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{c.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#F9FAFB', fontFamily: 'Outfit, sans-serif' }}>{a.title}</span>
                  {!a.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, flexShrink: 0 }} />}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', lineHeight: 1.55, margin: 0 }}>{a.message}</p>
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#4B5563' }}>{a.time}</span>
                  <span className="status-chip" style={{ color: c.color, background: `${c.color}15`, border: `1px solid ${c.color}25`, fontSize: '0.62rem' }}>{a.type.toUpperCase()}</span>
                </div>
              </div>
              {!a.read && (
                <button onClick={() => markOne(a.id)} style={{ padding: '0.3rem 0.625rem', borderRadius: 6, background: 'transparent', border: `1px solid #1F2937`, color: '#6B7280', fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Mark read
                </button>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#4B5563' }}>
            <Bell size={28} style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '0.875rem' }}>No alerts in this category</div>
          </div>
        )}
      </div>
    </div>
  )
}
