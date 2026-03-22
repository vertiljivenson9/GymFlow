'use client'

import { useState, useEffect } from 'react'

interface MembershipPaymentProps {
  gymId: string
  gymName: string
  memberId: string
  memberName: string
  amount: string
  currency?: string
  onPaymentSuccess: () => void
  onPaymentError: (error: string) => void
  onBack: () => void
}

export function MembershipPayment({
  gymId,
  gymName,
  memberId,
  memberName,
  amount,
  currency = 'USD',
  onPaymentSuccess,
  onPaymentError,
  onBack,
}: MembershipPaymentProps) {
  const [loading, setLoading] = useState(false)
  const [gymPaypalConnected, setGymPaypalConnected] = useState<boolean | null>(null)
  const [paypalLoaded, setPaypalLoaded] = useState(false)

  useEffect(() => {
    checkGymPayPalConnection()
  }, [gymId])

  const checkGymPayPalConnection = async () => {
    try {
      const res = await fetch('/api/paypal/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId }),
      })
      const data = await res.json()
      setGymPaypalConnected(data.connected === true)
    } catch (error) {
      setGymPaypalConnected(false)
    }
  }

  useEffect(() => {
    if (gymPaypalConnected !== true) return

    // Load PayPal SDK
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    if (!clientId) return

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`
    script.async = true
    script.onload = () => {
      setPaypalLoaded(true)
      renderPayPalButtons()
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [gymPaypalConnected, currency])

  const renderPayPalButtons = () => {
    if (!window.paypal) return

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal',
        height: 50,
      },
      createOrder: async () => {
        try {
          setLoading(true)
          const response = await fetch('/api/gym-payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gymId,
              memberId,
              memberName,
              amount,
              currency,
            }),
          })
          const data = await response.json()
          return data.orderId
        } catch (error) {
          onPaymentError('Error al crear la orden')
          throw error
        }
      },
      onApprove: async (data: any) => {
        try {
          const response = await fetch('/api/gym-payments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gymId,
              orderId: data.orderID,
              memberId,
            }),
          })
          const result = await response.json()

          if (result.success) {
            onPaymentSuccess()
          } else {
            onPaymentError('Error al verificar el pago')
          }
        } catch (error) {
          onPaymentError('Error al procesar el pago')
        } finally {
          setLoading(false)
        }
      },
      onError: (err: any) => {
        onPaymentError('Error en PayPal')
        setLoading(false)
      },
    }).render('#membership-paypal-button-container')
  }

  if (gymPaypalConnected === null) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #000',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: '1rem', color: '#666' }}>Verificando métodos de pago...</p>
      </div>
    )
  }

  if (gymPaypalConnected === false) {
    return (
      <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem', backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ marginBottom: '0.5rem' }}>Pagos no disponibles</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          {gymName} aún no ha configurado su cuenta de pagos. Por favor contacta al gimnasio directamente.
        </p>
        <button
          onClick={onBack}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem', backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', marginBottom: '1rem', fontSize: '0.875rem' }}>
        ← Volver
      </button>

      <h2 style={{ marginBottom: '0.5rem' }}>Pagar Membresía</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{gymName}</p>

      {/* Member Info */}
      <div style={{ padding: '1rem', backgroundColor: '#f9fafb', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #e5e5e5' }}>
        <p style={{ fontWeight: 600 }}>{memberName}</p>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>Membresía Mensual</p>
      </div>

      {/* Order Summary */}
      <div style={{ padding: '1rem', backgroundColor: '#fff', marginBottom: '1.5rem', border: '1px solid #e5e5e5', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Membresía 1 mes</span>
          <span>${amount}</span>
        </div>
        <div style={{ borderTop: '1px solid #e5e5e5', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
          <span>Total</span>
          <span>${amount} {currency}</span>
        </div>
      </div>

      {loading && (
        <div style={{ padding: '1rem', backgroundColor: '#eff6ff', color: '#1d4ed8', marginBottom: '1rem', borderRadius: '4px', textAlign: 'center' }}>
          Procesando...
        </div>
      )}

      <div id="membership-paypal-button-container" />

      {!paypalLoaded && (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #003087',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  )
}

// Global PayPal type
declare global {
  interface Window {
    paypal?: any
  }
}
