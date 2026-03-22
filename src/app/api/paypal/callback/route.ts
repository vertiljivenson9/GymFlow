import { NextRequest, NextResponse } from 'next/server'
import { exchangePayPalCode } from '@/lib/paypal'
import { db } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=missing_params`
      )
    }

    // Decode state to get gymId
    let gymId: string
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      gymId = stateData.gymId

      // Verify state hasn't expired (optional)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        throw new Error('State expired')
      }
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=invalid_state`
      )
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/paypal/callback`
    const result = await exchangePayPalCode(code, redirectUri)

    if (!result.success) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=exchange_failed`
      )
    }

    // Store PayPal connection info in Firestore
    if (db) {
      await db.collection('gym_paypal_connections').doc(gymId).set({
        gymId,
        paypalEmail: result.email,
        paypalPayerId: result.payer_id,
        refreshToken: result.refresh_token, // Store securely! This is sensitive
        connectedAt: new Date(),
        status: 'connected',
      })

      // Update gym with PayPal connection status
      await db.collection('gyms').doc(gymId).update({
        paypalConnected: true,
        paypalEmail: result.email,
        paypalConnectedAt: new Date(),
      })
    }

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?paypal_connected=true&email=${result.email}`
    )
  } catch (error) {
    console.error('PayPal callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=internal_error`
    )
  }
}
