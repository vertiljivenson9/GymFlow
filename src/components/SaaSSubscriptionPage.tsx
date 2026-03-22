'use client'

import { useState, useEffect } from 'react'
import { PayPalCheckout } from './PayPalCheckout'

interface SubscriptionPlan {
  id: string
  name: string
  nameEs: string
  price: string
  period: string
  periodEs: string
  savings?: string
  features: string[]
}

const PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    nameEs: 'Mensual',
    price: '49',
    period: 'month',
    periodEs: 'mes',
    features: [
      'Miembros ilimitados',
      'Motor de entrenamiento adaptativo',
      'Acceso QR para clientes',
      'Sistema de reservas',
      'Soporte por email',
      'Tu marca, tu dominio',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    nameEs: 'Anual',
    price: '470',
    period: 'year',
    periodEs: 'año',
    savings: 'Ahorra $118',
    features: [
      'Todo del plan mensual',
      '2 meses gratis',
      'Soporte prioritario',
      'Personalización avanzada',
      'Reportes avanzados',
      'API access',
    ],
  },
]

interface SaaSSubscriptionPageProps {
  gymId: string
  gymName: string
  onSubscriptionComplete: () => void
  onBack: () => void
}

export function SaaSSubscriptionPage({ 
  gymId, 
  gymName, 
  onSubscriptionComplete,
  onBack 
}: SaaSSubscriptionPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [orderId, setOrderId] = useState<string | null>(null)

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setShowPayment(true)
    setPaymentStatus('idle')
  }

  const handlePaymentSuccess = async () => {
    if (!selectedPlan || !orderId) return

    setPaymentStatus('processing')

    try {
      // Create subscription record
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymId,
          plan: selectedPlan.id,
          paypalOrderId: orderId,
          amount: parseFloat(selectedPlan.price),
        }),
      })

      const data = await res.json()

      if (data.success) {
        setPaymentStatus('success')
        setTimeout(() => {
          onSubscriptionComplete()
        }, 2000)
      } else {
        setPaymentStatus('error')
      }
    } catch (error) {
      console.error('Subscription creation error:', error)
      setPaymentStatus('error')
    }
  }

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error')
    console.error('Payment error:', error)
  }

  if (paymentStatus === 'success') {
    return (
      <div style={{
        maxWidth: '500px',
        margin: '4rem auto',
        padding: '3rem',
        textAlign: 'center',
        backgroundColor: '#fff',
        border: '2px solid #22c55e',
        borderRadius: '8px',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
        <h2 style={{ marginBottom: '0.5rem', color: '#22c55e' }}>¡Suscripción Activada!</h2>
        <p style={{ color: '#666' }}>Tu gimnasio {gymName} está listo para usar.</p>
        <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '1rem' }}>Redirigiendo...</p>
      </div>
    )
  }

  if (showPayment && selectedPlan) {
    return (
      <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem', backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
        <button
          onClick={() => setShowPayment(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', marginBottom: '1rem', fontSize: '0.875rem' }}
        >
          ← Volver a planes
        </button>

        <h2 style={{ marginBottom: '0.5rem' }}>Completar Suscripción</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Plan {selectedPlan.nameEs} - ${selectedPlan.price}/{selectedPlan.periodEs}
        </p>

        {/* Gym Info */}
        <div style={{ padding: '1rem', backgroundColor: '#f9fafb', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #e5e5e5' }}>
          <p style={{ fontWeight: 600 }}>{gymName}</p>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>Suscripción GymFlow</p>
        </div>

        {/* Order Summary */}
        <div style={{ padding: '1rem', backgroundColor: '#fff', marginBottom: '1.5rem', border: '1px solid #e5e5e5', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span>Plan {selectedPlan.nameEs}</span>
            <span>${selectedPlan.price}</span>
          </div>
          {selectedPlan.savings && (
            <div style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: 500 }}>
              🎉 {selectedPlan.savings}
            </div>
          )}
          <div style={{ borderTop: '1px solid #e5e5e5', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
            <span>Total</span>
            <span>${selectedPlan.price} USD</span>
          </div>
        </div>

        {paymentStatus === 'error' && (
          <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#dc2626', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #fecaca' }}>
            Hubo un error con el pago. Por favor intenta de nuevo.
          </div>
        )}

        {paymentStatus === 'processing' && (
          <div style={{ padding: '1rem', backgroundColor: '#eff6ff', color: '#1d4ed8', marginBottom: '1rem', borderRadius: '4px', textAlign: 'center' }}>
            Procesando tu suscripción...
          </div>
        )}

        <PayPalCheckout
          amount={selectedPlan.price}
          planName={selectedPlan.name}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />

        {/* Order ID Capture */}
        <OrderCapture onOrderIdCreated={setOrderId} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', marginBottom: '1rem', fontSize: '0.875rem' }}>
        ← Volver
      </button>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Elige tu Plan</h1>
        <p style={{ color: '#666', fontSize: '1.125rem' }}>
          Activa tu gimnasio <strong>{gymName}</strong> con todas las características
        </p>
        <p style={{ color: '#22c55e', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          ✓ Prueba gratis de 14 días incluida
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            style={{
              padding: '2rem',
              backgroundColor: '#fff',
              border: plan.savings ? '2px solid #000' : '1px solid #e5e5e5',
              borderRadius: '8px',
              position: 'relative',
            }}
          >
            {plan.savings && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#000',
                color: '#fff',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                fontWeight: 600,
                borderRadius: '4px',
                whiteSpace: 'nowrap',
              }}>
                {plan.savings}
              </div>
            )}

            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{plan.nameEs}</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 700 }}>${plan.price}</span>
              <span style={{ color: '#666', fontSize: '1rem' }}>/{plan.periodEs}</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
              {plan.features.map((feature, i) => (
                <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#22c55e' }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan)}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: plan.savings ? '#000' : '#fff',
                color: plan.savings ? '#fff' : '#000',
                border: plan.savings ? 'none' : '1px solid #000',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '4px',
                transition: 'all 0.2s',
              }}
            >
              Suscribirse
            </button>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem', color: '#666', fontSize: '0.875rem' }}>
        <p>¿Preguntas? Contáctanos en soporte@gymflow.app</p>
        <p style={{ marginTop: '0.5rem' }}>Los pagos son procesados de forma segura por PayPal</p>
      </div>
    </div>
  )
}

// Helper component to capture order ID
function OrderCapture({ onOrderIdCreated }: { onOrderIdCreated: (id: string) => void }) {
  useEffect(() => {
    // Intercept fetch to capture order ID
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      
      if (args[0] === '/api/paypal/create-order') {
        const clone = response.clone()
        const data = await clone.json()
        if (data.orderId) {
          onOrderIdCreated(data.orderId)
        }
      }
      
      return response
    }
    
    return () => {
      window.fetch = originalFetch
    }
  }, [onOrderIdCreated])
  
  return null
}
