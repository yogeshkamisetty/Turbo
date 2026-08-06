import { useState, useRef, useEffect } from "react"
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Zap, LayoutDashboard, Activity, Network, Car, Users, Building2,
  CreditCard, BarChart2, Bell, Settings, User, LogOut, Search,
  ChevronDown, Menu, X, Wifi
} from 'lucide-react'
import { alerts } from '../data/mock'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Home', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/dashboard/chargers', label: 'Chargers', icon: Zap },
      { to: '/dashboard/sessions', label: 'Sessions', icon: Activity },
      { to: '/dashboard/grid', label: 'Live Grid', icon: Network },
    ],
  },
  {
    label: 'Fleet',
    items: [
      { to: '/dashboard/vehicles', label: 'Vehicles', icon: Car },
      { to: '/dashboard/drivers', label: 'Drivers', icon: Users },
      { to: '/dashboard/tenants', label: 'Tenants', icon: Building2 },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
      { to: '/dashboard/reports', label: 'Reports', icon: BarChart2 },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/dashboard/alerts', label: 'Alerts', icon: Bell },
      { to: '/dashboard/settings', label: 'Settings', icon: Settings },
      { to: '/dashboard/profile', label: 'Profile', icon: User },
    ],
  },
]

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, cb])
}

export default function DashboardLayout() {
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notiOpen, setNotiOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileGroup, setMobileGroup] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const unread = alerts.filter(a => !a.read).length
  const navRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const notiRef = useRef<HTMLDivElement>(null)

  useOutsideClick(navRef, () => setOpenGroup(null))
  useOutsideClick(profileRef, () => setProfileOpen(false))
  useOutsideClick(notiRef, () => setNotiOpen(false))

  function isGroupActive(items: { to: string; end?: boolean }[]) {
    return items.some(item =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0B1220', overflow: 'hidden' }}>

      {/* ── Top navbar ── */}
      <header style={{
        background: '#0d1526',
        borderBottom: '1px solid #1F2937',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Row 1: logo + search + profile */}
        <div style={{ height: 56, display: 'flex', alignItems: 'center', paddingInline: '1.25rem', gap: '1rem' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #00E676, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={15} color="#0B1220" fill="#0B1220" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#F9FAFB' }}>
              Volt<span style={{ color: '#00E676' }}>Grid</span>
            </span>
          </Link>

          {/* Live pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 20, padding: '0.25rem 0.65rem', flexShrink: 0 }} className="hidden md:flex">
            <Wifi size={11} color="#00E676" />
            <span style={{ color: '#00E676', fontSize: '0.67rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}>LIVE · 118 online</span>
            <span className="animate-blink-dot w-1.5 h-1.5 rounded-full" style={{ background: '#00E676' }} />
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 360, position: 'relative' }} className="hidden md:block">
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
            <input
              placeholder="Search chargers, drivers, sessions..."
              style={{ paddingLeft: '2rem', paddingRight: '3rem', height: 34, background: '#111827', fontSize: '0.78rem', width: '100%' }}
            />
            <kbd style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: '#1F2937', color: '#4B5563', fontSize: '0.62rem', padding: '0.1rem 0.35rem', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>⌘K</kbd>
          </div>

          <div style={{ flex: 1 }} />

          {/* Notifications */}
          <div style={{ position: 'relative' }} ref={notiRef}>
            <button
              onClick={() => { setNotiOpen(!notiOpen); setProfileOpen(false) }}
              style={{ width: 34, height: 34, borderRadius: 8, background: '#111827', border: '1px solid #1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
            >
              <Bell size={15} color="#6B7280" />
              {unread > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', border: '2px solid #0d1526' }} />}
            </button>
            {notiOpen && (
              <div className="card" style={{ position: 'absolute', right: 0, top: '110%', width: 340, maxHeight: 400, overflowY: 'auto', zIndex: 60, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #1F2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.875rem', color: '#F9FAFB' }}>Notifications</span>
                  <span style={{ background: '#EF4444', color: '#fff', fontSize: '0.65rem', fontWeight: 600, borderRadius: 9999, padding: '0.1rem 0.45rem' }}>{unread} new</span>
                </div>
                {alerts.slice(0, 5).map(a => (
                  <div key={a.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #1F2937', background: !a.read ? 'rgba(239,68,68,0.03)' : undefined }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem', lineHeight: 1.2 }}>
                        {a.type === 'fault' ? '⚠' : a.type === 'warning' ? '⚡' : a.type === 'success' ? '✅' : 'ℹ️'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#E5E7EB', marginBottom: '0.2rem' }}>{a.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6B7280', lineHeight: 1.5 }}>{a.message}</div>
                        <div style={{ fontSize: '0.68rem', color: '#4B5563', marginTop: '0.25rem', fontFamily: 'JetBrains Mono, monospace' }}>{a.time}</div>
                      </div>
                      {!a.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', flexShrink: 0, marginTop: 4 }} />}
                    </div>
                  </div>
                ))}
                <div style={{ padding: '0.625rem 1rem', textAlign: 'center' }}>
                  <Link to="/dashboard/alerts" onClick={() => setNotiOpen(false)} style={{ color: '#3B82F6', fontSize: '0.8rem', textDecoration: 'none' }}>View all alerts →</Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div style={{ position: 'relative' }} ref={profileRef}>
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotiOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', borderRadius: 8, background: '#111827', border: '1px solid #1F2937', cursor: 'pointer' }}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #00E676, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#0B1220', fontFamily: 'Outfit, sans-serif' }}>JC</div>
              <div className="hidden md:block text-left">
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#E5E7EB', lineHeight: 1.2 }}>James Carter</div>
                <div style={{ fontSize: '0.65rem', color: '#6B7280', lineHeight: 1.2 }}>Admin</div>
              </div>
              <ChevronDown size={12} color="#6B7280" />
            </button>
            {profileOpen && (
              <div className="card" style={{ position: 'absolute', right: 0, top: '110%', width: 200, zIndex: 60, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', padding: '0.5rem' }}>
                <Link to="/dashboard/profile" className="sidebar-link" onClick={() => setProfileOpen(false)}><User size={14} /> Profile</Link>
                <Link to="/dashboard/settings" className="sidebar-link" onClick={() => setProfileOpen(false)}><Settings size={14} /> Settings</Link>
                <div style={{ height: 1, background: '#1F2937', margin: '0.25rem 0' }} />
                <button className="sidebar-link w-full" onClick={() => navigate('/')}><LogOut size={14} /> Sign out</button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4 }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Row 2: category nav tabs (desktop) */}
        <div className="hidden md:flex" ref={navRef} style={{ paddingInline: '1.25rem', borderTop: '1px solid #1F2937', gap: '0.125rem', position: 'relative' }}>
          {NAV_GROUPS.map(({ label, items }) => {
            const active = isGroupActive(items)
            const open = openGroup === label
            const single = items.length === 1
            return (
              <div key={label} style={{ position: 'relative' }}>
                {single ? (
                  <NavLink
                    to={items[0].to}
                    end={items[0].end}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.6rem 0.875rem',
                      fontSize: '0.8rem', fontWeight: 500,
                      color: isActive ? '#00E676' : '#9CA3AF',
                      textDecoration: 'none',
                      borderBottom: isActive ? '2px solid #00E676' : '2px solid transparent',
                      transition: 'color 0.15s, border-color 0.15s',
                      whiteSpace: 'nowrap',
                    })}
                  >
                    {(() => { const Icon = items[0].icon; return <Icon size={14} /> })()}
                    {label}
                  </NavLink>
                ) : (
                  <>
                    <button
                      onClick={() => setOpenGroup(open ? null : label)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.6rem 0.875rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 500,
                        color: active ? '#00E676' : '#9CA3AF',
                        borderBottom: active ? '2px solid #00E676' : '2px solid transparent',
                        transition: 'color 0.15s, border-color 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                      <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                    </button>
                    {open && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, minWidth: 180,
                        background: '#0d1526', border: '1px solid #1F2937', borderRadius: 10,
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5)', padding: '0.375rem',
                        zIndex: 60, marginTop: 4,
                      }}>
                        {items.map(({ to, label: itemLabel, icon: Icon, end }) => (
                          <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={() => setOpenGroup(null)}
                            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                          >
                            <Icon size={15} />
                            {itemLabel}
                            {itemLabel === 'Alerts' && unread > 0 && (
                              <span style={{ marginLeft: 'auto', background: '#EF4444', color: '#fff', fontSize: '0.62rem', fontWeight: 600, borderRadius: 9999, padding: '0.1rem 0.4rem', fontFamily: 'JetBrains Mono, monospace' }}>{unread}</span>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile slide-down menu */}
        {mobileOpen && (
          <div className="md:hidden" style={{ borderTop: '1px solid #1F2937', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
            {NAV_GROUPS.map(({ label, items }) => (
              <div key={label}>
                <button
                  onClick={() => setMobileGroup(mobileGroup === label ? null : label)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem 0.5rem', color: '#6B7280', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.07em' }}
                >
                  {label.toUpperCase()}
                  <ChevronDown size={12} style={{ transform: mobileGroup === label ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                </button>
                {mobileGroup === label && items.map(({ to, label: itemLabel, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                    style={{ paddingLeft: '1.25rem' }}
                  >
                    <Icon size={15} />
                    {itemLabel}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Page content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
