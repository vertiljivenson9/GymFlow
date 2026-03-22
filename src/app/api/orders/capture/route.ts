// =======================================================
// 📁 API: CAPTURE PAYPAL ORDER (SECURE - BACKEND ONLY)
// =======================================================

import { NextRequest, NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal-api'
import { 
  paymentsCollection, 
  subscriptionsCollection, 
  plansCollection,
  gymsCollection 
} from '@/lib/db'
import { calculatePeriodEnd } from '@/lib/subscription'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderID, userId, gymId, planId } = body

    console.log('[API] Capture order request:', { orderID, userId, gymId, planId })

    // Validate required fields
    if (!orderID) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Capture payment via PayPal API (SECURE - uses secret key)
    const result = await capturePayPalOrder(orderID)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Payment capture failed' },
        { status: 400 }
      )
    }

    // Extract payment details from capture result
    const captureData = result.data
    const purchaseUnit = captureData?.purchase_units?.[0]
    const paymentAmount = purchaseUnit?.payments?.captures?.[0]?.amount?.value || '0'
    const paymentCurrency = purchaseUnit?.payments?.captures?.[0]?.amount?.currency_code || 'USD'
    const payerEmail = captureData?.payer?.email_address

    console.log('[API] Payment captured:', {
      orderID,
      amount: paymentAmount,
      currency: paymentCurrency,
      payer: payerEmail
    })

    // Update payment record
    try {
      await paymentsCollection.update(orderID, {
        status: 'completed',
        capturedAt: new Date(),
        amount: paymentAmount,
        currency: paymentCurrency,
      })
    } catch (dbError) {
      console.error('[API] Failed to update payment:', dbError)
    }

    // Create subscription if userId and planId provided
    if (userId && gymId && planId) {
      try {
        const plan = await plansCollection.find(planId)
        const interval = plan?.interval || 'month'

        await subscriptionsCollection.create({
          userId,
          gymId,
          planId,
          status: 'active',
          currentPeriodStart: Date.now(),
          currentPeriodEnd: calculatePeriodEnd(interval),
          paypalOrderId: orderID,
        })

        console.log('[API] Subscription created for user:', userId)

      } catch (subError) {
        console.error('[API] Failed to create subscription:', subError)
        // Payment is captured, but subscription creation failed
        // This should be handled by webhook or manual review
      }
    }

    return NextResponse.json({
      success: true,
      orderId: orderID,
      amount: paymentAmount,
      currency: paymentCurrency,
    })

  } catch (error: any) {
    console.error('[API] Capture order error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
