// PayPal Status Endpoint - Returns whether PayPal is ready or in demo mode
import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || ''
  const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase()
  
  const hasCredentials = clientId.length > 20 && clientSecret.length > 10
  
  // If no credentials, demo mode
  if (!hasCredentials) {
    return NextResponse.json({
      configured: false,
      mode: mode,
      demoMode: true,
      reason: 'missing_credentials',
      message: 'PayPal credentials not configured. Using demo mode.',
      timestamp: new Date().toISOString()
    })
  }
  
  // Test authentication
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
    
    if (response.ok) {
      return NextResponse.json({
        configured: true,
        mode: mode,
        demoMode: false,
        message: 'PayPal is configured and working.',
        timestamp: new Date().toISOString()
      })
    } else {
      const data = await response.json()
      return NextResponse.json({
        configured: false,
        mode: mode,
        demoMode: true,
        reason: 'auth_failed',
        error: data.error_description || data.error || 'Authentication failed',
        message: 'PayPal credentials are invalid. Using demo mode.',
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error: any) {
    return NextResponse.json({
      configured: false,
      mode: mode,
      demoMode: true,
      reason: 'network_error',
      error: error.message,
      message: 'Could not connect to PayPal. Using demo mode.',
      timestamp: new Date().toISOString()
    })
  }
}
