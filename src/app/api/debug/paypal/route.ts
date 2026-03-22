// =======================================================
// 📁 DEBUG: PayPal Configuration Check
// =======================================================

import { NextResponse } from 'next/server'

export async function GET() {
  // Check environment variables (without exposing secrets)
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const mode = process.env.PAYPAL_MODE || 'sandbox'

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PAYPAL_MODE: mode,
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: clientId ? `${clientId.substring(0, 10)}...${clientId.substring(clientId.length - 4)}` : 'NOT SET',
      PAYPAL_CLIENT_SECRET: clientSecret ? `SET (${clientSecret.length} chars)` : 'NOT SET',
      PAYPAL_BASE_URL: mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
    },
    checks: {
      clientIdPresent: !!clientId,
      clientSecretPresent: !!clientSecret,
      clientIdFormat: clientId ? clientId.startsWith('A') || clientId.startsWith('Aa') || clientId.length > 50 : false,
    }
  }

  // Try to authenticate with PayPal
  if (clientId && clientSecret) {
    try {
      const baseUrl = mode === 'live' 
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com'

      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

      const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      })

      const data = await response.json()

      diagnostics.auth = {
        success: response.ok,
        status: response.status,
        error: response.ok ? null : (data.error_description || data.error || 'Unknown error'),
        tokenReceived: response.ok ? 'Yes' : 'No',
      }

      if (response.ok) {
        diagnostics.auth.tokenLength = data.access_token?.length || 0
        diagnostics.auth.expiresIn = data.expires_in
        diagnostics.auth.appId = data.app_id
      }

    } catch (error: any) {
      diagnostics.auth = {
        success: false,
        error: error.message || 'Network error',
      }
    }
  } else {
    diagnostics.auth = {
      success: false,
      error: 'Missing credentials',
    }
  }

  // Recommendations
  diagnostics.recommendations = []

  if (!clientId) {
    diagnostics.recommendations.push('NEXT_PUBLIC_PAYPAL_CLIENT_ID is not set')
  }
  if (!clientSecret) {
    diagnostics.recommendations.push('PAYPAL_CLIENT_SECRET is not set')
  }
  if (clientId && clientSecret && !diagnostics.auth?.success) {
    diagnostics.recommendations.push('Credentials are set but authentication failed')
    diagnostics.recommendations.push('Check if PAYPAL_MODE matches your credentials (sandbox vs live)')
    diagnostics.recommendations.push('Verify credentials in PayPal Developer Dashboard: https://developer.paypal.com/dashboard/')
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
