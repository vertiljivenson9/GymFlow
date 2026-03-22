// PayPal SDK utilities
export const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''
export const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
export const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'

export const PAYPAL_API_BASE = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

// Get PayPal access token
export async function getPayPalAccessToken(): Promise<string | null> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    console.log('PayPal: Missing credentials')
    return null
  }

  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('PayPal auth error:', data)
      return null
    }

    return data.access_token
  } catch (error) {
    console.error('PayPal auth failed:', error)
    return null
  }
}

// Create PayPal order
export async function createPayPalOrder(amount: string, currency: string = 'USD'): Promise<{ id: string } | null> {
  const accessToken = await getPayPalAccessToken()
  if (!accessToken) return null

  try {
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount,
            },
            description: 'GymFlow Monthly Subscription',
          },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('PayPal order creation error:', data)
      return null
    }

    return { id: data.id }
  } catch (error) {
    console.error('PayPal order creation failed:', error)
    return null
  }
}

// Capture PayPal payment
export async function capturePayPalOrder(orderId: string): Promise<{ success: boolean; data?: any }> {
  const accessToken = await getPayPalAccessToken()
  if (!accessToken) return { success: false }

  try {
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('PayPal capture error:', data)
      return { success: false }
    }

    return { success: true, data }
  } catch (error) {
    console.error('PayPal capture failed:', error)
    return { success: false }
  }
}

// Verify webhook (for production)
export async function verifyPayPalWebhook(
  body: string,
  headers: Headers
): Promise<boolean> {
  // In production, verify webhook signature
  // For now, return true for demo
  return true
}
