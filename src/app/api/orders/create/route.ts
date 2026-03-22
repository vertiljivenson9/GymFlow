// =======================================================
// 📁 API: CREATE PAYPAL ORDER
// =======================================================

import { NextRequest, NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/paypal-api'
import { gymsCollection, plansCollection, paymentsCollection } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, gymSlug, userId, amount } = body

    console.log('[API] Create order request:', { planId, gymSlug, userId, amount })

    // Validate required fields
    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      )
    }

    // Get gym info if gymSlug provided
    let gymId = body.gymId
    if (gymSlug && !gymId) {
      const gym = await gymsCollection.findBySlug(gymSlug)
      gymId = gym?.id
    }

    // Get plan info if planId provided
    let planAmount = amount
    let planInterval = 'month'
    
    if (planId) {
      const plan = await plansCollection.find(planId)
      if (plan) {
        planAmount = plan.price
        planInterval = plan.interval
      }
    }

    // Create PayPal order
    const order = await createPayPalOrder({
      amount: String(planAmount),
      description: `GymFlow ${planId || 'Subscription'}`,
      gymId,
      planId,
      userId,
    })

    // Store payment record in database
    try {
      await paymentsCollection.create({
        orderID: order.id,
        userId: userId || 'anonymous',
        gymId: gymId || 'unknown',
        planId: planId || 'unknown',
        amount: String(planAmount),
        currency: 'USD',
        status: 'created',
      })
    } catch (dbError) {
      console.error('[API] Failed to store payment record:', dbError)
      // Continue anyway - order is created
    }

    return NextResponse.json({
      id: order.id,
      links: order.links
    })

  } catch (error: any) {
    console.error('[API] Create order error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}
