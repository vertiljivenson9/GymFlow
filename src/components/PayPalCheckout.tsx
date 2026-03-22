'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface PayPalCheckoutProps {
  amount: string
  currency?: string
  planName: string
  gymId?: string
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
  gymId,
  onSuccess,
  onError
}: PayPalCheckoutProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'demo'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [paypalConfigured, setPaypalConfigured] = useState<boolean | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonsRendered = useRef(false)
  const isMounted = useRef(true)

  // Check PayPal configuration on mount
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await fetch('/api/paypal/status')
        const data = await res.json()
        setPaypalConfigured(data.configured)
        
        if (!data.configured) {
          console.log('[PayPal] Not configured, using demo mode')
          setStatus('demo')
        } else if (data.demoMode) {
          console.log('[PayPal] Demo mode enabled')
          setStatus('demo')
        } else {
          setStatus('loading')
          loadPayPalSDK()
        }
      } catch (error) {
        console.error('[PayPal] Status check failed, using demo mode:', error)
        setStatus('demo')
      }
    }
    
    checkConfig()
    
    return () => {
      isMounted.current = false
    }
  }, [])

  // Load PayPal SDK
  const loadPayPalSDK = () => {
    if (typeof window === 'undefined') return

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    
    if (!clientId || clientId.length < 20) {
      console.log('[PayPal] Invalid client ID, using demo mode')
      setStatus('demo')
      return
    }

    // Check if already loaded
    if (window.paypal) {
      console.log('[PayPal] SDK already loaded')
      setStatus('ready')
      return
    }

    // Check for existing script
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]')
    if (existingScript) {
      console.log('[PayPal] Waiting for existing script...')
      existingScript.addEventListener('load', () => {
        if (isMounted.current) setStatus('ready')
      })
      return
    }

    // Load PayPal SDK
    console.log('[PayPal] Loading SDK...')
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`
    script.async = true
    
    script.onload = () => {
      console.log('[PayPal] SDK loaded successfully')
      if (isMounted.current) setStatus('ready')
    }
    
    script.onerror = () => {
      console.error('[PayPal] SDK failed to load')
      if (isMounted.current) {
        setStatus('demo') // Fallback to demo mode
      }
    }
    
    document.body.appendChild(script)
  }

  // Render PayPal buttons when ready
  useEffect(() => {
    if (status !== 'ready' || !containerRef.current || !window.paypal || buttonsRendered.current) return

    try {
      containerRef.current.innerHTML = ''

      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'black',
          shape: 'rect',
          label: 'paypal',
          height: 50,
        },
        
        createOrder: async () => {
          console.log('[PayPal] Creating order...')
          
          try {
            const response = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount, currency, gymId, planName }),
            })
            
            const data = await response.json()
            
            if (!data.orderId) {
              throw new Error(data.error || 'No order ID')
            }
            
            console.log('[PayPal] Order created:', data.orderId)
            return data.orderId
            
          } catch (error: any) {
            console.error('[PayPal] Order creation failed:', error)
            onError(error.message || 'Error al crear la orden')
            throw error
          }
        },
        
        onApprove: async (data: any) => {
          console.log('[PayPal] Payment approved:', data.orderID)
          
          try {
            const response = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID, gymId, planName }),
            })
            
            const result = await response.json()
            
            if (result.success) {
              console.log('[PayPal] Payment captured successfully')
              onSuccess()
            } else {
              onError(result.error || 'Error al verificar el pago')
            }
            
          } catch (error: any) {
            console.error('[PayPal] Capture failed:', error)
            onError(error.message || 'Error al procesar el pago')
          }
        },
        
        onError: (err: any) => {
          console.error('[PayPal] Button error:', err)
          onError('Error en PayPal. Intenta de nuevo.')
        },
        
        onCancel: () => {
          console.log('[PayPal] Payment cancelled')
        }
        
      }).render(containerRef.current)
      
      buttonsRendered.current = true
      
    } catch (error: any) {
      console.error('[PayPal] Render error:', error)
      setStatus('demo')
    }
  }, [status, amount, currency, gymId, planName, onSuccess, onError])

  // Demo mode - show simple payment button
  const handleDemoPayment = async () => {
    console.log('[PayPal] Processing demo payment...')
    
    try {
      // Create demo order
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, gymId, planName }),
      })
      
      const data = await response.json()
      
      if (!data.orderId) {
        throw new Error(data.error || 'Error creating order')
      }
      
      // Capture demo order
      const captureResponse = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderId, gymId, planName }),
      })
      
      const result = await captureResponse.json()
      
      if (result.success) {
        console.log('[PayPal] Demo payment successful')
        onSuccess()
      } else {
        onError(result.error || 'Error al procesar el pago demo')
      }
      
    } catch (error: any) {
      console.error('[PayPal] Demo payment error:', error)
      onError(error.message || 'Error al procesar el pago')
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #003087',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>Cargando PayPal...</p>
      </div>
    )
  }

  // Demo mode
  if (status === 'demo') {
    return (
      <div>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fef3c7', 
          border: '1px solid #fcd34d', 
          borderRadius: '8px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          <p style={{ color: '#92400e', fontWeight: 600, marginBottom: '0.25rem' }}>
            🧪 Modo Demo
          </p>
          <p style={{ color: '#92400e', fontSize: '0.875rem' }}>
            Los pagos son simulados. Configura tus credenciales de PayPal para pagos reales.
          </p>
        </div>
        
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>${amount} {currency}</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>{planName}</p>
        </div>
        
        <button
          onClick={handleDemoPayment}
          style={{
            width: '100%',
            padding: '1rem',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <span>💳</span> Pagar Ahora (Demo)
        </button>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>
          {errorMessage || 'Error al cargar PayPal'}
        </p>
        <button 
          onClick={() => setStatus('demo')}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Usar Modo Demo
        </button>
      </div>
    )
  }

  // Ready - show PayPal buttons
  return (
    <div>
      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>Pago seguro con PayPal</p>
        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
          Total: ${amount} {currency}
        </p>
      </div>
      <div ref={containerRef} id="paypal-button-container" />
    </div>
  )
}
