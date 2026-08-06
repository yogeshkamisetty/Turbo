import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, Mail, Lock, User, Building2 } from 'lucide-react'

export default function Register() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { navigate('/dashboard') }, 1200)
  }

  const field = (icon: React.ReactNode, placeholder: string, type = 'text') => (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }}>{icon}</span>
      <input type={type} placeholder={placeholder} required style={{ paddingLeft: '2.25rem' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0B1220', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ position: 'fixed', top: '-5%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(59,130,246,0.04)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-5%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(0,230,118,0.04)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460 }}>
        <div className="text-center mb-8">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #00E676, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#0B1220" fill="#0B1220" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#F9FAFB' }}>
              Volt<span style={{ color: '#00E676' }}>Grid</span>
            </span>
          </Link>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: '#F9FAFB', marginBottom: '0.375rem' }}>Create your account</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Start managing your EV fleet today</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.03em' }}>FIRST NAME</label>
                {field(<User size={15} />, 'James')}
              </div>
              <div>
                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.03em' }}>LAST NAME</label>
                {field(<User size={15} />, 'Carter')}
              </div>
            </div>

            <div className="mb-4">
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.03em' }}>ORGANIZATION</label>
              {field(<Building2 size={15} />, 'Tesla Fleet Inc.')}
            </div>

            <div className="mb-4">
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.03em' }}>WORK EMAIL</label>
              {field(<Mail size={15} />, 'you@company.com', 'email')}
            </div>

            <div className="mb-4">
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.03em' }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
                <input type={show ? 'text' : 'password'} placeholder="Min. 8 characters" required style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: 0 }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.03em' }}>PLAN</label>
              <select defaultValue="business" style={{ paddingLeft: '0.875rem' }}>
                <option value="starter">Starter — Up to 10 chargers</option>
                <option value="business">Business — Up to 50 chargers</option>
                <option value="enterprise">Enterprise — Unlimited chargers</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.95rem' }} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-rotate-ring inline-block w-4 h-4 border-2 rounded-full" style={{ borderColor: 'rgba(11,18,32,0.3)', borderTopColor: '#0B1220' }} />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>

            <p style={{ color: '#4B5563', fontSize: '0.72rem', textAlign: 'center', marginTop: '1rem', lineHeight: 1.6 }}>
              By creating an account you agree to our{' '}
              <a href="#" style={{ color: '#3B82F6', textDecoration: 'none' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" style={{ color: '#3B82F6', textDecoration: 'none' }}>Privacy Policy</a>.
            </p>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#00E676', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
