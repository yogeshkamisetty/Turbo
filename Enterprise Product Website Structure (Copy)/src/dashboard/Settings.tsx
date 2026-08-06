import { useState } from 'react'
import { Settings as SettingsIcon, User, Lock, Bell, Moon, Globe, Key, Building2 } from 'lucide-react'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Moon },
  { id: 'language', label: 'Language', icon: Globe },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'org', label: 'Organization', icon: Building2 },
]

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button onClick={() => setOn(!on)}
      style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#00E676' : '#374151', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: on ? '#0B1220' : '#6B7280', transition: 'left 0.2s' }} />
    </button>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.78rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.03em' }}>{children}</label>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#F9FAFB', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #1F2937' }}>{title}</h3>
      {children}
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F9FAFB' }}>Settings</h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manage your account and platform preferences</p>
      </div>

      <div className="grid md:grid-cols-[200px,1fr] gap-5">
        {/* Sidebar tabs */}
        <div className="card" style={{ padding: '0.5rem', alignSelf: 'start' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`sidebar-link w-full${activeTab === id ? ' active' : ''}`}
              style={{ background: activeTab === id ? 'rgba(0,230,118,0.1)' : 'transparent', color: activeTab === id ? '#00E676' : '#6B7280' }}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div className="card" style={{ padding: '1.75rem' }}>
          {activeTab === 'profile' && (
            <div>
              <Section title="Personal Information">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><Label>FIRST NAME</Label><input defaultValue="James" /></div>
                  <div><Label>LAST NAME</Label><input defaultValue="Carter" /></div>
                </div>
                <div className="mb-4"><Label>EMAIL ADDRESS</Label><input type="email" defaultValue="j.carter@tesla.com" /></div>
                <div className="mb-4"><Label>JOB TITLE</Label><input defaultValue="Fleet Operations Manager" /></div>
                <div className="mb-4"><Label>PHONE</Label><input type="tel" defaultValue="+1 415-234-5678" /></div>
              </Section>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" style={{ fontSize: '0.875rem' }}>Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div>
              <Section title="Change Password">
                <div className="mb-4"><Label>CURRENT PASSWORD</Label><input type="password" placeholder="••••••••" /></div>
                <div className="mb-4"><Label>NEW PASSWORD</Label><input type="password" placeholder="••••••••" /></div>
                <div className="mb-4"><Label>CONFIRM NEW PASSWORD</Label><input type="password" placeholder="••••••••" /></div>
              </Section>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" style={{ fontSize: '0.875rem' }}>Update Password</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Section title="Notification Preferences">
              {[
                { label: 'Charger fault alerts', sub: 'Immediate push + email when a charger faults', on: true },
                { label: 'Power reduction events', sub: 'Notify when load balancing throttles a charger', on: true },
                { label: 'Session completed', sub: 'Alert when a vehicle finishes charging', on: false },
                { label: 'Invoice generated', sub: 'Email when monthly invoice is created', on: true },
                { label: 'New driver registration', sub: 'Notify on new driver under your tenants', on: false },
                { label: 'Weekly summary digest', sub: 'Weekly email with energy and billing summary', on: true },
                { label: 'API key usage alerts', sub: 'Alert on unusual API consumption patterns', on: true },
              ].map(({ label, sub, on }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 0', borderBottom: '1px solid #1F2937' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#E5E7EB', marginBottom: '0.2rem' }}>{label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#4B5563' }}>{sub}</div>
                  </div>
                  <Toggle defaultOn={on} />
                </div>
              ))}
            </Section>
          )}

          {activeTab === 'appearance' && (
            <Section title="Appearance">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 0', borderBottom: '1px solid #1F2937' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#E5E7EB' }}>Dark Mode</div>
                  <div style={{ fontSize: '0.75rem', color: '#4B5563' }}>Deep navy theme (default)</div>
                </div>
                <Toggle defaultOn />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 0', borderBottom: '1px solid #1F2937' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#E5E7EB' }}>Compact Sidebar</div>
                  <div style={{ fontSize: '0.75rem', color: '#4B5563' }}>Icons-only collapsed sidebar</div>
                </div>
                <Toggle />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 0' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#E5E7EB' }}>Reduced Motion</div>
                  <div style={{ fontSize: '0.75rem', color: '#4B5563' }}>Disable all animations</div>
                </div>
                <Toggle />
              </div>
            </Section>
          )}

          {activeTab === 'api' && (
            <Section title="API Keys">
              {[
                { name: 'Production Key', key: 'vg_live_••••••••••••••••3f8a', created: '2025-01-01', lastUsed: '2 min ago', status: 'active' },
                { name: 'Development Key', key: 'vg_test_••••••••••••••••9c2d', created: '2024-11-15', lastUsed: '3 days ago', status: 'active' },
                { name: 'Webhook Signing', key: 'vg_whsec_••••••••••••••••4e1b', created: '2024-10-01', lastUsed: 'Never', status: 'inactive' },
              ].map(k => (
                <div key={k.name} style={{ background: '#0d1526', border: '1px solid #1F2937', borderRadius: 8, padding: '0.875rem 1rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#E5E7EB' }}>{k.name}</span>
                    <span className="status-chip" style={{ color: k.status === 'active' ? '#00E676' : '#6B7280', background: k.status === 'active' ? 'rgba(0,230,118,0.1)' : 'rgba(107,114,128,0.1)', border: `1px solid ${k.status === 'active' ? '#00E67628' : '#37415128'}`, fontSize: '0.65rem' }}>
                      {k.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#6B7280', marginBottom: '0.35rem' }}>{k.key}</div>
                  <div style={{ fontSize: '0.7rem', color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>Created {k.created} · Last used {k.lastUsed}</div>
                </div>
              ))}
              <button className="btn-outline" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}><Key size={13} /> Generate New Key</button>
            </Section>
          )}

          {activeTab === 'language' && (
            <Section title="Language & Region">
              <div className="mb-4"><Label>LANGUAGE</Label>
                <select>
                  <option>English (US)</option>
                  <option>Deutsch</option>
                  <option>Français</option>
                  <option>日本語</option>
                </select>
              </div>
              <div className="mb-4"><Label>TIMEZONE</Label>
                <select>
                  <option>America/New_York (UTC-5)</option>
                  <option>America/Los_Angeles (UTC-8)</option>
                  <option>Europe/Berlin (UTC+1)</option>
                  <option>Asia/Tokyo (UTC+9)</option>
                </select>
              </div>
              <div className="mb-4"><Label>CURRENCY</Label>
                <select>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                  <option>JPY (¥)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" style={{ fontSize: '0.875rem' }}>Save Preferences</button>
              </div>
            </Section>
          )}

          {activeTab === 'org' && (
            <div>
              <Section title="Organization Details">
                <div className="mb-4"><Label>ORGANIZATION NAME</Label><input defaultValue="Tesla Fleet Inc." /></div>
                <div className="mb-4"><Label>BILLING EMAIL</Label><input type="email" defaultValue="billing@tesla.com" /></div>
                <div className="mb-4"><Label>VAT / TAX ID</Label><input defaultValue="US-123456789" /></div>
                <div className="mb-4"><Label>WEBSITE</Label><input defaultValue="https://www.tesla.com/fleet" /></div>
              </Section>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" style={{ fontSize: '0.875rem' }}>Update Organization</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
