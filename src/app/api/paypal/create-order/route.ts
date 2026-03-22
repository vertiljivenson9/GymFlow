import { NextRequest, NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/paypal-api'
import { gymsCollection, plansCollection, paymentsCollection } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, currency = 'USD', gymId, planId, planName } = body

    console.log('[PayPal] Create order request:', { amount, currency, gymId, planId })

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      )
    }

    // Create PayPal order
    const order = await createPayPalOrder({
      amount: String(amount),
      currency,
      description: planName || `GymFlow Subscription`,
      gymId,
      planId,
    })

    // Store payment record
    try {
      await paymentsCollection.create({
        orderID: order.id,
        userId: 'pending', // Will be updated on capture
        gymId: gymId || 'unknown',
        planId: planId || 'unknown',
        amount: String(amount),
        currency,
        status: 'created',
      })
    } catch (dbError) {
      console.error('[PayPal] Failed to store payment record:', dbError)
    }

    return NextResponse.json({ orderId: order.id })

  } catch (error: any) {
    console.error('[PayPal] Create order error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}
