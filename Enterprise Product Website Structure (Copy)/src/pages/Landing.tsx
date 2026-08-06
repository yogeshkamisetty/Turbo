import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Zap, BarChart3, CreditCard, Building2, Battery, Activity, Menu, X, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react'

const NAV_LINKS = ['Solutions', 'Fleet', 'Pricing', 'About', 'Contact']

function useCountUp(target: number, duration = 2000, start = false) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const p = Math.min((ts - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(ease * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return val
}

function HeroAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: 420 }}>
      <svg width="520" height="400" viewBox="0 0 520 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xl">
        {/* Grid lines */}
        <defs>
          <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E676" stopOpacity="0" />
            <stop offset="50%" stopColor="#00E676" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00E676" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Power grid icon at top */}
        <rect x="210" y="10" width="100" height="60" rx="8" fill="#1F2937" stroke="#3B82F6" strokeWidth="1.5" />
        <text x="260" y="38" textAnchor="middle" fill="#3B82F6" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="500">GRID</text>
        <text x="260" y="56" textAnchor="middle" fill="#60A5FA" fontSize="9" fontFamily="JetBrains Mono, monospace">20 MW</text>

        {/* Main trunk line */}
        <line x1="260" y1="70" x2="260" y2="120" stroke="#1F2937" strokeWidth="2" />
        <line x1="260" y1="70" x2="260" y2="120" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="8 4" style={{ animation: 'flow-dash 1.5s linear infinite' }} />

        {/* Transformer */}
        <rect x="220" y="120" width="80" height="44" rx="6" fill="#111827" stroke="#374151" strokeWidth="1" />
        <text x="260" y="139" textAnchor="middle" fill="#9CA3AF" fontSize="9" fontFamily="JetBrains Mono, monospace">TRANSFORMER</text>
        <text x="260" y="155" textAnchor="middle" fill="#6B7280" fontSize="8" fontFamily="JetBrains Mono, monospace">400V / 800V</text>

        {/* Distribution line */}
        <line x1="260" y1="164" x2="260" y2="200" stroke="#1F2937" strokeWidth="2" />
        <line x1="260" y1="164" x2="260" y2="200" stroke="#00E676" strokeWidth="1.5" strokeDasharray="8 4" style={{ animation: 'flow-dash 1.2s linear infinite' }} />

        {/* Horizontal distribution */}
        <line x1="90" y1="200" x2="430" y2="200" stroke="#1F2937" strokeWidth="2" />
        <line x1="90" y1="200" x2="430" y2="200" stroke="#00E676" strokeWidth="1" strokeDasharray="6 6" style={{ animation: 'flow-dash 2s linear infinite' }} />

        {/* Charger drops */}
        {[
          { x: 90, kw: '45kW', id: '101', pct: 68, color: '#00E676' },
          { x: 180, kw: '22kW', id: '102', pct: 42, color: '#00E676' },
          { x: 260, kw: '150kW', id: '106', pct: 88, color: '#00E676' },
          { x: 340, kw: '30kW', id: '105', pct: 71, color: '#F59E0B' },
          { x: 430, kw: '0kW', id: '107', pct: 0, color: '#EF4444' },
        ].map(({ x, kw, id, pct, color }) => (
          <g key={id}>
            <line x1={x} y1="200" x2={x} y2="240" stroke={color} strokeWidth="1.5" strokeDasharray="5 3" style={{ animation: `flow-dash 1.5s linear infinite` }} />
            <rect x={x - 30} y="240" width="60" height="72" rx="6" fill="#111827" stroke={color} strokeWidth="1.5" filter="url(#glow)" />
            <text x={x} y="258" textAnchor="middle" fill="#9CA3AF" fontSize="8" fontFamily="JetBrains Mono, monospace">#{id}</text>
            <rect x={x - 22} y="263" width="44" height="5" rx="2" fill="#1F2937" />
            <rect x={x - 22} y="263" width={pct > 0 ? `${44 * pct / 100}` : '0'} height="5" rx="2" fill={color} />
            <text x={x} y="283" textAnchor="middle" fill={color} fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="600">{kw}</text>
            <text x={x} y="296" textAnchor="middle" fill="#6B7280" fontSize="7.5" fontFamily="JetBrains Mono, monospace">{pct}% SOC</text>
            {/* EV silhouette */}
            <ellipse cx={x} cy="338" rx="26" ry="8" fill="#0d1526" />
            <path d={`M${x-20} 330 Q${x-10} 316 ${x} 314 Q${x+10} 316 ${x+20} 330 Z`} fill="#1F2937" stroke="#374151" strokeWidth="1" />
            <rect x={x - 20} y="324" width="40" height="8" rx="3" fill="#1F2937" stroke="#374151" strokeWidth="1" />
            <circle cx={x - 12} cy="333" r="4" fill="#111827" stroke="#374151" strokeWidth="1" />
            <circle cx={x + 12} cy="333" r="4" fill="#111827" stroke="#374151" strokeWidth="1" />
          </g>
        ))}
      </svg>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            background: i % 3 === 0 ? '#00E676' : i % 3 === 1 ? '#3B82F6' : '#8B5CF6',
            left: `${10 + i * 11}%`,
            top: `${20 + (i % 4) * 15}%`,
            opacity: 0.6,
            animation: `hero-particle ${1.5 + i * 0.4}s ease-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
    </div>
  )
}

function StatCounter({ value, suffix, label, color, decimals, start }: { value: number; suffix: string; label: string; color: string; decimals?: number; start: boolean }) {
  const v = useCountUp(decimals ? value * 10 : value, 2200, start)
  const display = decimals ? (v / 10).toFixed(1) : v
  return (
    <div className="animate-count-in">
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color, lineHeight: 1 }}>
        {display}{suffix}
      </div>
      <div style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.35rem', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

const FEATURES = [
  { icon: Zap, title: 'Smart Charging', desc: 'AI-driven real-time power allocation adjusts every charger dynamically to minimize cost and maximize throughput.', tag: 'OCPP 2.0.1' },
  { icon: BarChart3, title: 'Live Dashboard', desc: 'WebSocket-based telemetry streams charger state, kWh, temperature, and session data with sub-second latency.', tag: 'WebSocket' },
  { icon: CreditCard, title: 'Billing Engine', desc: 'Automatic invoice generation, per-session cost tracking, and tenant-isolated financial reporting.', tag: 'Automated' },
  { icon: Building2, title: 'Multi-Tenant', desc: 'Complete tenant isolation with role-based access, custom branding, and separate billing per organization.', tag: 'Enterprise' },
  { icon: Battery, title: 'Battery Analytics', desc: 'State-of-charge forecasting, degradation modelling, and optimal charging curve per vehicle profile.', tag: 'ML-Powered' },
  { icon: Activity, title: 'Power Monitoring', desc: 'Live grid consumption graph with demand forecasting, peak detection, and automated load shedding.', tag: 'Real-Time' },
]

const STATS = [
  { value: 50, suffix: '+', label: 'Companies', color: '#00E676' },
  { value: 500, suffix: '+', label: 'Chargers', color: '#3B82F6' },
  { value: 20, suffix: ' MW', label: 'Power Managed', color: '#8B5CF6' },
  { value: 99.9, suffix: '%', label: 'Uptime', decimals: 1, color: '#F59E0B' },
]

const PLANS = [
  { name: 'Starter', price: '$199', period: '/mo', chargers: '10', features: ['OCPP 1.6J / 2.0.1', 'Live Dashboard', 'Basic Billing', 'Email Support'], accent: '#3B82F6' },
  { name: 'Business', price: '$599', period: '/mo', chargers: '50', popular: true, features: ['Everything in Starter', 'Smart Load Balancing', 'Multi-Tenant', 'Battery Analytics', 'Webhook API', 'Priority Support'], accent: '#00E676' },
  { name: 'Enterprise', price: 'Custom', period: '', chargers: 'Unlimited', features: ['Everything in Business', 'Custom Branding', 'SLA 99.99%', 'Dedicated CSM', 'On-Premise Option', 'Custom Integrations'], accent: '#8B5CF6' },
]

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true) }, { threshold: 0.3 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div style={{ background: '#0B1220', color: '#E5E7EB', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={scrolled ? {
          background: 'rgba(11,18,32,0.9)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(31,41,55,0.8)',
        } : { background: 'transparent' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00E676, #3B82F6)' }}>
              <Zap size={16} color="#0B1220" fill="#0B1220" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: '#F9FAFB' }}>
              Volt<span style={{ color: '#00E676' }}>Grid</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`}
                style={{ padding: '0.4rem 0.875rem', borderRadius: 6, color: '#9CA3AF', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
              >{l}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="btn-outline" style={{ padding: '0.45rem 1.25rem', fontSize: '0.875rem' }}>Login</Link>
            <Link to="/register" className="btn-primary" style={{ fontSize: '0.875rem' }}>Start Free</Link>
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden" style={{ background: 'rgba(11,18,32,0.98)', borderBottom: '1px solid #1F2937', padding: '1rem 1.5rem' }}>
            {NAV_LINKS.map(l => <div key={l} style={{ padding: '0.6rem 0', color: '#9CA3AF', fontSize: '0.875rem' }}>{l}</div>)}
            <div className="flex gap-3 mt-4">
              <Link to="/login" className="btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: '0.875rem' }}>Login</Link>
              <Link to="/register" className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.875rem' }}>Start Free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: '6rem', paddingBottom: '4rem', position: 'relative', overflow: 'hidden' }}>
        {/* BG glows */}
        <div className="hero-glow" style={{ width: 600, height: 600, background: 'rgba(0,230,118,0.06)', top: -100, left: '60%' }} />
        <div className="hero-glow" style={{ width: 400, height: 400, background: 'rgba(59,130,246,0.07)', top: 100, left: '10%' }} />

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}>
              <span className="animate-blink-dot w-2 h-2 rounded-full" style={{ background: '#00E676' }} />
              <span style={{ color: '#00E676', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}>LIVE — 118 chargers online</span>
            </div>

            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem' }}>
              <span style={{ color: '#F9FAFB' }}>GRID-AWARE</span>
              <br />
              <span className="gradient-text">EV CHARGING</span>
              <br />
              <span style={{ color: '#F9FAFB' }}>PLATFORM</span>
            </h1>

            <div className="flex items-center gap-4 mb-6" style={{ color: '#9CA3AF', fontSize: '1rem', fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
              <span style={{ color: '#00E676' }}>Manage</span>
              <span style={{ color: '#374151' }}>·</span>
              <span style={{ color: '#3B82F6' }}>Optimize</span>
              <span style={{ color: '#374151' }}>·</span>
              <span style={{ color: '#8B5CF6' }}>Monitor</span>
            </div>

            <p style={{ color: '#9CA3AF', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 440 }}>
              Enterprise-grade OCPP platform with real-time load balancing, multi-tenant billing, and WebSocket-powered dashboards. Built for fleets that never stop.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link to="/register" className="btn-primary" style={{ fontSize: '0.95rem', padding: '0.75rem 1.75rem' }}>
                Start Free <ArrowRight size={16} />
              </Link>
              <Link to="/dashboard" className="btn-outline" style={{ fontSize: '0.95rem', padding: '0.75rem 1.75rem' }}>
                View Dashboard <ChevronRight size={16} />
              </Link>
            </div>

            <div className="flex flex-wrap gap-4">
              {['No credit card required', 'OCPP 2.0.1 compliant', 'SOC 2 Type II'].map(t => (
                <div key={t} className="flex items-center gap-1.5" style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                  <CheckCircle2 size={13} color="#00E676" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center">
            <HeroAnimation />
          </div>
        </div>
      </section>

      {/* Stats counter */}
      <section ref={statsRef} style={{ borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937', padding: '3rem 0', background: 'rgba(17,24,39,0.5)' }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, suffix, label, color, decimals }) => (
            <StatCounter key={label} value={value} suffix={suffix} label={label} color={color} decimals={decimals} start={statsVisible} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="solutions" style={{ padding: '5rem 0' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div style={{ color: '#00E676', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>PLATFORM CAPABILITIES</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 700, color: '#F9FAFB' }}>
              Everything your fleet needs
            </h2>
            <p style={{ color: '#6B7280', marginTop: '0.75rem', fontSize: '1rem', maxWidth: 480, margin: '0.75rem auto 0' }}>
              From OCPP handshake to final invoice — one platform, zero compromises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, tag }) => (
              <div key={title} className="card card-hover p-6 group" style={{ cursor: 'default' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.15)', transition: 'background 0.2s' }}>
                    <Icon size={20} color="#00E676" />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#3B82F6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>{tag}</span>
                </div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '1.05rem', color: '#F9FAFB', marginBottom: '0.5rem' }}>{title}</h3>
                <div style={{ width: 32, height: 2, background: '#00E676', borderRadius: 2, marginBottom: '0.75rem', transition: 'width 0.3s' }} className="group-hover:w-[48px]" />
                <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '5rem 0', background: 'rgba(17,24,39,0.3)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div style={{ color: '#00E676', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>PRICING</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 700, color: '#F9FAFB' }}>Simple, transparent pricing</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, period, chargers, features, popular, accent }) => (
              <div key={name} className="card p-7 relative" style={popular ? { border: `1px solid ${accent}`, boxShadow: `0 0 30px rgba(0,230,118,0.1)` } : {}}>
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold" style={{ background: accent, color: '#0B1220', fontFamily: 'Outfit, sans-serif' }}>Most Popular</div>
                )}
                <div style={{ color: '#9CA3AF', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>{name}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: price === 'Custom' ? '2rem' : '2.5rem', fontWeight: 800, color: accent }}>{price}</span>
                  <span style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: 6 }}>{period}</span>
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: '1.5rem' }}>Up to {chargers} chargers</div>
                <div className="space-y-2 mb-6">
                  {features.map(f => (
                    <div key={f} className="flex items-center gap-2" style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
                      <CheckCircle2 size={13} color={accent} />
                      {f}
                    </div>
                  ))}
                </div>
                <Link to="/register" className="btn-primary w-full justify-center" style={{ background: popular ? accent : 'transparent', color: popular ? '#0B1220' : accent, border: `1px solid ${accent}`, fontSize: '0.875rem' }}>
                  {price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 0' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="card p-12" style={{ background: 'linear-gradient(135deg, rgba(0,230,118,0.05) 0%, rgba(59,130,246,0.05) 100%)', border: '1px solid rgba(0,230,118,0.15)' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: '#F9FAFB', marginBottom: '1rem' }}>
              Ready to modernize your fleet?
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1.05rem', marginBottom: '2rem' }}>Join 50+ companies already running on VoltGrid.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/register" className="btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>Start Free Trial <ArrowRight size={16} /></Link>
              <Link to="/dashboard" className="btn-outline" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>Explore Demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1F2937', padding: '2.5rem 0' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00E676, #3B82F6)' }}>
              <Zap size={13} color="#0B1220" fill="#0B1220" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#F9FAFB' }}>VoltGrid</span>
          </div>
          <div style={{ color: '#4B5563', fontSize: '0.8rem' }}>© 2025 VoltGrid Technologies. All rights reserved.</div>
          <div className="flex gap-4" style={{ fontSize: '0.8rem', color: '#6B7280' }}>
            {['Privacy', 'Terms', 'Security', 'Status'].map(l => (
              <a key={l} href="#" style={{ color: '#6B7280', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
