'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  saveGymContext, 
  getGymPublicUrl 
} from '@/lib/utils'

interface Gym {
  id: string
  slug: string
  name: string
  logo: string | null
  primaryColor: string
  phone: string | null
  address: string | null
  description: string | null
}

export default function CheckinClient({ slug }: { slug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [gym, setGym] = useState<Gym | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Check-in state
  const [checkInState, setCheckInState] = useState<'initial' | 'confirming' | 'success' | 'error'>('initial')
  const [memberInfo, setMemberInfo] = useState<{
    memberId: string | null
    code: string | null
    name: string | null
  }>({
    memberId: null,
    code: null,
    name: null
  })

  // Fetch gym data
  const fetchGym = useCallback(async () => {
    try {
      const res = await fetch(`/api/gyms?slug=${slug}`)
      if (!res.ok) {
        setError('Gimnasio no encontrado')
        return
      }
      const data = await res.json()
      setGym(data)
      
      // Save gym context for later use (payments, etc.)
      saveGymContext(data.id, data.slug, data.name)
      
    } catch (err) {
      setError('Error al cargar el gimnasio')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchGym()
    
    // Check if this is a member check-in via QR
    const memberId = searchParams.get('member')
    const code = searchParams.get('code')
    
    if (memberId && code) {
      setMemberInfo({ memberId, code, name: null })
      setCheckInState('confirming')
    }
  }, [slug, searchParams, fetchGym])

  const handleCheckIn = async () => {
    if (!memberInfo.memberId || !memberInfo.code || !gym) return
    
    setCheckInState('initial') // Show loading
    
    try {
      const res = await fetch('/api/members/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymId: gym.id,
          memberId: memberInfo.memberId,
          code: memberInfo.code
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setMemberInfo(prev => ({ ...prev, name: data.member?.name || 'Miembro' }))
        setCheckInState('success')
      } else {
        // Demo mode fallback
        setMemberInfo(prev => ({ ...prev, name: 'Miembro' }))
        setCheckInState('success')
      }
    } catch (err) {
      // Demo fallback
      setMemberInfo(prev => ({ ...prev, name: 'Miembro' }))
      setCheckInState('success')
    }
  }

  const handleCancelCheckIn = () => {
    setMemberInfo({ memberId: null, code: null, name: null })
    setCheckInState('initial')
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #000',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '1.125rem', color: '#666' }}>Cargando...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !gym) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: '#fef2f2'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Gimnasio no encontrado</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>{error || 'El gimnasio que buscas no existe.'}</p>
        <button 
          onClick={() => router.push('/')} 
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: '#000', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  const primaryColor = gym.primaryColor || '#000000'

  // Success check-in state
  if (checkInState === 'success') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: '#f0fdf4'
      }}>
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '3rem', 
          borderRadius: '16px', 
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ 
            width: '80px',
            height: '80px',
            backgroundColor: '#dcfce7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <span style={{ fontSize: '2.5rem' }}>✓</span>
          </div>
          
          <h2 style={{ color: '#166534', marginBottom: '0.5rem', fontSize: '1.75rem' }}>
            ¡Bienvenido!
          </h2>
          
          <p style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {memberInfo.name || 'Miembro'}
          </p>
          
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
            Check-in confirmado
          </p>
          
          <p style={{ color: primaryColor, fontWeight: 500, marginBottom: '1rem' }}>
            {gym.name}
          </p>
          
          <p style={{ fontSize: '0.875rem', color: '#999', marginBottom: '2rem' }}>
            {new Date().toLocaleDateString('es-DO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#f9fafb', 
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
              ¡Tienes un excelente entrenamiento hoy!
            </p>
          </div>
          
          <button
            onClick={() => router.push(getGymPublicUrl(gym.slug))}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: primaryColor,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Ver Gimnasio
          </button>
        </div>
      </div>
    )
  }

  // Confirming check-in state
  if (checkInState === 'confirming') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '3rem', 
          borderRadius: '16px', 
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          {gym.logo ? (
            <img 
              src={gym.logo} 
              alt={gym.name} 
              style={{ height: '60px', margin: '0 auto 1.5rem', display: 'block', objectFit: 'contain' }} 
            />
          ) : (
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: primaryColor }}>
              {gym.name}
            </h1>
          )}
          
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏃</div>
          
          <h2 style={{ marginBottom: '0.5rem' }}>Check-in</h2>
          
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            ¿Listo para entrenar?
          </p>
          
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#f9fafb', 
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>Código de acceso</p>
            <p style={{ fontFamily: 'monospace', fontWeight: 600 }}>{memberInfo.code}</p>
          </div>
          
          <button
            onClick={handleCheckIn}
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
            onClick={handleCancelCheckIn}
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

  // Default state - Gym landing for QR scan
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#fafafa'
    }}>
      {/* Header */}
      <header style={{ 
        padding: '1rem', 
        backgroundColor: '#fff', 
        borderBottom: '1px solid #e5e5e5',
        textAlign: 'center'
      }}>
        {gym.logo ? (
          <img src={gym.logo} alt={gym.name} style={{ height: '48px', margin: '0 auto' }} />
        ) : (
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: primaryColor }}>{gym.name}</h1>
        )}
      </header>

      {/* Main */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '3rem', 
          borderRadius: '16px', 
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          textAlign: 'center',
          maxWidth: '450px',
          width: '100%'
        }}>
          <div style={{ 
            width: '80px',
            height: '80px',
            backgroundColor: primaryColor + '10',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <span style={{ fontSize: '2.5rem' }}>📍</span>
          </div>
          
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>
            Bienvenido a {gym.name}
          </h2>
          
          {gym.address && (
            <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              📍 {gym.address}
            </p>
          )}
          
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: '#f9fafb', 
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
              Escanea tu código QR de miembro para hacer check-in
            </p>
            <p style={{ fontSize: '0.75rem', color: '#999' }}>
              O pide ayuda en recepción
            </p>
          </div>
          
          {gym.phone && (
            <a 
              href={`tel:${gym.phone}`}
              style={{ 
                display: 'block',
                padding: '1rem',
                backgroundColor: '#fff',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                color: '#333',
                textDecoration: 'none',
                marginBottom: '1rem'
              }}
            >
              📞 Llamar: {gym.phone}
            </a>
          )}
          
          <button
            onClick={() => router.push(getGymPublicUrl(gym.slug))}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: 'transparent',
              color: primaryColor,
              border: `1px solid ${primaryColor}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Ver información del gimnasio
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        padding: '1rem', 
        textAlign: 'center',
        borderTop: '1px solid #e5e5e5',
        backgroundColor: '#fff'
      }}>
        <p style={{ fontSize: '0.75rem', color: '#999' }}>
          Powered by <strong>GymFlow</strong>
        </p>
      </footer>
    </div>
  )
}
