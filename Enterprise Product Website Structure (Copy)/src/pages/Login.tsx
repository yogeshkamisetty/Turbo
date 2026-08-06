import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, Mail, Lock } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { navigate('/dashboard') }, 1000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B1220', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      {/* BG glows */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(0,230,118,0.04)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(59,130,246,0.05)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #00E676, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#0B1220" fill="#0B1220" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#F9FAFB' }}>
              Volt<span style={{ color: '#00E676' }}>Grid</span>
            </span>
          </Link>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: '#F9FAFB', marginBottom: '0.375rem' }}>Welcome back</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Sign in to your fleet dashboard</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.5rem', letterSpacing: '0.03em' }}>EMAIL ADDRESS</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label style={{ color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.03em' }}>PASSWORD</label>
                <a href="#" style={{ color: '#3B82F6', fontSize: '0.75rem', textDecoration: 'none' }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: 0 }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.95rem' }} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-rotate-ring inline-block w-4 h-4 border-2 rounded-full" style={{ borderColor: 'rgba(11,18,32,0.3)', borderTopColor: '#0B1220' }} />
                  Signing in...
                </span>
              ) : 'Sign in to Dashboard'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div style={{ flex: 1, height: 1, background: '#1F2937' }} />
            <span style={{ color: '#4B5563', fontSize: '0.75rem' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: '#1F2937' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {['Google', 'Microsoft'].map(p => (
              <button key={p} className="btn-outline" style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.55rem' }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          {"Don't have an account? "}
          <Link to="/register" style={{ color: '#00E676', textDecoration: 'none', fontWeight: 500 }}>Create one free</Link>
        </p>
      </div>
    </div>
  )
}
