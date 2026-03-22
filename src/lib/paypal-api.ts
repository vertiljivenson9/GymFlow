// =======================================================
// 📁 GYMFLOW PAYPAL API - Production Implementation
// =======================================================

// PayPal Configuration
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

// =======================================================
// AUTHENTICATION
// =======================================================

/**
 * Get PayPal access token using client credentials
 */
export async function getPayPalToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('[PayPal] Missing credentials')
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
 * Returns the order ID
 */
export async function createPayPalOrder(options: CreateOrderOptions): Promise<{ id: string; links: any[] }> {
  const { amount, currency = 'USD', description = 'GymFlow Subscription' } = options

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
 * This should ONLY be called from the backend (secure)
 */
export async function capturePayPalOrder(orderID: string): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
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

    // Check if payment is actually completed
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
// HELPERS
// =======================================================

/**
 * Verify webhook signature (for production webhooks)
 */
export async function verifyWebhookSignature(
  body: string,
  headers: Record<string, string>
): Promise<boolean> {
  // TODO: Implement webhook signature verification for production
  // https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
  return true
}

/**
 * Format amount for PayPal (2 decimal places)
 */
export function formatAmount(amount: number | string): string {
  return parseFloat(String(amount)).toFixed(2)
}
