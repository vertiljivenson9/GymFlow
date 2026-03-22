'use client'

import { useState, useEffect, useRef } from 'react'

interface PayPalCheckoutProps {
  amount: string
  currency?: string
  planName: string
  onSuccess: () => void
  onError: (error: string) => void
}

declare global {
  interface Window {
    paypal?: any
  }
}

export function PayPalCheckout({
  amount,
  currency = 'USD',
  planName,
  onSuccess,
  onError
}: PayPalCheckoutProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paypalReady, setPaypalReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonsRendered = useRef(false)

  // Load PayPal SDK
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    
    if (!clientId) {
      console.error('PayPal Client ID not configured')
      setError('PayPal no está configurado. Contacta al administrador.')
      setIsLoading(false)
      return
    }

    // Check if SDK already loaded
    if (window.paypal) {
      console.log('PayPal SDK already loaded')
      setPaypalReady(true)
      setIsLoading(false)
      return
    }

    console.log('Loading PayPal SDK with client ID:', clientId.substring(0, 10) + '...')
    
    // Check for existing script
    const existingScript = document.querySelector(`script[src*="paypal.com/sdk"]`)
    if (existingScript) {
      existingScript.remove()
    }

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`
    script.async = true
    script.setAttribute('data-partner-attribution-id', 'GymFlow')
    
    script.onload = () => {
      console.log('PayPal SDK loaded successfully')
      setPaypalReady(true)
      setIsLoading(false)
    }
    
    script.onerror = (e) => {
      console.error('Failed to load PayPal SDK:', e)
      setError('Error al cargar PayPal. Verifica tu conexión.')
      setIsLoading(false)
    }
    
    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      if (script && script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [currency])

  // Render PayPal buttons
  useEffect(() => {
    if (!paypalReady || !window.paypal || !containerRef.current || buttonsRendered.current) return

    console.log('Rendering PayPal buttons...')

    try {
      // Clear container first
      containerRef.current.innerHTML = ''

      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'black',
          shape: 'rect',
          label: 'paypal',
          height: 50,
        },
        createOrder: async (data: any, actions: any) => {
          console.log('Creating PayPal order...')
          try {
            const response = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount, currency }),
            })
            const data = await response.json()
            
            if (!data.orderId) {
              throw new Error('No order ID returned')
            }
            
            console.log('Order created:', data.orderId)
            return data.orderId
          } catch (error) {
            console.error('Error creating order:', error)
            onError('Error al crear la orden')
            throw error
          }
        },
        onApprove: async (data: any, actions: any) => {
          console.log('Payment approved, capturing...', data.orderID)
          try {
            const response = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID }),
            })
            const result = await response.json()

            if (result.success) {
              console.log('Payment captured successfully')
              onSuccess()
            } else {
              console.error('Payment capture failed:', result)
              onError('Error al verificar el pago')
            }
          } catch (error) {
            console.error('Error capturing payment:', error)
            onError('Error al procesar el pago')
          }
        },
        onError: (err: any) => {
          console.error('PayPal button error:', err)
          onError('Error en PayPal. Intenta de nuevo.')
        },
        onCancel: () => {
          console.log('Payment cancelled by user')
        }
      }).render(containerRef.current)
      
      buttonsRendered.current = true
      console.log('PayPal buttons rendered successfully')
      
    } catch (error) {
      console.error('Error rendering PayPal buttons:', error)
      setError('Error al mostrar botones de PayPal')
    }
  }, [paypalReady, amount, currency, onSuccess, onError])

  // Show error state
  if (error) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #003087',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>Cargando PayPal...</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>Pago seguro con PayPal</p>
      </div>
      <div ref={containerRef} id="paypal-button-container" />
    </div>
  )
}

// Subscription Pricing Component
export function SubscriptionPricing({ onSelectPlan }: { onSelectPlan: (plan: any) => void }) {
  const [showPayment, setShowPayment] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '49',
      period: 'month',
      features: [
        'Miembros ilimitados',
        'Motor de entrenamiento adaptativo',
        'Acceso QR para clientes',
        'Soporte por email',
      ],
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '470',
      period: 'year',
      savings: 'Save $118',
      features: [
        'Todo de Monthly',
        '2 meses gratis',
        'Soporte prioritario',
        'Personalización avanzada',
      ],
    },
  ]

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan)
    setShowPayment(true)
    setPaymentStatus('idle')
  }

  const handleSuccess = () => {
    setPaymentStatus('success')
    setTimeout(() => {
      onSelectPlan(selectedPlan)
    }, 2000)
  }

  const handleError = (error: string) => {
    setPaymentStatus('error')
    console.error('Payment error:', error)
  }

  if (paymentStatus === 'success') {
    return (
      <div style={{
        maxWidth: '500px',
        margin: '2rem auto',
        padding: '3rem',
        textAlign: 'center',
        backgroundColor: '#fff',
        border: '2px solid #22c55e',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
        <h2 style={{ marginBottom: '0.5rem' }}>¡Pago Exitoso!</h2>
        <p style={{ color: '#666' }}>Tu suscripción está activa.</p>
      </div>
    )
  }

  if (showPayment && selectedPlan) {
    return (
      <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <button
          onClick={() => setShowPayment(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', marginBottom: '1rem' }}
        >
          ← Volver a planes
        </button>

        <h2 style={{ marginBottom: '0.5rem' }}>Completar Pago</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          {selectedPlan.name} - ${selectedPlan.price}/{selectedPlan.period}
        </p>

        <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', marginBottom: '1.5rem', border: '1px solid #e5e5e5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>{selectedPlan.name} Plan</span>
            <span>${selectedPlan.price}</span>
          </div>
          {selectedPlan.savings && (
            <div style={{ color: '#22c55e', fontSize: '0.875rem' }}>{selectedPlan.savings}</div>
          )}
        </div>

        {paymentStatus === 'error' && (
          <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#dc2626', marginBottom: '1rem' }}>
            Hubo un error con el pago. Por favor intenta de nuevo.
          </div>
        )}

        <PayPalCheckout
          amount={selectedPlan.price}
          planName={selectedPlan.name}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '2rem 1rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Elige tu Plan</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        Comienza tu prueba gratis de 14 días
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              padding: '2rem',
              backgroundColor: '#fff',
              border: plan.savings ? '2px solid #000' : '1px solid #e5e5e5',
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
              }}>
                {plan.savings}
              </div>
            )}

            <h3 style={{ marginBottom: '0.5rem' }}>{plan.name}</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>${plan.price}</span>
              <span style={{ color: '#666' }}>/{plan.period}</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
              {plan.features.map((feature, i) => (
                <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f5f5f5' }}>
                  ✓ {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan)}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Suscribirse
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
