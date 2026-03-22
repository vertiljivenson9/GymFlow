'use client'

import { useState, useEffect } from 'react'

// ============================================
// TYPES
// ============================================
type View = 'landing' | 'login' | 'register' | 'setup' | 'dashboard' | 'trainer' | 'member-qr' | 'member-workout'
type Role = 'owner' | 'trainer' | 'member'

interface User {
  id: string
  email: string
  name: string
  role: Role
  gymId: string
  gym?: {
    id: string
    name: string
    slug: string
    logo?: string
    primaryColor: string
  }
}

interface Member {
  id: string
  name: string
  level: string
  qrCode: string
}

interface Workout {
  id: string
  phase: string
  days: {
    dayIndex: number
    name: string | null
    restDay: boolean
    exercises: {
      order: number
      exerciseId: string
      exerciseName: string
      sets: number
      reps: string
      weight: number
      restSeconds: number
    }[]
  }[]
}

// ============================================
// MAIN APP
// ============================================
export default function GymFlowApp() {
  const [view, setView] = useState<View>('landing')
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [gym, setGym] = useState<any>(null)
  
  // Member state (for QR access)
  const [member, setMember] = useState<Member | null>(null)
  const [workout, setWorkout] = useState<Workout | null>(null)
  
  // Form state
  const [setupForm, setSetupForm] = useState({
    gymName: '',
    slug: '',
    email: '',
    password: '',
    name: '',
  })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem('gymflow_session')
    if (stored) {
      const session = JSON.parse(stored)
      setUser(session.user)
      setToken(session.token)
      setGym(session.user.gym)
      setView(session.user.role === 'owner' || session.user.role === 'trainer' ? 'trainer' : 'dashboard')
    }
  }, [])

  // ============================================
  // API CALLS
  // ============================================
  const api = {
    async setup(data: typeof setupForm) {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    
    async login(email: string, password: string) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      return res.json()
    },
    
    async validateQR(qrCode: string, gymId: string) {
      const res = await fetch(`/api/members/qr?qr=${qrCode}&gymId=${gymId}`)
      return res.json()
    },
    
    async generateWorkout(memberId: string) {
      const res = await fetch('/api/workouts/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId }),
      })
      return res.json()
    },
    
    async getTodayWorkout(memberId: string) {
      const res = await fetch(`/api/workouts/today?memberId=${memberId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      return res.json()
    },
  }

  // ============================================
  // HANDLERS
  // ============================================
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await api.setup(setupForm)
    
    if (result.user) {
      setUser(result.user)
      setToken(result.token)
      setGym(result.gym)
      localStorage.setItem('gymflow_session', JSON.stringify(result))
      setView('trainer')
    } else {
      alert(result.error || 'Failed to setup')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await api.login(loginForm.email, loginForm.password)
    
    if (result.user) {
      setUser(result.user)
      setToken(result.token)
      setGym(result.user.gym)
      localStorage.setItem('gymflow_session', JSON.stringify(result))
      setView(result.user.role === 'owner' || result.user.role === 'trainer' ? 'trainer' : 'dashboard')
    } else {
      alert(result.error || 'Invalid credentials')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setGym(null)
    localStorage.removeItem('gymflow_session')
    setView('landing')
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      {/* HEADER */}
      <header style={{ 
        backgroundColor: '#fff', 
        borderBottom: '1px solid #e5e5e5', 
        padding: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => user ? setView('trainer') : setView('landing')} 
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1.25rem' }}
          >
            GymFlow
          </button>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {user ? (
              <>
                <span style={{ color: '#666', fontSize: '0.875rem' }}>{gym?.name || user.email}</span>
                <button 
                  onClick={logout}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #e5e5e5', background: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setView('login')}
                  style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Entrar
                </button>
                <button 
                  onClick={() => setView('setup')}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Crear Gimnasio
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* LANDING */}
      {view === 'landing' && (
        <LandingView onSetup={() => setView('setup')} onLogin={() => setView('login')} />
      )}

      {/* LOGIN */}
      {view === 'login' && (
        <LoginView 
          form={loginForm} 
          setForm={setLoginForm} 
          onSubmit={handleLogin}
          onBack={() => setView('landing')}
        />
      )}

      {/* SETUP */}
      {view === 'setup' && (
        <SetupView 
          form={setupForm} 
          setForm={setSetupForm} 
          onSubmit={handleSetup}
          onBack={() => setView('landing')}
        />
      )}

      {/* TRAINER DASHBOARD */}
      {view === 'trainer' && user && (
        <TrainerDashboard 
          user={user} 
          gym={gym}
          token={token!}
          onMemberSelect={(m) => { setMember(m); setView('member-workout'); }}
        />
      )}

      {/* MEMBER QR ACCESS */}
      {view === 'member-qr' && (
        <MemberQRAccess 
          gymId={gym?.id || 'demo-gym'}
          onMemberFound={(m) => { setMember(m); setView('member-workout'); }}
        />
      )}

      {/* MEMBER WORKOUT */}
      {view === 'member-workout' && member && (
        <MemberWorkoutView 
          member={member}
          gymId={gym?.id || 'demo-gym'}
          onBack={() => setView('trainer')}
        />
      )}
    </main>
  )
}

// ============================================
// LANDING VIEW
// ============================================
function LandingView({ onSetup, onLogin }: { onSetup: () => void; onLogin: () => void }) {
  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '4rem 1rem', textAlign: 'center', backgroundColor: '#fff' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>
          Tu gimnasio, tu marca, tu sistema
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Sistema de gestión y entrenamiento adaptativo para gimnasios. Sin comisiones, sin complicaciones.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={onSetup}
            style={{ padding: '1rem 2rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            Crear mi Gimnasio
          </button>
          <button 
            onClick={onLogin}
            style={{ padding: '1rem 2rem', backgroundColor: 'transparent', border: '1px solid #000', cursor: 'pointer', fontSize: '1rem' }}
          >
            Ya tengo cuenta
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '4rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Sistema de entrenamiento adaptativo</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {[
            { title: 'Motor Inteligente', desc: 'Genera rutinas que se adaptan al progreso de cada cliente automáticamente.' },
            { title: 'Sin AI pesada', desc: 'Lógica determinística que funciona sin depender de modelos de lenguaje.' },
            { title: 'Acceso QR', desc: 'Tus clientes escanean y entrenan. Sin contraseñas, sin fricción.' },
            { title: 'Tracking Real', desc: 'Mide fatiga, consistencia y rendimiento. Datos que importan.' },
          ].map((f, i) => (
            <div key={i} style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: '#666', fontSize: '0.875rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '4rem 1rem', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '2rem' }}>Un precio simple</h2>
          <div style={{ padding: '2rem', border: '2px solid #000', maxWidth: '400px', margin: '0 auto' }}>
            <p style={{ fontSize: '3rem', fontWeight: 700 }}>$49<span style={{ fontSize: '1rem', color: '#666' }}>/mes</span></p>
            <ul style={{ textAlign: 'left', margin: '1.5rem 0', listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '0.5rem 0' }}>✓ Miembros ilimitados</li>
              <li style={{ padding: '0.5rem 0' }}>✓ Motor de entrenamiento adaptativo</li>
              <li style={{ padding: '0.5rem 0' }}>✓ Acceso QR para clientes</li>
              <li style={{ padding: '0.5rem 0' }}>✓ Tu marca, tu dominio</li>
            </ul>
            <button 
              onClick={onSetup}
              style={{ width: '100%', padding: '1rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
            >
              Empezar gratis 14 días
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

// ============================================
// LOGIN VIEW
// ============================================
function LoginView({ form, setForm, onSubmit, onBack }: any) {
  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Entrar</h2>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
          <input 
            type="email" 
            value={form.email} 
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Contraseña</label>
          <input 
            type="password" 
            value={form.password} 
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
          />
        </div>
        <button type="submit" style={{ padding: '1rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
          Entrar
        </button>
      </form>
      <button onClick={onBack} style={{ marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
        ← Volver
      </button>
    </div>
  )
}

// ============================================
// SETUP VIEW
// ============================================
function SetupView({ form, setForm, onSubmit, onBack }: any) {
  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Crear tu Gimnasio</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Configura tu gimnasio en menos de 5 minutos</p>
      
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nombre del Gimnasio</label>
          <input 
            type="text" 
            value={form.gymName} 
            onChange={(e) => {
              const name = e.target.value
              const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
              setForm({ ...form, gymName: name, slug })
            }}
            placeholder="Wellness Gym Cabarete"
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>URL única</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#666' }}>gymflow.app/</span>
            <input 
              type="text" 
              value={form.slug} 
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              placeholder="wellness-gym"
              style={{ flex: 1, padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
            />
          </div>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Tu nombre</label>
          <input 
            type="text" 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Juan Pérez"
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
          <input 
            type="email" 
            value={form.email} 
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="tu@email.com"
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Contraseña</label>
          <input 
            type="password" 
            value={form.password} 
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
          />
        </div>
        
        <button type="submit" style={{ padding: '1rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem' }}>
          Crear Gimnasio
        </button>
      </form>
      
      <button onClick={onBack} style={{ marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
        ← Volver
      </button>
    </div>
  )
}

// ============================================
// TRAINER DASHBOARD
// ============================================
function TrainerDashboard({ user, gym, token, onMemberSelect }: any) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'exercises' | 'templates' | 'qr'>('overview')
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>{gym?.name || 'Mi Gimnasio'}</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Panel de administración</p>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #e5e5e5', paddingBottom: '1rem' }}>
        {[
          { id: 'overview', label: 'Resumen' },
          { id: 'members', label: 'Miembros' },
          { id: 'exercises', label: 'Ejercicios' },
          { id: 'templates', label: 'Plantillas' },
          { id: 'qr', label: 'Acceso QR' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: activeTab === tab.id ? '#000' : 'none',
              color: activeTab === tab.id ? '#fff' : '#666',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Miembros Activos</p>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>--</p>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Entrenamientos Hoy</p>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>--</p>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Plantillas Activas</p>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>--</p>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', padding: '1.5rem' }}>
          <p style={{ color: '#666' }}>Gestión de miembros próximamente...</p>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
            Los miembros pueden acceder escaneando el código QR desde la pestaña "Acceso QR".
          </p>
        </div>
      )}

      {activeTab === 'exercises' && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', padding: '1.5rem' }}>
          <p style={{ color: '#666' }}>Banco de ejercicios próximamente...</p>
        </div>
      )}

      {activeTab === 'templates' && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', padding: '1.5rem' }}>
          <p style={{ color: '#666' }}>Constructor de plantillas próximamente...</p>
        </div>
      )}

      {activeTab === 'qr' && (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
          <h3 style={{ marginBottom: '1rem' }}>Acceso QR para Miembros</h3>
          <p style={{ color: '#666', marginBottom: '2rem' }}>Los miembros escanean este código para acceder a su entrenamiento</p>
          <div style={{ 
            width: '200px', 
            height: '200px', 
            margin: '0 auto', 
            backgroundColor: '#f5f5f5', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid #e5e5e5',
          }}>
            <span style={{ color: '#999' }}>QR Code</span>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            Código de gimnasio: <code style={{ backgroundColor: '#f5f5f5', padding: '0.25rem 0.5rem' }}>{gym?.id || 'demo-gym'}</code>
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================
// MEMBER QR ACCESS
// ============================================
function MemberQRAccess({ gymId, onMemberFound }: any) {
  const [qrCode, setQrCode] = useState('')
  const [loading, setLoading] = useState(false)

  const validateQR = async () => {
    if (!qrCode) return
    setLoading(true)
    
    try {
      const res = await fetch(`/api/members/qr?qr=${qrCode}&gymId=${gymId}`)
      const data = await res.json()
      
      if (data.valid && data.member) {
        onMemberFound(data.member)
      } else {
        alert(data.error || 'Código QR inválido')
      }
    } catch (error) {
      alert('Error al validar QR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1rem' }}>Acceso Miembro</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Ingresa tu código QR o escanea con la cámara</p>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={qrCode}
          onChange={(e) => setQrCode(e.target.value.toUpperCase())}
          placeholder="GF-XXXXXXXX"
          style={{ 
            width: '100%', 
            padding: '1rem', 
            border: '2px solid #000', 
            fontSize: '1.25rem', 
            textAlign: 'center',
            letterSpacing: '0.1em',
          }}
        />
      </div>
      
      <button
        onClick={validateQR}
        disabled={loading || !qrCode}
        style={{
          width: '100%',
          padding: '1rem',
          backgroundColor: '#000',
          color: '#fff',
          border: 'none',
          cursor: loading ? 'wait' : 'pointer',
          fontSize: '1rem',
          opacity: loading ? 0.5 : 1,
        }}
      >
        {loading ? 'Validando...' : 'Acceder'}
      </button>
    </div>
  )
}

// ============================================
// MEMBER WORKOUT VIEW
// ============================================
function MemberWorkoutView({ member, gymId, onBack }: any) {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [todayIndex, setTodayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)

  useEffect(() => {
    loadWorkout()
  }, [member.id])

  const loadWorkout = async () => {
    setLoading(true)
    try {
      // Try to get existing workout
      let res = await fetch(`/api/workouts/today?memberId=${member.id}`)
      let data = await res.json()
      
      if (!data.id) {
        // Generate new workout
        res = await fetch('/api/workouts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId: member.id }),
        })
        data = await res.json()
      }
      
      setWorkout(data)
    } catch (error) {
      console.error('Error loading workout:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Cargando tu entrenamiento...</p>
      </div>
    )
  }

  if (!workout) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>No se encontró entrenamiento</p>
        <button onClick={onBack} style={{ marginTop: '1rem', padding: '0.5rem 1rem', border: '1px solid #000', background: 'none', cursor: 'pointer' }}>
          Volver
        </button>
      </div>
    )
  }

  const todayWorkout = workout.days.find(d => d.dayIndex === todayIndex)

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', marginBottom: '0.5rem' }}>
          ← Volver
        </button>
        <h1 style={{ marginBottom: '0.25rem' }}>Hola, {member.name}</h1>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>
          Nivel: {member.level} | Fase: {workout.phase}
        </p>
      </div>

      {/* Day selector */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {workout.days.map((day) => (
          <button
            key={day.dayIndex}
            onClick={() => setTodayIndex(day.dayIndex)}
            style={{
              padding: '0.75rem 1rem',
              border: todayIndex === day.dayIndex ? '2px solid #000' : '1px solid #e5e5e5',
              background: todayIndex === day.dayIndex ? '#fff' : '#f5f5f5',
              cursor: 'pointer',
              minWidth: '60px',
              fontSize: '0.75rem',
            }}
          >
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'][day.dayIndex]}
          </button>
        ))}
      </div>

      {/* Workout */}
      {todayWorkout?.restDay ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌙</p>
          <h3>Día de descanso</h3>
          <p style={{ color: '#666' }}>Recupera y vuelve más fuerte mañana</p>
        </div>
      ) : (
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
            {todayWorkout?.name || 'Entrenamiento de Hoy'}
          </h2>
          
          {todayWorkout?.exercises.map((ex, i) => (
            <div 
              key={i}
              style={{ 
                padding: '1rem', 
                backgroundColor: '#fff', 
                border: '1px solid #e5e5e5', 
                marginBottom: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ fontWeight: 500 }}>{ex.exerciseName}</p>
                <p style={{ color: '#666', fontSize: '0.875rem' }}>
                  {ex.sets} sets × {ex.reps} reps
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <input
                  type="number"
                  placeholder="kg"
                  style={{ width: '60px', padding: '0.5rem', border: '1px solid #e5e5e5', textAlign: 'center' }}
                  defaultValue={ex.weight || ''}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
