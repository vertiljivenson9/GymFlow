// PayPal SDK utilities - Extended for SaaS + Gym Owner Payments
export const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''
export const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
export const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'

export const PAYPAL_API_BASE = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

// ============================================
// AUTHENTICATION
// ============================================

// Get PayPal access token (for GymFlow platform)
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

// Get access token for a gym owner's connected PayPal account
export async function getGymPayPalAccessToken(gymPaypalRefreshToken: string): Promise<string | null> {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=refresh_token&refresh_token=${gymPaypalRefreshToken}`,
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gym PayPal auth error:', data)
      return null
    }

    return data.access_token
  } catch (error) {
    console.error('Gym PayPal auth failed:', error)
    return null
  }
}

// ============================================
// SaaS SUBSCRIPTION PAYMENTS (GymFlow -> Gym Owners)
// ============================================

// Create PayPal order for SaaS subscription
export async function createPayPalOrder(
  amount: string, 
  currency: string = 'USD',
  description: string = 'GymFlow Monthly Subscription'
): Promise<{ id: string } | null> {
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
            description: description,
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

// ============================================
// PAYPAL CONNECT (Gym Owners Connect Their Account)
// ============================================

// Generate PayPal Connect URL for gym owners
export function getPayPalConnectUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: PAYPAL_CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile https://uri.paypal.com/services/paypalattributes',
    redirect_uri: redirectUri,
    state: state,
    flowEntry: 'static',
  })

  const base = PAYPAL_MODE === 'live' 
    ? 'https://www.paypal.com/signin/authorize'
    : 'https://www.sandbox.paypal.com/signin/authorize'

  return `${base}?${params.toString()}`
}

// Exchange authorization code for tokens (when gym owner connects their PayPal)
export async function exchangePayPalCode(
  code: string, 
  redirectUri: string
): Promise<{ 
  success: boolean
  access_token?: string
  refresh_token?: string
  email?: string
  payer_id?: string
}> {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')

    // Exchange code for tokens
    const tokenResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('PayPal code exchange error:', tokenData)
      return { success: false }
    }

    // Get user info with the access token
    const userResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token/userinfo`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
      },
    })

    const userData = await userResponse.json()

    return {
      success: true,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      email: userData.email,
      payer_id: userData.payer_id,
    }
  } catch (error) {
    console.error('PayPal code exchange failed:', error)
    return { success: false }
  }
}

// ============================================
// GYM OWNER BALANCE & TRANSACTIONS
// ============================================

// Get balance for a connected gym owner
export async function getGymPayPalBalance(gymPaypalRefreshToken: string): Promise<{
  success: boolean
  balance?: {
    total: string
    currency: string
  }
}> {
  const accessToken = await getGymPayPalAccessToken(gymPaypalRefreshToken)
  if (!accessToken) return { success: false }

  try {
    const response = await fetch(`${PAYPAL_API_BASE}/v1/reporting/balances?currency_code=USD`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('PayPal balance error:', data)
      return { success: false }
    }

    if (data.balances && data.balances.length > 0) {
      return {
        success: true,
        balance: {
          total: data.balances[0].total_balance.value,
          currency: data.balances[0].total_balance.currency_code,
        }
      }
    }

    return { success: false }
  } catch (error) {
    console.error('PayPal balance fetch failed:', error)
    return { success: false }
  }
}

// Get transactions for a connected gym owner
export async function getGymPayPalTransactions(
  gymPaypalRefreshToken: string,
  startDate: string,
  endDate: string
): Promise<{
  success: boolean
  transactions?: any[]
}> {
  const accessToken = await getGymPayPalAccessToken(gymPaypalRefreshToken)
  if (!accessToken) return { success: false }

  try {
    const response = await fetch(
      `${PAYPAL_API_BASE}/v1/reporting/transactions?start_date=${startDate}T00:00:00-0000&end_date=${endDate}T23:59:59-0000&fields=all`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('PayPal transactions error:', data)
      return { success: false }
    }

    return {
      success: true,
      transactions: data.transaction_details || [],
    }
  } catch (error) {
    console.error('PayPal transactions fetch failed:', error)
    return { success: false }
  }
}

// ============================================
// MEMBERSHIP PAYMENTS (Users -> Gym Owners)
// ============================================

// Create order for gym membership payment (money goes to gym owner's PayPal)
export async function createGymMembershipOrder(
  gymPaypalRefreshToken: string,
  amount: string,
  currency: string = 'USD',
  gymName: string,
  memberName: string
): Promise<{ id: string } | null> {
  const accessToken = await getGymPayPalAccessToken(gymPaypalRefreshToken)
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
            description: `${gymName} - Membresía Mensual`,
            soft_descriptor: `${gymName.substring(0, 22).toUpperCase()}`,
            custom_id: `member_${Date.now()}`,
          },
        ],
        payer: {
          name: {
            given_name: memberName.split(' ')[0],
            surname: memberName.split(' ').slice(1).join(' ') || 'Member',
          },
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gym membership order error:', data)
      return null
    }

    return { id: data.id }
  } catch (error) {
    console.error('Gym membership order failed:', error)
    return null
  }
}

// Capture gym membership payment
export async function captureGymMembershipOrder(
  gymPaypalRefreshToken: string,
  orderId: string
): Promise<{ success: boolean; data?: any }> {
  const accessToken = await getGymPayPalAccessToken(gymPaypalRefreshToken)
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
      console.error('Gym membership capture error:', data)
      return { success: false }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Gym membership capture failed:', error)
    return { success: false }
  }
}

// ============================================
// WEBHOOK VERIFICATION
// ============================================

export async function verifyPayPalWebhook(
  body: string,
  headers: Headers
): Promise<boolean> {
  // In production, verify webhook signature
  // For now, return true for demo
  return true
}
