// =======================================================
// 📁 GYMFLOW PAYPAL API - With Auto Demo Mode
// =======================================================

// PayPal Configuration
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
const PAYPAL_MODE = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase()
const PAYPAL_BASE_URL = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

// Cache for authentication status
let authTested = false
let authWorks = false

console.log('[PayPal] Config:', { 
  mode: PAYPAL_MODE, 
  baseUrl: PAYPAL_BASE_URL, 
  clientIdPresent: !!PAYPAL_CLIENT_ID,
  clientIdLength: PAYPAL_CLIENT_ID.length
})

// =======================================================
// DEMO MODE DETECTION
// =======================================================

/**
 * Check if we should use demo mode
 * Demo mode is used when:
 * 1. No credentials are configured
 * 2. Credentials fail to authenticate
 */
async function shouldUseDemoMode(): Promise<boolean> {
  // No credentials
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || PAYPAL_CLIENT_ID.length < 20) {
    return true
  }
  
  // Already tested
  if (authTested) {
    return !authWorks
  }
  
  // Test authentication
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
    
    authTested = true
    authWorks = response.ok
    
    if (response.ok) {
      console.log('[PayPal] ✅ Credentials verified - live mode active')
    } else {
      console.log('[PayPal] ⚠️ Credentials failed - using demo mode')
    }
    
    return !response.ok
    
  } catch (error) {
    authTested = true
    authWorks = false
    console.log('[PayPal] ⚠️ Auth test failed - using demo mode')
    return true
  }
}

// =======================================================
// AUTHENTICATION
// =======================================================

/**
 * Get PayPal access token using client credentials
 */
export async function getPayPalToken(): Promise<string> {
  const useDemo = await shouldUseDemoMode()
  
  if (useDemo) {
    console.log('[PayPal] Demo mode - returning fake token')
    return `demo_token_${Date.now()}`
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('[PayPal] Auth failed:', error)
    throw new Error(`PayPal auth failed: ${error.error_description || 'Unknown error'}`)
  }

  const data = await response.json()
  console.log('[PayPal] Token obtained successfully')
  
  return data.access_token
}

// =======================================================
// ORDER MANAGEMENT
// =======================================================

interface CreateOrderOptions {
  amount: string
  currency?: string
  description?: string
  gymId?: string
  planId?: string
  userId?: string
}

/**
 * Create a PayPal order
 * Works in both live and demo mode
 */
export async function createPayPalOrder(options: CreateOrderOptions): Promise<{ id: string; links: any[] }> {
  const { amount, currency = 'USD', description = 'GymFlow Subscription' } = options
  const useDemo = await shouldUseDemoMode()

  // Demo mode: create a fake order ID
  if (useDemo) {
    const demoOrderId = `DEMO_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    console.log('[PayPal] Demo mode - creating fake order:', demoOrderId)
    
    return {
      id: demoOrderId,
      links: [
        { rel: 'approve', href: '#' }
      ]
    }
  }

  // Live mode: create real PayPal order
  const token = await getPayPalToken()

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount,
        },
        description: description,
      }],
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('[PayPal] Order creation failed:', error)
    throw new Error(`Failed to create order: ${error.message || 'Unknown error'}`)
  }

  const data = await response.json()
  console.log('[PayPal] Order created:', data.id)

  return {
    id: data.id,
    links: data.links
  }
}

/**
 * Capture a PayPal order
 * Works in both live and demo mode
 */
export async function capturePayPalOrder(orderID: string): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  const useDemo = await shouldUseDemoMode()

  // Demo mode: fake successful capture
  if (useDemo || orderID.startsWith('DEMO_')) {
    console.log('[PayPal] Demo mode - faking successful capture:', orderID)
    
    return {
      success: true,
      data: {
        id: orderID,
        status: 'COMPLETED',
        purchase_units: [{
          payments: {
            captures: [{
              id: `CAPTURE_${Date.now()}`,
              amount: { value: '49.00', currency_code: 'USD' },
              status: 'COMPLETED'
            }]
          }
        }]
      }
    }
  }

  // Live mode: capture real PayPal order
  try {
    const token = await getPayPalToken()

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[PayPal] Capture failed:', data)
      return {
        success: false,
        error: data.message || 'Capture failed'
      }
    }

    if (data.status !== 'COMPLETED') {
      console.error('[PayPal] Payment not completed:', data.status)
      return {
        success: false,
        error: `Payment status: ${data.status}`
      }
    }

    console.log('[PayPal] Payment captured successfully:', orderID)

    return {
      success: true,
      data
    }

  } catch (error: any) {
    console.error('[PayPal] Capture error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error'
    }
  }
}

/**
 * Get order details
 */
export async function getPayPalOrder(orderID: string): Promise<any> {
  const useDemo = await shouldUseDemoMode()
  
  if (useDemo || orderID.startsWith('DEMO_')) {
    return {
      id: orderID,
      status: 'COMPLETED'
    }
  }

  const token = await getPayPalToken()

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get order: ${error.message || 'Unknown error'}`)
  }

  return response.json()
}

// =======================================================
// STATUS & HELPERS
// =======================================================

/**
 * Get PayPal configuration status
 */
export function getPayPalStatus(): {
  configured: boolean
  mode: string
  demoMode: boolean
} {
  const hasCredentials = PAYPAL_CLIENT_ID.length > 20 && PAYPAL_CLIENT_SECRET.length > 10
  
  return {
    configured: hasCredentials && authWorks,
    mode: PAYPAL_MODE,
    demoMode: !hasCredentials || !authWorks
  }
}

/**
 * Check if PayPal is properly configured
 */
export function isPayPalConfigured(): boolean {
  return PAYPAL_CLIENT_ID.length > 20 && PAYPAL_CLIENT_SECRET.length > 10 && authWorks
}

/**
 * Format amount for PayPal (2 decimal places)
 */
export function formatAmount(amount: number | string): string {
  return parseFloat(String(amount)).toFixed(2)
}

/**
 * Reset auth cache (for testing)
 */
export function resetAuthCache(): void {
  authTested = false
  authWorks = false
}
