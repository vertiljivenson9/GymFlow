import { NextRequest, NextResponse } from 'next/server'
import { getGymPayPalTransactions } from '@/lib/paypal'
import { db } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gymId, startDate, endDate } = body

    if (!gymId) {
      return NextResponse.json({ error: 'Gym ID required' }, { status: 400 })
    }

    // Default to last 30 days if no dates provided
    const end = endDate || new Date().toISOString().split('T')[0]
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

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

    // Get transactions from PayPal
    const result = await getGymPayPalTransactions(connection.refreshToken, start, end)

    if (!result.success) {
      return NextResponse.json({ 
        connected: true,
        error: 'Failed to fetch transactions' 
      }, { status: 500 })
    }

    // Process transactions for display
    const processedTransactions = (result.transactions || []).map((t: any) => ({
      id: t.transaction_info?.transaction_id || 'N/A',
      date: t.transaction_info?.time_updated || new Date().toISOString(),
      type: t.transaction_info?.transaction_event_code || 'UNKNOWN',
      amount: t.transaction_info?.transaction_amount?.value || '0',
      currency: t.transaction_info?.transaction_amount?.currency_code || 'USD',
      status: t.transaction_info?.transaction_status || 'UNKNOWN',
      payerEmail: t.payer_info?.email_address || 'N/A',
      payerName: t.payer_info?.payer_name?.given_name 
        ? `${t.payer_info.payer_name.given_name} ${t.payer_info.payer_name.surname || ''}`
        : 'Unknown',
    }))

    return NextResponse.json({
      connected: true,
      transactions: processedTransactions,
      email: connection.paypalEmail,
      startDate: start,
      endDate: end,
    })
  } catch (error) {
    console.error('PayPal transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
