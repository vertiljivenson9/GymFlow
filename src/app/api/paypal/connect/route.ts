import { NextRequest, NextResponse } from 'next/server'
import { getPayPalConnectUrl } from '@/lib/paypal'
import { db } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gymId } = body

    if (!gymId) {
      return NextResponse.json({ error: 'Gym ID required' }, { status: 400 })
    }

    // Generate a state token for security
    const state = Buffer.from(JSON.stringify({
      gymId,
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(7)
    })).toString('base64')

    // Store state in Firestore for verification (optional but recommended)
    if (db) {
      await db.collection('paypal_connect_states').doc(gymId).set({
        state,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      })
    }

    // The redirect URI must match what's configured in PayPal app
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/paypal/callback`
    
    const connectUrl = getPayPalConnectUrl(redirectUri, state)

    return NextResponse.json({ 
      connectUrl,
      state 
    })
  } catch (error) {
    console.error('PayPal connect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
