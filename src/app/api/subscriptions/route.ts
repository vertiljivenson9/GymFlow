import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

// GET - Get subscription status for a gym
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const gymId = searchParams.get('gymId')

    if (!gymId) {
      return NextResponse.json({ error: 'Gym ID required' }, { status: 400 })
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const subscriptionDoc = await db.collection('gym_subscriptions').doc(gymId).get()

    if (!subscriptionDoc.exists) {
      return NextResponse.json({
        hasSubscription: false,
        inTrial: true,
        trialEndsAt: null,
      })
    }

    const subscription = subscriptionDoc.data()

    return NextResponse.json({
      hasSubscription: true,
      status: subscription?.status || 'inactive',
      plan: subscription?.plan || 'monthly',
      amount: subscription?.amount || 49,
      currency: subscription?.currency || 'USD',
      startDate: subscription?.startDate?.toDate?.()?.toISOString() || subscription?.startDate,
      endDate: subscription?.endDate?.toDate?.()?.toISOString() || subscription?.endDate,
      paypalOrderId: subscription?.paypalOrderId,
      inTrial: false,
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create/activate subscription after successful payment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gymId, plan, paypalOrderId, amount } = body

    if (!gymId || !plan || !paypalOrderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Calculate subscription dates
    const startDate = new Date()
    const endDate = new Date()
    
    if (plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else if (plan === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    // Create subscription record
    await db.collection('gym_subscriptions').doc(gymId).set({
      gymId,
      status: 'active',
      plan,
      amount: amount || (plan === 'yearly' ? 470 : 49),
      currency: 'USD',
      startDate,
      endDate,
      paypalOrderId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Update gym with subscription status
    await db.collection('gyms').doc(gymId).update({
      subscriptionStatus: 'active',
      subscriptionPlan: plan,
      subscriptionEndsAt: endDate,
    })

    // Record transaction
    await db.collection('transactions').add({
      gymId,
      type: 'subscription',
      plan,
      amount: amount || (plan === 'yearly' ? 470 : 49),
      currency: 'USD',
      paypalOrderId,
      status: 'completed',
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      subscription: {
        status: 'active',
        plan,
        endDate: endDate.toISOString(),
      }
    })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
