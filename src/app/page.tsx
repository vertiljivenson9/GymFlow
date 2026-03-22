'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

// ============================================
// TYPES
// ============================================
type View = 'landing' | 'login' | 'register' | 'setup' | 'dashboard' | 'trainer' | 'member-qr' | 'member-workout' | 'template-editor'
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

interface Exercise {
  id: string
  name: string
  type: 'push' | 'pull' | 'legs' | 'core' | 'cardio' | 'mobility'
  difficulty: number
  fatigueImpact: number
  muscleGroups: string[]
  equipment?: string
}

interface TemplateBlock {
  id: string
  blockType: 'push' | 'pull' | 'legs' | 'core' | 'cardio' | 'mobility'
  blockOrder: number
  sets: number
  reps: string
  restSeconds: number
  notes?: string
  exercises: {
    exerciseId: string
    exerciseName: string
    order: number
  }[]
}

interface TemplateDay {
  id: string
  dayIndex: number
  name: string
  restDay: boolean
  blocks: TemplateBlock[]
}

interface Template {
  id: string
  name: string
  description?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  goal?: string
  daysPerWeek: number
  days: TemplateDay[]
}

interface Member {
  id: string
  name: string
  level: string
  qrCode: string
}

// ============================================
// DEMO DATA
// ============================================
const DEMO_MEMBERS: Member[] = [
  { id: 'm1', name: 'María García', level: 'beginner', qrCode: 'GF-MARIA01' },
  { id: 'm2', name: 'Carlos Rodríguez', level: 'intermediate', qrCode: 'GF-CARLOS1' },
  { id: 'm3', name: 'Ana Martínez', level: 'beginner', qrCode: 'GF-ANA001' },
]

const DEMO_EXERCISES: Exercise[] = [
  { id: 'e1', name: 'Bench Press', type: 'push', difficulty: 2, fatigueImpact: 6, muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: 'barbell' },
  { id: 'e2', name: 'Incline Dumbbell Press', type: 'push', difficulty: 2, fatigueImpact: 5, muscleGroups: ['upper-chest', 'shoulders'], equipment: 'dumbbell' },
  { id: 'e3', name: 'Shoulder Press', type: 'push', difficulty: 2, fatigueImpact: 5, muscleGroups: ['shoulders', 'triceps'], equipment: 'dumbbell' },
  { id: 'e4', name: 'Lateral Raises', type: 'push', difficulty: 1, fatigueImpact: 3, muscleGroups: ['shoulders'], equipment: 'dumbbell' },
  { id: 'e5', name: 'Tricep Pushdown', type: 'push', difficulty: 1, fatigueImpact: 3, muscleGroups: ['triceps'], equipment: 'cable' },
  { id: 'e6', name: 'Pull-ups', type: 'pull', difficulty: 3, fatigueImpact: 6, muscleGroups: ['back', 'biceps'], equipment: 'bodyweight' },
  { id: 'e7', name: 'Lat Pulldown', type: 'pull', difficulty: 1, fatigueImpact: 4, muscleGroups: ['lats', 'biceps'], equipment: 'cable' },
  { id: 'e8', name: 'Barbell Row', type: 'pull', difficulty: 2, fatigueImpact: 6, muscleGroups: ['back', 'biceps'], equipment: 'barbell' },
  { id: 'e9', name: 'Face Pulls', type: 'pull', difficulty: 1, fatigueImpact: 2, muscleGroups: ['rear-delts'], equipment: 'cable' },
  { id: 'e10', name: 'Bicep Curls', type: 'pull', difficulty: 1, fatigueImpact: 3, muscleGroups: ['biceps'], equipment: 'dumbbell' },
  { id: 'e11', name: 'Squats', type: 'legs', difficulty: 3, fatigueImpact: 8, muscleGroups: ['quads', 'glutes', 'core'], equipment: 'barbell' },
  { id: 'e12', name: 'Leg Press', type: 'legs', difficulty: 2, fatigueImpact: 6, muscleGroups: ['quads', 'glutes'], equipment: 'machine' },
  { id: 'e13', name: 'Romanian Deadlift', type: 'legs', difficulty: 3, fatigueImpact: 7, muscleGroups: ['hamstrings', 'glutes'], equipment: 'barbell' },
  { id: 'e14', name: 'Leg Curls', type: 'legs', difficulty: 1, fatigueImpact: 4, muscleGroups: ['hamstrings'], equipment: 'machine' },
  { id: 'e15', name: 'Calf Raises', type: 'legs', difficulty: 1, fatigueImpact: 3, muscleGroups: ['calves'], equipment: 'machine' },
  { id: 'e16', name: 'Lunges', type: 'legs', difficulty: 2, fatigueImpact: 6, muscleGroups: ['quads', 'glutes'], equipment: 'bodyweight' },
  { id: 'e17', name: 'Plank', type: 'core', difficulty: 1, fatigueImpact: 3, muscleGroups: ['core'], equipment: 'bodyweight' },
  { id: 'e18', name: 'Hanging Leg Raises', type: 'core', difficulty: 2, fatigueImpact: 4, muscleGroups: ['abs'], equipment: 'bodyweight' },
  { id: 'e19', name: 'Cable Crunches', type: 'core', difficulty: 1, fatigueImpact: 3, muscleGroups: ['abs'], equipment: 'cable' },
  { id: 'e20', name: 'Treadmill Run', type: 'cardio', difficulty: 2, fatigueImpact: 5, muscleGroups: ['full-body'], equipment: 'treadmill' },
  { id: 'e21', name: 'Jump Rope', type: 'cardio', difficulty: 2, fatigueImpact: 4, muscleGroups: ['full-body'], equipment: 'rope' },
  { id: 'e22', name: 'Hip Mobility Flow', type: 'mobility', difficulty: 1, fatigueImpact: 1, muscleGroups: ['hips'], equipment: 'bodyweight' },
]

const DEMO_TEMPLATES: Template[] = [
  {
    id: 't1',
    name: 'Full Body Beginner',
    description: 'Rutina de cuerpo completo para principiantes. 3 días por semana.',
    level: 'beginner',
    goal: 'general',
    daysPerWeek: 3,
    days: [
      {
        id: 'd1',
        dayIndex: 0,
        name: 'Día A - Push Focus',
        restDay: false,
        blocks: [
          { id: 'b1', blockType: 'push', blockOrder: 1, sets: 3, reps: '8-12', restSeconds: 90, exercises: [
            { exerciseId: 'e1', exerciseName: 'Bench Press', order: 1 },
            { exerciseId: 'e4', exerciseName: 'Lateral Raises', order: 2 },
          ]},
          { id: 'b2', blockType: 'legs', blockOrder: 2, sets: 3, reps: '8-12', restSeconds: 90, exercises: [
            { exerciseId: 'e11', exerciseName: 'Squats', order: 1 },
          ]},
          { id: 'b3', blockType: 'core', blockOrder: 3, sets: 3, reps: '30s', restSeconds: 45, exercises: [
            { exerciseId: 'e17', exerciseName: 'Plank', order: 1 },
          ]},
        ]
      },
      {
        id: 'd2',
        dayIndex: 1,
        name: '',
        restDay: true,
        blocks: []
      },
      {
        id: 'd3',
        dayIndex: 2,
        name: 'Día B - Pull Focus',
        restDay: false,
        blocks: [
          { id: 'b4', blockType: 'pull', blockOrder: 1, sets: 3, reps: '8-12', restSeconds: 90, exercises: [
            { exerciseId: 'e7', exerciseName: 'Lat Pulldown', order: 1 },
            { exerciseId: 'e10', exerciseName: 'Bicep Curls', order: 2 },
          ]},
          { id: 'b5', blockType: 'legs', blockOrder: 2, sets: 3, reps: '8-12', restSeconds: 90, exercises: [
            { exerciseId: 'e12', exerciseName: 'Leg Press', order: 1 },
          ]},
        ]
      },
      {
        id: 'd4',
        dayIndex: 3,
        name: '',
        restDay: true,
        blocks: []
      },
      {
        id: 'd5',
        dayIndex: 4,
        name: 'Día C - Full Body',
        restDay: false,
        blocks: [
          { id: 'b6', blockType: 'push', blockOrder: 1, sets: 3, reps: '8-12', restSeconds: 90, exercises: [
            { exerciseId: 'e3', exerciseName: 'Shoulder Press', order: 1 },
          ]},
          { id: 'b7', blockType: 'pull', blockOrder: 2, sets: 3, reps: '8-12', restSeconds: 90, exercises: [
            { exerciseId: 'e8', exerciseName: 'Barbell Row', order: 1 },
          ]},
          { id: 'b8', blockType: 'legs', blockOrder: 3, sets: 3, reps: '10-15', restSeconds: 60, exercises: [
            { exerciseId: 'e16', exerciseName: 'Lunges', order: 1 },
          ]},
        ]
      },
      {
        id: 'd6',
        dayIndex: 5,
        name: '',
        restDay: true,
        blocks: []
      },
      {
        id: 'd7',
        dayIndex: 6,
        name: '',
        restDay: true,
        blocks: []
      },
    ]
  },
  {
    id: 't2',
    name: 'Upper/Lower Split',
    description: 'División superior/inferior para nivel intermedio.',
    level: 'intermediate',
    goal: 'hypertrophy',
    daysPerWeek: 4,
    days: []
  },
]

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DAY_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const BLOCK_COLORS: Record<string, string> = {
  push: '#ef4444',
  pull: '#3b82f6',
  legs: '#22c55e',
  core: '#f59e0b',
  cardio: '#ec4899',
  mobility: '#8b5cf6',
}

// ============================================
// MAIN APP
// ============================================
export default function GymFlowApp() {
  const [view, setView] = useState<View>('landing')
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [gym, setGym] = useState<any>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  
  const [setupForm, setSetupForm] = useState({
    gymName: '',
    slug: '',
    email: '',
    password: '',
    name: '',
  })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  useEffect(() => {
    const stored = localStorage.getItem('gymflow_session')
    if (stored) {
      const session = JSON.parse(stored)
      setUser(session.user)
      setToken(session.token)
      setGym(session.user.gym)
      setView(session.user.role === 'owner' || session.user.role === 'trainer' ? 'trainer' : 'dashboard')
    }
  }, [])

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setupForm),
    }).then(r => r.json())
    
    if (result.user) {
      setUser(result.user)
      setToken(result.token)
      setGym(result.gym)
      localStorage.setItem('gymflow_session', JSON.stringify(result))
      setView('trainer')
    } else {
      alert(result.error || 'Error al crear')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm),
    }).then(r => r.json())
    
    if (result.user) {
      setUser(result.user)
      setToken(result.token)
      setGym(result.user.gym)
      localStorage.setItem('gymflow_session', JSON.stringify(result))
      setView('trainer')
    } else {
      alert(result.error || 'Credenciales inválidas')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setGym(null)
    localStorage.removeItem('gymflow_session')
    setView('landing')
  }

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
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => user ? setView('trainer') : setView('landing')} 
            style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {gym?.logo ? (
              <img src={gym.logo} alt={gym.name} style={{ height: '40px' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src="/logo.svg" alt="GymFlow" style={{ height: '36px' }} />
                {gym?.name && <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{gym.name}</span>}
              </div>
            )}
          </button>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {user ? (
              <>
                <span style={{ color: '#666', fontSize: '0.875rem' }}>{gym?.name || user.email}</span>
                <button onClick={logout} style={{ padding: '0.5rem 1rem', border: '1px solid #e5e5e5', background: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setView('login')} style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
                  Entrar
                </button>
                <button onClick={() => setView('setup')} style={{ padding: '0.5rem 1rem', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>
                  Crear Gimnasio
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* VIEWS */}
      {view === 'landing' && <LandingView onSetup={() => setView('setup')} onLogin={() => setView('login')} />}
      
      {view === 'login' && (
        <LoginView form={loginForm} setForm={setLoginForm} onSubmit={handleLogin} onBack={() => setView('landing')} />
      )}
      
      {view === 'setup' && (
        <SetupView form={setupForm} setForm={setSetupForm} onSubmit={handleSetup} onBack={() => setView('landing')} />
      )}
      
      {view === 'trainer' && user && (
        <TrainerDashboard 
          gym={gym} 
          templates={DEMO_TEMPLATES}
          exercises={DEMO_EXERCISES}
          onMemberSelect={(m: Member) => { setMember(m); setView('member-workout'); }}
          onEditTemplate={(t: Template) => { setSelectedTemplate(t); setView('template-editor'); }}
          onCreateTemplate={() => { setSelectedTemplate(null); setView('template-editor'); }}
        />
      )}
      
      {view === 'template-editor' && (
        <TemplateEditor 
          template={selectedTemplate} 
          exercises={DEMO_EXERCISES}
          onSave={(t) => { console.log('Save template:', t); setView('trainer'); }}
          onBack={() => setView('trainer')}
        />
      )}
      
      {view === 'member-workout' && member && (
        <MemberWorkoutView member={member} onBack={() => setView('trainer')} />
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
      <section style={{ padding: '4rem 1rem', textAlign: 'center', backgroundColor: '#fff' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>
          Tu gimnasio, tu marca, tu sistema
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Sistema de gestión y entrenamiento adaptativo para gimnasios. Sin comisiones, sin complicaciones.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={onSetup} style={{ padding: '1rem 2rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
            Crear mi Gimnasio
          </button>
          <button onClick={onLogin} style={{ padding: '1rem 2rem', backgroundColor: 'transparent', border: '1px solid #000', cursor: 'pointer', fontSize: '1rem' }}>
            Ya tengo cuenta
          </button>
        </div>
      </section>

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
            <button onClick={onSetup} style={{ width: '100%', padding: '1rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
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
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Contraseña</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }} />
        </div>
        <button type="submit" style={{ padding: '1rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
          Entrar
        </button>
      </form>
      <button onClick={onBack} style={{ marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>← Volver</button>
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
          <input type="text" value={form.gymName} onChange={(e) => {
            const name = e.target.value
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            setForm({ ...form, gymName: name, slug })
          }} placeholder="Wellness Gym Cabarete" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }} />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>URL única</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#666' }}>gymflow.app/</span>
            <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="wellness-gym" style={{ flex: 1, padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }} />
          </div>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Tu nombre</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Juan Pérez" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }} />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tu@email.com" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }} />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Contraseña</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }} />
        </div>
        
        <button type="submit" style={{ padding: '1rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem' }}>
          Crear Gimnasio
        </button>
      </form>
      
      <button onClick={onBack} style={{ marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>← Volver</button>
    </div>
  )
}

// ============================================
// TRAINER DASHBOARD
// ============================================
function TrainerDashboard({ 
  gym, 
  templates, 
  exercises,
  onMemberSelect, 
  onEditTemplate,
  onCreateTemplate 
}: { 
  gym: any
  templates: Template[]
  exercises: Exercise[]
  onMemberSelect: (m: Member) => void
  onEditTemplate: (t: Template) => void
  onCreateTemplate: () => void
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'exercises' | 'templates' | 'qr'>('templates')

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
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
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{DEMO_MEMBERS.length}</p>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Ejercicios</p>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{exercises.length}</p>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Plantillas</p>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{templates.length}</p>
          </div>
        </div>
      )}

      {activeTab === 'members' && <MembersPanel members={DEMO_MEMBERS} onSelect={onMemberSelect} />}

      {activeTab === 'exercises' && <ExercisesPanel exercises={exercises} />}

      {activeTab === 'templates' && (
        <TemplatesPanel 
          templates={templates} 
          onEdit={onEditTemplate} 
          onCreate={onCreateTemplate} 
        />
      )}

      {activeTab === 'qr' && (
        <QRPanel gym={gym} members={DEMO_MEMBERS} />
      )}
    </div>
  )
}

// ============================================
// MEMBERS PANEL
// ============================================
function MembersPanel({ members, onSelect }: { members: Member[]; onSelect: (m: Member) => void }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', email: '', phone: '', level: 'beginner' })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Miembros</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          + Agregar Miembro
        </button>
      </div>

      <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e5e5', backgroundColor: '#f9f9f9' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>Nombre</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>Nivel</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>QR Code</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} style={{ borderBottom: '1px solid #e5e5e5' }}>
                <td style={{ padding: '0.75rem' }}>{m.name}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.25rem 0.5rem', 
                    backgroundColor: m.level === 'beginner' ? '#dcfce7' : m.level === 'intermediate' ? '#fef3c7' : '#fee2e2', 
                    borderRadius: '4px',
                    textTransform: 'capitalize'
                  }}>
                    {m.level}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}><code style={{ backgroundColor: '#f5f5f5', padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }}>{m.qrCode}</code></td>
                <td style={{ padding: '0.75rem' }}>
                  <button onClick={() => onSelect(m)} style={{ padding: '0.25rem 0.5rem', border: '1px solid #000', background: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>
                    Ver workout
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Agregar Miembro</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nombre *</label>
                <input 
                  type="text" 
                  value={newMember.name} 
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
                <input 
                  type="email" 
                  value={newMember.email} 
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Teléfono</label>
                <input 
                  type="tel" 
                  value={newMember.phone} 
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nivel</label>
                <select 
                  value={newMember.level} 
                  onChange={(e) => setNewMember({ ...newMember, level: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
                >
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  onClick={() => { setShowAddModal(false); setNewMember({ name: '', email: '', phone: '', level: 'beginner' }); }}
                  style={{ flex: 1, padding: '0.75rem', border: '1px solid #e5e5e5', background: 'none', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => { alert('Miembro creado: ' + newMember.name); setShowAddModal(false); }}
                  style={{ flex: 1, padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// EXERCISES PANEL
// ============================================
function ExercisesPanel({ exercises }: { exercises: Exercise[] }) {
  const [filter, setFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({
    name: '',
    type: 'push',
    difficulty: 2,
    fatigueImpact: 5,
    muscleGroups: [],
    equipment: ''
  })

  const filtered = filter === 'all' ? exercises : exercises.filter(e => e.type === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Banco de Ejercicios</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          + Agregar Ejercicio
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setFilter('all')}
          style={{ 
            padding: '0.5rem 1rem', 
            border: filter === 'all' ? '2px solid #000' : '1px solid #e5e5e5',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            textTransform: 'uppercase'
          }}
        >
          Todos
        </button>
        {['push', 'pull', 'legs', 'core', 'cardio', 'mobility'].map(type => (
          <button 
            key={type}
            onClick={() => setFilter(type)}
            style={{ 
              padding: '0.5rem 1rem', 
              border: filter === type ? '2px solid #000' : '1px solid #e5e5e5',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: '#666'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Exercise Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filtered.map((ex) => (
          <div 
            key={ex.id} 
            style={{ 
              padding: '1rem', 
              backgroundColor: '#fff', 
              border: '1px solid #e5e5e5',
              borderLeft: `4px solid ${BLOCK_COLORS[ex.type]}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <p style={{ fontWeight: 600 }}>{ex.name}</p>
              <span style={{ 
                fontSize: '0.625rem', 
                padding: '0.125rem 0.375rem', 
                backgroundColor: BLOCK_COLORS[ex.type] + '20',
                color: BLOCK_COLORS[ex.type],
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontWeight: 600
              }}>
                {ex.type}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#666' }}>
              <span>Dificultad: {ex.difficulty}/5</span>
              <span>Fatiga: {ex.fatigueImpact}/10</span>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#999' }}>
              {ex.muscleGroups.join(', ')}
              {ex.equipment && ` • ${ex.equipment}`}
            </div>
          </div>
        ))}
      </div>

      {/* Add Exercise Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Agregar Ejercicio</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nombre *</label>
                <input 
                  type="text" 
                  value={newExercise.name} 
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Tipo</label>
                <select 
                  value={newExercise.type} 
                  onChange={(e) => setNewExercise({ ...newExercise, type: e.target.value as Exercise['type'] })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
                >
                  <option value="push">Push (Empuje)</option>
                  <option value="pull">Pull (Tracción)</option>
                  <option value="legs">Legs (Piernas)</option>
                  <option value="core">Core (Core)</option>
                  <option value="cardio">Cardio</option>
                  <option value="mobility">Movilidad</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Dificultad (1-5)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={5} 
                    value={newExercise.difficulty} 
                    onChange={(e) => setNewExercise({ ...newExercise, difficulty: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Impacto Fatiga (1-10)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={10} 
                    value={newExercise.fatigueImpact} 
                    onChange={(e) => setNewExercise({ ...newExercise, fatigueImpact: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Grupos Musculares (separados por coma)</label>
                <input 
                  type="text" 
                  placeholder="chest, triceps, shoulders"
                  onChange={(e) => setNewExercise({ ...newExercise, muscleGroups: e.target.value.split(',').map(s => s.trim()) })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Equipo</label>
                <input 
                  type="text" 
                  placeholder="barbell, dumbbell, cable..."
                  value={newExercise.equipment} 
                  onChange={(e) => setNewExercise({ ...newExercise, equipment: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '0.75rem', border: '1px solid #e5e5e5', background: 'none', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => { alert('Ejercicio creado: ' + newExercise.name); setShowAddModal(false); }}
                  style={{ flex: 1, padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// TEMPLATES PANEL
// ============================================
function TemplatesPanel({ 
  templates, 
  onEdit, 
  onCreate 
}: { 
  templates: Template[]
  onEdit: (t: Template) => void
  onCreate: () => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Plantillas de Entrenamiento</h2>
          <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Crea y edita plantillas con días, bloques y ejercicios
          </p>
        </div>
        <button 
          onClick={onCreate}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          + Crear Plantilla
        </button>
      </div>

      {/* Template Cards */}
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {templates.map((template) => (
          <div 
            key={template.id} 
            style={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e5e5',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: '1px solid #e5e5e5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <h3 style={{ marginBottom: '0.25rem' }}>{template.name}</h3>
                <p style={{ color: '#666', fontSize: '0.875rem' }}>{template.description}</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.25rem 0.5rem', 
                    backgroundColor: template.level === 'beginner' ? '#dcfce7' : template.level === 'intermediate' ? '#fef3c7' : '#fee2e2',
                    borderRadius: '4px',
                    textTransform: 'capitalize'
                  }}>
                    {template.level}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>
                    {template.daysPerWeek} días/semana
                  </span>
                </div>
              </div>
              <button 
                onClick={() => onEdit(template)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #000', background: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                Editar
              </button>
            </div>

            {/* Week Preview */}
            <div style={{ padding: '1rem', backgroundColor: '#fafafa' }}>
              <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                Vista semanal
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {template.days.map((day) => (
                  <div 
                    key={day.id}
                    style={{ 
                      padding: '0.75rem 0.5rem',
                      backgroundColor: day.restDay ? '#fff' : '#000',
                      color: day.restDay ? '#999' : '#fff',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{DAY_SHORT[day.dayIndex]}</div>
                    {day.restDay ? (
                      <div style={{ fontSize: '0.625rem', opacity: 0.7 }}>Descanso</div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '0.25rem' }}>
                        {day.blocks.map((block, i) => (
                          <div 
                            key={i}
                            style={{ 
                              width: '8px', 
                              height: '8px', 
                              backgroundColor: BLOCK_COLORS[block.blockType],
                              borderRadius: '2px'
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Blocks Preview */}
            {template.days.some(d => !d.restDay && d.blocks.length > 0) && (
              <div style={{ padding: '1rem', borderTop: '1px solid #e5e5e5' }}>
                <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  Bloques por día
                </p>
                {template.days.filter(d => !d.restDay).map((day) => (
                  <div key={day.id} style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      {day.name || DAY_NAMES[day.dayIndex]}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {day.blocks.map((block) => (
                        <span 
                          key={block.id}
                          style={{ 
                            fontSize: '0.625rem', 
                            padding: '0.25rem 0.5rem',
                            backgroundColor: BLOCK_COLORS[block.blockType] + '20',
                            color: BLOCK_COLORS[block.blockType],
                            borderRadius: '4px',
                            textTransform: 'capitalize'
                          }}
                        >
                          {block.blockType} ({block.sets}×{block.reps})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// TEMPLATE EDITOR - FULL FUNCTIONALITY
// ============================================
function TemplateEditor({ 
  template, 
  exercises,
  onSave, 
  onBack 
}: { 
  template: Template | null
  exercises: Exercise[]
  onSave: (t: Template) => void
  onBack: () => void
}) {
  const isNew = !template
  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(template?.level || 'beginner')
  const [goal, setGoal] = useState(template?.goal || 'general')
  const [days, setDays] = useState<TemplateDay[]>(
    template?.days || DAY_NAMES.map((_, i) => ({
      id: `new-${i}`,
      dayIndex: i,
      name: '',
      restDay: i >= 3,
      blocks: []
    }))
  )
  const [activeDay, setActiveDay] = useState(0)
  const [showExercisePicker, setShowExercisePicker] = useState<string | null>(null) // block id

  const updateDay = (dayIndex: number, updates: Partial<TemplateDay>) => {
    setDays(days.map(d => d.dayIndex === dayIndex ? { ...d, ...updates } : d))
  }

  const addBlock = (dayIndex: number) => {
    const day = days.find(d => d.dayIndex === dayIndex)
    if (!day) return
    
    const newBlock: TemplateBlock = {
      id: `block-${Date.now()}`,
      blockType: 'push',
      blockOrder: day.blocks.length,
      sets: 3,
      reps: '8-12',
      restSeconds: 90,
      exercises: []
    }
    
    updateDay(dayIndex, { blocks: [...day.blocks, newBlock], restDay: false })
  }

  const updateBlock = (dayIndex: number, blockId: string, updates: Partial<TemplateBlock>) => {
    const day = days.find(d => d.dayIndex === dayIndex)
    if (!day) return
    
    updateDay(dayIndex, {
      blocks: day.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
    })
  }

  const removeBlock = (dayIndex: number, blockId: string) => {
    const day = days.find(d => d.dayIndex === dayIndex)
    if (!day) return
    
    updateDay(dayIndex, {
      blocks: day.blocks.filter(b => b.id !== blockId)
    })
  }

  const addExerciseToBlock = (blockId: string, exercise: Exercise) => {
    const day = days.find(d => d.dayIndex === activeDay)
    if (!day) return
    
    updateBlock(activeDay, blockId, {
      exercises: [
        ...day.blocks.find(b => b.id === blockId)?.exercises || [],
        { exerciseId: exercise.id, exerciseName: exercise.name, order: day.blocks.find(b => b.id === blockId)?.exercises.length || 0 }
      ]
    })
    setShowExercisePicker(null)
  }

  const removeExerciseFromBlock = (blockId: string, exerciseId: string) => {
    const day = days.find(d => d.dayIndex === activeDay)
    if (!day) return
    
    const block = day.blocks.find(b => b.id === blockId)
    if (!block) return
    
    updateBlock(activeDay, blockId, {
      exercises: block.exercises.filter(e => e.exerciseId !== exerciseId)
    })
  }

  const handleSave = () => {
    if (!name.trim()) {
      alert('Ingresa un nombre para la plantilla')
      return
    }
    
    const workoutDays = days.filter(d => !d.restDay)
    const template: Template = {
      id: template?.id || `t-${Date.now()}`,
      name,
      description,
      level,
      goal,
      daysPerWeek: workoutDays.length,
      days
    }
    
    onSave(template)
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: '0.25rem' }}>{isNew ? 'Nueva Plantilla' : 'Editar Plantilla'}</h1>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            Configura días, bloques y ejercicios
          </p>
        </div>
        <button 
          onClick={handleSave}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Guardar Plantilla
        </button>
      </div>

      {/* Basic Info */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', color: '#666' }}>
          Información Básica
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 500 }}>Nombre *</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Full Body Beginner"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 500 }}>Nivel</label>
            <select 
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 500 }}>Objetivo</label>
            <select 
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
            >
              <option value="general">General</option>
              <option value="strength">Fuerza</option>
              <option value="hypertrophy">Hipertrofia</option>
              <option value="endurance">Resistencia</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 500 }}>Descripción</label>
          <input 
            type="text" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción breve de la plantilla..."
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
          />
        </div>
      </div>

      {/* Week Overview */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
          <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#666' }}>
            Vista Semanal - Haz clic en un día para editarlo
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map((day) => (
            <button
              key={day.dayIndex}
              onClick={() => setActiveDay(day.dayIndex)}
              style={{ 
                padding: '1rem',
                backgroundColor: activeDay === day.dayIndex ? '#000' : 'transparent',
                color: activeDay === day.dayIndex ? '#fff' : day.restDay ? '#999' : '#333',
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeDay === day.dayIndex ? '3px solid #fff' : '1px solid #e5e5e5',
                textAlign: 'center'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{DAY_SHORT[day.dayIndex]}</div>
              <div style={{ fontSize: '0.625rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                {day.restDay ? 'Descanso' : day.name || 'Entreno'}
              </div>
              {!day.restDay && day.blocks.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                  {day.blocks.map((block, i) => (
                    <div 
                      key={i}
                      style={{ 
                        width: '10px', 
                        height: '10px', 
                        backgroundColor: BLOCK_COLORS[block.blockType],
                        borderRadius: '2px'
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Day Editor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        {/* Left: Day Content */}
        <div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ marginBottom: '0.25rem' }}>{DAY_NAMES[activeDay]}</h3>
                <p style={{ fontSize: '0.75rem', color: '#666' }}>
                  Día {activeDay + 1} de 7
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={days[activeDay]?.restDay}
                  onChange={(e) => updateDay(activeDay, { restDay: e.target.checked, blocks: e.target.checked ? [] : days[activeDay].blocks })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Día de descanso</span>
              </label>
            </div>

            {days[activeDay]?.restDay ? (
              <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fafafa', border: '1px dashed #e5e5e5' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌙</p>
                <h4>Día de Descanso</h4>
                <p style={{ color: '#666', fontSize: '0.875rem' }}>Recuperación activa o descanso completo</p>
              </div>
            ) : (
              <div>
                {/* Day Name */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 500 }}>
                    Nombre del día (opcional)
                  </label>
                  <input 
                    type="text" 
                    value={days[activeDay]?.name || ''}
                    onChange={(e) => updateDay(activeDay, { name: e.target.value })}
                    placeholder="Ej: Push Day, Full Body A..."
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e5e5', fontSize: '1rem' }}
                  />
                </div>

                {/* Blocks */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#666' }}>
                    Bloques de Entrenamiento
                  </h4>
                  <button 
                    onClick={() => addBlock(activeDay)}
                    style={{ padding: '0.5rem 1rem', border: '1px solid #000', background: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    + Agregar Bloque
                  </button>
                </div>

                {days[activeDay]?.blocks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#fafafa', border: '1px dashed #e5e5e5' }}>
                    <p style={{ color: '#666', marginBottom: '1rem' }}>No hay bloques en este día</p>
                    <button 
                      onClick={() => addBlock(activeDay)}
                      style={{ padding: '0.75rem 1.5rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      + Agregar Primer Bloque
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {days[activeDay]?.blocks.map((block, index) => (
                      <div 
                        key={block.id}
                        style={{ 
                          border: '1px solid #e5e5e5',
                          borderLeft: `4px solid ${BLOCK_COLORS[block.blockType]}`,
                          backgroundColor: '#fff'
                        }}
                      >
                        {/* Block Header */}
                        <div style={{ 
                          padding: '1rem', 
                          borderBottom: '1px solid #e5e5e5',
                          backgroundColor: BLOCK_COLORS[block.blockType] + '10',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontWeight: 600, color: BLOCK_COLORS[block.blockType] }}>
                              Bloque {index + 1}
                            </span>
                            <select 
                              value={block.blockType}
                              onChange={(e) => updateBlock(activeDay, block.id, { blockType: e.target.value as any })}
                              style={{ 
                                padding: '0.5rem',
                                border: '1px solid #e5e5e5',
                                backgroundColor: '#fff',
                                fontSize: '0.875rem',
                                textTransform: 'capitalize'
                              }}
                            >
                              <option value="push">Push (Empuje)</option>
                              <option value="pull">Pull (Tracción)</option>
                              <option value="legs">Legs (Piernas)</option>
                              <option value="core">Core (Abdomen)</option>
                              <option value="cardio">Cardio</option>
                              <option value="mobility">Movilidad</option>
                            </select>
                          </div>
                          <button 
                            onClick={() => removeBlock(activeDay, block.id)}
                            style={{ padding: '0.25rem 0.5rem', border: 'none', background: 'none', cursor: 'pointer', color: '#999', fontSize: '1.25rem' }}
                          >
                            ×
                          </button>
                        </div>

                        {/* Block Config */}
                        <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.625rem', color: '#666', textTransform: 'uppercase' }}>
                              Sets
                            </label>
                            <input 
                              type="number" 
                              min={1} 
                              max={10}
                              value={block.sets}
                              onChange={(e) => updateBlock(activeDay, block.id, { sets: parseInt(e.target.value) })}
                              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e5e5', fontSize: '1rem', textAlign: 'center' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.625rem', color: '#666', textTransform: 'uppercase' }}>
                              Reps
                            </label>
                            <input 
                              type="text" 
                              value={block.reps}
                              onChange={(e) => updateBlock(activeDay, block.id, { reps: e.target.value })}
                              placeholder="8-12"
                              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e5e5', fontSize: '1rem', textAlign: 'center' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.625rem', color: '#666', textTransform: 'uppercase' }}>
                              Descanso (seg)
                            </label>
                            <input 
                              type="number" 
                              min={0} 
                              max={600}
                              step={15}
                              value={block.restSeconds}
                              onChange={(e) => updateBlock(activeDay, block.id, { restSeconds: parseInt(e.target.value) })}
                              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e5e5', fontSize: '1rem', textAlign: 'center' }}
                            />
                          </div>
                        </div>

                        {/* Exercises in Block */}
                        <div style={{ padding: '0 1rem 1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.625rem', color: '#666', textTransform: 'uppercase' }}>
                              Ejercicios ({block.exercises.length})
                            </label>
                            <button 
                              onClick={() => setShowExercisePicker(block.id)}
                              style={{ padding: '0.25rem 0.5rem', border: '1px solid #e5e5e5', background: 'none', cursor: 'pointer', fontSize: '0.625rem', textTransform: 'uppercase' }}
                            >
                              + Agregar
                            </button>
                          </div>
                          
                          {block.exercises.length === 0 ? (
                            <div style={{ padding: '0.75rem', backgroundColor: '#fafafa', textAlign: 'center', fontSize: '0.75rem', color: '#999' }}>
                              Sin ejercicios
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {block.exercises.map((ex, i) => (
                                <div 
                                  key={ex.exerciseId + i}
                                  style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '0.5rem 0.75rem',
                                    backgroundColor: '#fafafa',
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  <span>{i + 1}. {ex.exerciseName}</span>
                                  <button 
                                    onClick={() => removeExerciseFromBlock(block.id, ex.exerciseId)}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', padding: '0' }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Exercise Picker */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', maxHeight: 'calc(100vh - 150px)', overflow: 'auto' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5', position: 'sticky', top: 0, backgroundColor: '#fff' }}>
              <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#666' }}>
                {showExercisePicker ? 'Seleccionar Ejercicio' : 'Banco de Ejercicios'}
              </h4>
              {showExercisePicker && (
                <button 
                  onClick={() => setShowExercisePicker(null)}
                  style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#666' }}
                >
                  ← Cancelar selección
                </button>
              )}
            </div>
            
            {/* Exercise Filter */}
            <div style={{ padding: '0.5rem', borderBottom: '1px solid #e5e5e5' }}>
              <input 
                type="text" 
                placeholder="Buscar ejercicio..."
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e5e5', fontSize: '0.875rem' }}
              />
            </div>

            {/* Exercise List */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {['push', 'pull', 'legs', 'core', 'cardio', 'mobility'].map(type => {
                const typeExercises = exercises.filter(e => e.type === type)
                if (typeExercises.length === 0) return null
                
                return (
                  <div key={type}>
                    <div style={{ 
                      padding: '0.5rem 1rem', 
                      backgroundColor: BLOCK_COLORS[type] + '20',
                      fontSize: '0.625rem',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: BLOCK_COLORS[type],
                      position: 'sticky',
                      top: '80px'
                    }}>
                      {type} ({typeExercises.length})
                    </div>
                    {typeExercises.map(ex => (
                      <button
                        key={ex.id}
                        onClick={() => showExercisePicker && addExerciseToBlock(showExercisePicker, ex)}
                        disabled={!showExercisePicker}
                        style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          border: 'none',
                          borderBottom: '1px solid #f5f5f5',
                          backgroundColor: showExercisePicker ? '#fff' : '#fafafa',
                          cursor: showExercisePicker ? 'pointer' : 'default',
                          textAlign: 'left'
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ex.name}</p>
                          <p style={{ fontSize: '0.625rem', color: '#999' }}>
                            Dificultad: {ex.difficulty}/5 • Fatiga: {ex.fatigueImpact}/10
                          </p>
                        </div>
                        {showExercisePicker && (
                          <span style={{ color: '#000', fontSize: '1.25rem' }}>+</span>
                        )}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Picker Modal (for mobile/small screens) */}
      {showExercisePicker && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'none', // Hidden on desktop, would show on mobile
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          {/* Modal content for mobile */}
        </div>
      )}
    </div>
  )
}

// ============================================
// QR PANEL
// ============================================
function QRPanel({ gym, members }: { gym: any; members: Member[] }) {
  const gymData = { gymId: gym?.id || 'demo-gym', name: gym?.name || 'GymFlow Demo', type: 'gymflow-access' }

  return (
    <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>Código QR del Gimnasio</h3>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Los miembros escanean este código para acceder a su entrenamiento
      </p>
      
      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: '#fff', 
        border: '2px solid #000', 
        display: 'inline-block',
        marginBottom: '1rem'
      }}>
        <QRCodeSVG 
          value={JSON.stringify(gymData)} 
          size={180}
          level="H"
        />
      </div>
      
      <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '2rem' }}>
        Escanea con la cámara de tu teléfono
      </p>
      
      <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '2rem', marginTop: '1rem' }}>
        <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Códigos QR de Miembros</h4>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {members.map((m) => (
            <div key={m.id} style={{ padding: '1rem', border: '1px solid #e5e5e5', textAlign: 'center', backgroundColor: '#fafafa' }}>
              <QRCodeSVG value={m.qrCode} size={100} />
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>{m.name}</p>
              <p style={{ fontSize: '0.7rem', color: '#999' }}>{m.qrCode}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// MEMBER WORKOUT VIEW
// ============================================
function MemberWorkoutView({ member, onBack }: { member: Member; onBack: () => void }) {
  const [todayIndex, setTodayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)

  const mockWorkout = {
    phase: member.level === 'beginner' ? 'adaptation' : 'progression',
    days: [
      { dayIndex: 0, name: 'Full Body A', restDay: false, exercises: [
        { order: 1, exerciseName: 'Bench Press', sets: 3, reps: '8-12', weight: 0, restSeconds: 90 },
        { order: 2, exerciseName: 'Squats', sets: 3, reps: '8-12', weight: 0, restSeconds: 90 },
        { order: 3, exerciseName: 'Pull-ups', sets: 3, reps: '8-12', weight: 0, restSeconds: 90 },
      ]},
      { dayIndex: 1, name: null, restDay: true, exercises: [] },
      { dayIndex: 2, name: 'Full Body B', restDay: false, exercises: [
        { order: 1, exerciseName: 'Deadlift', sets: 3, reps: '6-8', weight: 0, restSeconds: 120 },
        { order: 2, exerciseName: 'Overhead Press', sets: 3, reps: '8-12', weight: 0, restSeconds: 90 },
        { order: 3, exerciseName: 'Lunges', sets: 3, reps: '10-15', weight: 0, restSeconds: 60 },
      ]},
      { dayIndex: 3, name: null, restDay: true, exercises: [] },
      { dayIndex: 4, name: 'Full Body C', restDay: false, exercises: [
        { order: 1, exerciseName: 'Squats', sets: 3, reps: '8-12', weight: 0, restSeconds: 90 },
        { order: 2, exerciseName: 'Push-ups', sets: 3, reps: '10-15', weight: 0, restSeconds: 60 },
        { order: 3, exerciseName: 'Plank', sets: 3, reps: '30s', weight: 0, restSeconds: 45 },
      ]},
      { dayIndex: 5, name: null, restDay: true, exercises: [] },
      { dayIndex: 6, name: null, restDay: true, exercises: [] },
    ]
  }

  const todayWorkout = mockWorkout.days.find(d => d.dayIndex === todayIndex)

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', marginBottom: '0.5rem' }}>
        ← Volver
      </button>
      <h1 style={{ marginBottom: '0.25rem' }}>Hola, {member.name}</h1>
      <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Nivel: {member.level} | Fase: {mockWorkout.phase}
      </p>

      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
        {mockWorkout.days.map((day) => (
          <button
            key={day.dayIndex}
            onClick={() => setTodayIndex(day.dayIndex)}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: todayIndex === day.dayIndex ? '2px solid #000' : '1px solid #e5e5e5',
              background: day.restDay ? '#f5f5f5' : (todayIndex === day.dayIndex ? '#fff' : '#f5f5f5'),
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            {DAY_SHORT[day.dayIndex]}
          </button>
        ))}
      </div>

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
            <div key={i} style={{ padding: '1rem', backgroundColor: '#fff', border: '1px solid #e5e5e5', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 500 }}>{ex.exerciseName}</p>
                <p style={{ color: '#666', fontSize: '0.875rem' }}>{ex.sets} sets × {ex.reps}</p>
              </div>
              <input type="number" placeholder="kg" style={{ width: '60px', padding: '0.5rem', border: '1px solid #e5e5e5', textAlign: 'center' }} defaultValue={ex.weight || ''} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
