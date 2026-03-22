'use client'

import { useState, useEffect } from 'react'

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
  const [paypalLoaded, setPaypalLoaded] = useState(false)

  useEffect(() => {
    // Check if PayPal SDK is already loaded
    if (window.paypal) {
      setPaypalLoaded(true)
      setIsLoading(false)
      return
    }

    // Load PayPal SDK
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    if (!clientId) {
      onError('PayPal not configured')
      setIsLoading(false)
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`
    script.async = true
    script.onload = () => {
      setPaypalLoaded(true)
      setIsLoading(false)
    }
    script.onerror = () => {
      onError('Failed to load PayPal')
      setIsLoading(false)
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [currency, onError])

  useEffect(() => {
    if (!paypalLoaded || !window.paypal) return

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'black',
        shape: 'rect',
        label: 'paypal',
        height: 50,
      },
      createOrder: async () => {
        try {
          const response = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency }),
          })
          const data = await response.json()
          return data.orderId
        } catch (error) {
          onError('Failed to create order')
          throw error
        }
      },
      onApprove: async (data: any) => {
        try {
          const response = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
          })
          const result = await response.json()

          if (result.success) {
            onSuccess()
          } else {
            onError('Payment verification failed')
          }
        } catch (error) {
          onError('Failed to capture payment')
        }
      },
      onError: (err: any) => {
        onError('PayPal error occurred')
      },
    }).render('#paypal-button-container')

  }, [paypalLoaded, amount, currency, onSuccess, onError])

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #000',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>Pay securely with PayPal</p>
      </div>
      <div id="paypal-button-container" />
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
