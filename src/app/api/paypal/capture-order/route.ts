import { NextRequest, NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal-api'
import { 
  paymentsCollection, 
  subscriptionsCollection, 
  plansCollection,
  membersCollection
} from '@/lib/db'
import { calculatePeriodEnd } from '@/lib/subscription'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, userId, gymId, planId, memberId } = body

    console.log('[PayPal] Capture order request:', { orderId, userId, gymId, planId, memberId })

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Capture payment via PayPal API (SECURE - uses secret key)
    const result = await capturePayPalOrder(orderId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Payment capture failed' },
        { status: 400 }
      )
    }

    // Extract payment details
    const captureData = result.data
    const purchaseUnit = captureData?.purchase_units?.[0]
    const paymentAmount = purchaseUnit?.payments?.captures?.[0]?.amount?.value || '0'
    const paymentCurrency = purchaseUnit?.payments?.captures?.[0]?.amount?.currency_code || 'USD'

    console.log('[PayPal] Payment captured:', { orderId, amount: paymentAmount })

    // Update payment record
    try {
      await paymentsCollection.update(orderId, {
        status: 'completed',
        capturedAt: new Date(),
        amount: paymentAmount,
        currency: paymentCurrency,
        userId: userId || 'unknown',
      })
    } catch (dbError) {
      console.error('[PayPal] Failed to update payment:', dbError)
    }

    // Create subscription if plan info provided (SaaS subscription for gym owners)
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
          paypalOrderId: orderId,
        })

        console.log('[PayPal] Subscription created for user:', userId)

      } catch (subError) {
        console.error('[PayPal] Failed to create subscription:', subError)
      }
    }

    // Update member membership if this is a gym membership payment
    if (memberId && gymId) {
      try {
        const membershipEnd = new Date()
        membershipEnd.setMonth(membershipEnd.getMonth() + 1)

        await membersCollection.update(memberId, {
          membershipStatus: 'active',
          membershipEndsAt: membershipEnd.getTime(),
        })

        console.log('[PayPal] Member membership updated:', memberId)
      } catch (memberError) {
        console.error('[PayPal] Failed to update member:', memberError)
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      amount: paymentAmount,
      currency: paymentCurrency,
    })

  } catch (error: any) {
    console.error('[PayPal] Capture order error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
