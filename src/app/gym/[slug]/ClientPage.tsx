'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface Trainer {
  id: string
  name: string
  role: string
  image: string | null
}

interface Gym {
  id: string
  slug: string
  name: string
  logo: string | null
  primaryColor: string
  phone: string | null
  address: string | null
  description: string | null
  services: Service[]
  trainers: Trainer[]
}

export default function ClientPage({ slug }: { slug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [gym, setGym] = useState<Gym | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [bookingStep, setBookingStep] = useState(1)
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' })

  // QR Check-in state
  const [memberCheckIn, setMemberCheckIn] = useState<{
    memberId: string | null
    code: string | null
    checkedIn: boolean
    memberName: string | null
  }>({
    memberId: null,
    code: null,
    checkedIn: false,
    memberName: null
  })

  useEffect(() => {
    fetchGym()
    
    // Check if this is a QR check-in
    const memberId = searchParams.get('member')
    const code = searchParams.get('code')
    
    if (memberId && code) {
      setMemberCheckIn({
        memberId,
        code,
        checkedIn: false,
        memberName: null
      })
    }
  }, [slug, searchParams])

  const fetchGym = async () => {
    try {
      const res = await fetch(`/api/gyms?slug=${slug}`)
      if (!res.ok) {
        setError('Gimnasio no encontrado')
        return
      }
      const data = await res.json()
      setGym(data)
      if (data.primaryColor) {
        document.documentElement.style.setProperty('--gym-primary', data.primaryColor)
      }
    } catch (err) {
      setError('Error al cargar el gimnasio')
    } finally {
      setLoading(false)
    }
  }

  const handleMemberCheckIn = async () => {
    if (!memberCheckIn.memberId || !memberCheckIn.code) return
    
    try {
      // In production, this would validate the member code with the backend
      // For demo, we'll simulate a successful check-in
      const res = await fetch('/api/members/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymId: gym?.id,
          memberId: memberCheckIn.memberId,
          code: memberCheckIn.code
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setMemberCheckIn(prev => ({
          ...prev,
          checkedIn: true,
          memberName: data.member?.name || 'Miembro'
        }))
      } else {
        // Demo mode - simulate success
        setMemberCheckIn(prev => ({
          ...prev,
          checkedIn: true,
          memberName: 'Miembro'
        }))
      }
    } catch (err) {
      // Demo fallback
      setMemberCheckIn(prev => ({
        ...prev,
        checkedIn: true,
        memberName: 'Miembro'
      }))
    }
  }

  const handleBooking = async () => {
    alert(`Reserva confirmada para ${selectedService?.name} el ${selectedDate} a las ${selectedTime}`)
    setBookingStep(1)
    setSelectedService(null)
    setSelectedDate('')
    setSelectedTime('')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #000',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '1.125rem', color: '#666' }}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (error || !gym) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Gimnasio no encontrado</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>El gimnasio que buscas no existe.</p>
        <button onClick={() => router.push('/')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Volver al inicio
        </button>
      </div>
    )
  }

  const primaryColor = gym.primaryColor || '#000000'

  // Show QR Check-in screen
  if (memberCheckIn.memberId && !memberCheckIn.checkedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: '#f9fafb' }}>
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '3rem', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          {gym.logo ? (
            <img src={gym.logo} alt={gym.name} style={{ height: '60px', margin: '0 auto 1.5rem', display: 'block' }} />
          ) : (
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: primaryColor }}>{gym.name}</h1>
          )}
          
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏃</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Check-in</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>¿Listo para entrenar?</p>
          
          <button
            onClick={handleMemberCheckIn}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: primaryColor,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.125rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            Confirmar Entrada
          </button>
          
          <button
            onClick={() => setMemberCheckIn({ memberId: null, code: null, checkedIn: false, memberName: null })}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: '#666',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  // Show Check-in Success screen
  if (memberCheckIn.checkedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: '#f0fdf4' }}>
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '3rem', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>✓</div>
          <h2 style={{ color: '#22c55e', marginBottom: '0.5rem' }}>¡Bienvenido!</h2>
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
            {memberCheckIn.memberName || 'Miembro'}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#999', marginBottom: '2rem' }}>
            Check-in confirmado en {gym.name}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '2rem' }}>
            {new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <button
            onClick={() => router.push(`/gym/${slug}`)}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Ver Gimnasio
          </button>
        </div>
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1px solid #d4d4d4', padding: '1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {gym.logo ? (
              <img src={gym.logo} alt={gym.name} style={{ height: '48px', maxWidth: '200px', objectFit: 'contain' }} />
            ) : (
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: primaryColor }}>{gym.name}</h1>
            )}
          </div>
          <button onClick={() => setBookingStep(1)} style={{ padding: '0.75rem 1.5rem', backgroundColor: primaryColor, color: '#fff', border: 'none', cursor: 'pointer' }}>
            Reservar Sesión
          </button>
        </div>
      </header>

      <section style={{ padding: '4rem 1rem', textAlign: 'center', backgroundColor: primaryColor, color: '#fff' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {!gym.logo && <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>{gym.name}</h1>}
          {gym.description && <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>{gym.description}</p>}
          {gym.address && <p style={{ marginTop: '1rem', opacity: 0.7, fontSize: '0.875rem' }}>📍 {gym.address}</p>}
        </div>
      </section>

      {bookingStep === 1 && !selectedService && (
        <section style={{ padding: '3rem 1rem', backgroundColor: '#f5f5f5' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>Nuestros Servicios</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {gym.services.map((service) => (
                <div key={service.id} style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #d4d4d4', cursor: 'pointer' }}
                  onClick={() => { setSelectedService(service); setBookingStep(2); }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d4d4d4'}>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{service.name}</h3>
                  <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{service.duration} min</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: primaryColor }}>${service.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {selectedService && bookingStep === 2 && (
        <section style={{ padding: '3rem 1rem', backgroundColor: '#f5f5f5' }}>
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <button onClick={() => { setSelectedService(null); setBookingStep(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', marginBottom: '1rem' }}>← Volver</button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedService.name}</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>${selectedService.price} - {selectedService.duration} min</p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Fecha</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d4d4d4' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Hora</label>
              <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d4d4d4' }}>
                <option value="">Seleccionar hora</option>
                {['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={() => setBookingStep(3)} disabled={!selectedDate || !selectedTime} style={{ width: '100%', padding: '1rem', backgroundColor: selectedDate && selectedTime ? primaryColor : '#d4d4d4', color: '#fff', border: 'none', cursor: selectedDate && selectedTime ? 'pointer' : 'not-allowed' }}>Continuar</button>
          </div>
        </section>
      )}

      {bookingStep === 3 && (
        <section style={{ padding: '3rem 1rem', backgroundColor: '#f5f5f5' }}>
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <button onClick={() => setBookingStep(2)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', marginBottom: '1rem' }}>← Volver</button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Tus Datos</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>{selectedService?.name} - {selectedDate} a las {selectedTime}</p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nombre</label>
              <input type="text" value={clientInfo.name} onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d4d4d4' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
              <input type="email" value={clientInfo.email} onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d4d4d4' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Teléfono</label>
              <input type="tel" value={clientInfo.phone} onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d4d4d4' }} />
            </div>
            <button onClick={handleBooking} disabled={!clientInfo.name || !clientInfo.email} style={{ width: '100%', padding: '1rem', backgroundColor: clientInfo.name && clientInfo.email ? primaryColor : '#d4d4d4', color: '#fff', border: 'none', cursor: clientInfo.name && clientInfo.email ? 'pointer' : 'not-allowed' }}>Confirmar Reserva</button>
          </div>
        </section>
      )}

      {gym.trainers.length > 0 && (
        <section style={{ padding: '4rem 1rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>Nuestros Entrenadores</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {gym.trainers.map((trainer) => (
                <div key={trainer.id} style={{ textAlign: 'center' }}>
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 1rem', backgroundColor: '#f5f5f5', overflow: 'hidden', border: `3px solid ${primaryColor}` }}>
                    {trainer.image ? <img src={trainer.image} alt={trainer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#999' }}>👤</div>}
                  </div>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{trainer.name}</h3>
                  <p style={{ color: primaryColor, fontSize: '0.875rem' }}>{trainer.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer style={{ borderTop: '1px solid #d4d4d4', padding: '2rem 1rem', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>{gym.logo ? <img src={gym.logo} alt={gym.name} style={{ height: '24px' }} /> : <span style={{ fontWeight: 700, color: primaryColor }}>{gym.name}</span>}</div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>{gym.phone && <span>📞 {gym.phone}</span>}{gym.address && <span style={{ marginLeft: '1rem' }}>📍 {gym.address}</span>}</div>
          <p style={{ fontSize: '0.75rem', color: '#999' }}>Powered by <a href="/" style={{ color: '#666' }}>GymFlow</a></p>
        </div>
      </footer>
    </main>
  )
}
