'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { isPayPalLoaded, getPayPalScript, getGymContext } from '@/lib/utils'

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
  const [sdkState, setSdkState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Use refs to prevent duplicate renders
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonsRendered = useRef(false)
  const isMounted = useRef(true)

  // Load PayPal SDK (idempotent)
  useEffect(() => {
    // Server-side guard
    if (typeof window === 'undefined') return

    const loadPayPalSDK = () => {
      const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
      
      if (!clientId) {
        console.error('[PayPal] Client ID not configured')
        setSdkState('error')
        setErrorMessage('PayPal no está configurado. Contacta al administrador.')
        onError('PayPal not configured')
        return
      }

      // Already loaded?
      if (isPayPalLoaded()) {
        console.log('[PayPal] SDK already loaded')
        setSdkState('ready')
        return
      }

      // Script exists but not loaded?
      const existingScript = getPayPalScript()
      if (existingScript) {
        console.log('[PayPal] Waiting for existing script...')
        existingScript.onload = () => {
          if (isMounted.current) {
            setSdkState('ready')
          }
        }
        existingScript.onerror = () => {
          if (isMounted.current) {
            setSdkState('error')
            setErrorMessage('Error al cargar PayPal')
          }
        }
        return
      }

      // Create new script
      console.log('[PayPal] Loading SDK...')
      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`
      script.async = true
      script.setAttribute('data-partner-attribution-id', 'GymFlow')
      
      script.onload = () => {
        console.log('[PayPal] SDK loaded successfully')
        if (isMounted.current) {
          setSdkState('ready')
        }
      }
      
      script.onerror = () => {
        console.error('[PayPal] SDK failed to load')
        if (isMounted.current) {
          setSdkState('error')
          setErrorMessage('Error al cargar PayPal. Verifica tu conexión.')
          onError('Failed to load PayPal SDK')
        }
      }
      
      document.body.appendChild(script)
    }

    loadPayPalSDK()

    return () => {
      isMounted.current = false
    }
  }, [currency, onError])

  // Render PayPal buttons (with cleanup)
  const renderButtons = useCallback(() => {
    if (!containerRef.current || !window.paypal || buttonsRendered.current) return

    // Clear previous renders
    containerRef.current.innerHTML = ''
    buttonsRendered.current = false

    try {
      // Get gym context from localStorage
      const gymContext = getGymContext()
      const effectiveGymId = gymId || gymContext?.gymId

      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'black',
          shape: 'rect',
          label: 'paypal',
          height: 50,
        },
        
        // Create order via backend (more secure)
        createOrder: async () => {
          console.log('[PayPal] Creating order...')
          
          try {
            const response = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                amount, 
                currency,
                gymId: effectiveGymId,
                planName 
              }),
            })
            
            const data = await response.json()
            
            if (!data.orderId) {
              throw new Error(data.error || 'No order ID returned')
            }
            
            console.log('[PayPal] Order created:', data.orderId)
            return data.orderId
            
          } catch (error: any) {
            console.error('[PayPal] Order creation failed:', error)
            onError(error.message || 'Error al crear la orden')
            throw error
          }
        },
        
        // Capture via backend (SECURE - uses secret key)
        onApprove: async (data: any) => {
          console.log('[PayPal] Payment approved, capturing via backend...', data.orderID)
          
          try {
            const response = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                orderId: data.orderID,
                gymId: effectiveGymId,
                planName
              }),
            })
            
            const result = await response.json()
            
            if (result.success) {
              console.log('[PayPal] Payment captured successfully')
              onSuccess()
            } else {
              console.error('[PayPal] Capture failed:', result)
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
      console.log('[PayPal] Buttons rendered')
      
    } catch (error: any) {
      console.error('[PayPal] Render error:', error)
      setSdkState('error')
      setErrorMessage('Error al mostrar PayPal')
    }
  }, [amount, currency, gymId, planName, onSuccess, onError])

  // Render when SDK is ready
  useEffect(() => {
    if (sdkState === 'ready' && containerRef.current && !buttonsRendered.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(renderButtons, 100)
      return () => clearTimeout(timer)
    }
  }, [sdkState, renderButtons])

  // Error state
  if (sdkState === 'error' || errorMessage) {
    return (
      <div style={{ 
        padding: '1.5rem', 
        textAlign: 'center', 
        backgroundColor: '#fef2f2', 
        border: '1px solid #fecaca', 
        borderRadius: '8px' 
      }}>
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>
          {errorMessage || 'Error al cargar PayPal'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '0.5rem 1.5rem', 
            backgroundColor: '#dc2626', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  // Loading state
  if (sdkState === 'loading') {
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

  // Ready - show buttons
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
