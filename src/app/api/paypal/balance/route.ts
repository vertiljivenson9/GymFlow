import { NextRequest, NextResponse } from 'next/server'
import { getGymPayPalBalance } from '@/lib/paypal'
import { db } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gymId } = body

    if (!gymId) {
      return NextResponse.json({ error: 'Gym ID required' }, { status: 400 })
    }

    // Get gym's PayPal connection
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const connectionDoc = await db.collection('gym_paypal_connections').doc(gymId).get()
    
    if (!connectionDoc.exists) {
      return NextResponse.json({ 
        connected: false,
        error: 'PayPal not connected' 
      }, { status: 400 })
    }

    const connection = connectionDoc.data()
    
    if (connection?.status !== 'connected' || !connection?.refreshToken) {
      return NextResponse.json({ 
        connected: false,
        error: 'PayPal connection invalid' 
      }, { status: 400 })
    }

    // Get balance from PayPal
    const result = await getGymPayPalBalance(connection.refreshToken)

    if (!result.success) {
      return NextResponse.json({ 
        connected: true,
        error: 'Failed to fetch balance' 
      }, { status: 500 })
    }

    return NextResponse.json({
      connected: true,
      balance: result.balance,
      email: connection.paypalEmail,
    })
  } catch (error) {
    console.error('PayPal balance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
