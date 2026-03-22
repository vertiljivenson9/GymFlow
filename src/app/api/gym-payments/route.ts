import { NextRequest, NextResponse } from 'next/server'
import { createGymMembershipOrder, captureGymMembershipOrder } from '@/lib/paypal'
import { db } from '@/lib/firebase-admin'

// GET - Get member payment history
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const gymId = searchParams.get('gymId')
    const memberId = searchParams.get('memberId')

    if (!gymId) {
      return NextResponse.json({ error: 'Gym ID required' }, { status: 400 })
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    let query = db.collection('member_payments').where('gymId', '==', gymId)
    
    if (memberId) {
      query = query.where('memberId', '==', memberId)
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get()
    
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    }))

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create membership payment for a gym member
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gymId, memberId, memberName, amount, currency = 'USD' } = body

    if (!gymId || !memberId || !memberName || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get gym's PayPal connection
    const connectionDoc = await db.collection('gym_paypal_connections').doc(gymId).get()
    
    if (!connectionDoc.exists) {
      return NextResponse.json({ error: 'Gym PayPal not connected' }, { status: 400 })
    }

    const connection = connectionDoc.data()
    
    if (connection?.status !== 'connected' || !connection?.refreshToken) {
      return NextResponse.json({ error: 'Gym PayPal connection invalid' }, { status: 400 })
    }

    // Get gym info
    const gymDoc = await db.collection('gyms').doc(gymId).get()
    const gym = gymDoc.data()

    // Create PayPal order using gym owner's PayPal
    const order = await createGymMembershipOrder(
      connection.refreshToken,
      amount,
      currency,
      gym?.name || 'Gym',
      memberName
    )

    if (!order) {
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
    }

    // Store pending payment
    await db.collection('member_payments').add({
      gymId,
      memberId,
      memberName,
      amount,
      currency,
      paypalOrderId: order.id,
      status: 'pending',
      createdAt: new Date(),
    })

    return NextResponse.json({
      orderId: order.id,
      status: 'pending',
    })
  } catch (error) {
    console.error('Create gym payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Capture/complete a membership payment
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { gymId, orderId, memberId } = body

    if (!gymId || !orderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Get gym's PayPal connection
    const connectionDoc = await db.collection('gym_paypal_connections').doc(gymId).get()
    
    if (!connectionDoc.exists) {
      return NextResponse.json({ error: 'Gym PayPal not connected' }, { status: 400 })
    }

    const connection = connectionDoc.data()

    // Capture the payment
    const result = await captureGymMembershipOrder(connection?.refreshToken, orderId)

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 })
    }

    // Update payment status
    const paymentQuery = await db.collection('member_payments')
      .where('paypalOrderId', '==', orderId)
      .limit(1)
      .get()

    if (!paymentQuery.empty) {
      await paymentQuery.docs[0].ref.update({
        status: 'completed',
        capturedAt: new Date(),
        captureData: result.data,
      })
    }

    // Update member's membership status
    if (memberId) {
      const membershipEnd = new Date()
      membershipEnd.setMonth(membershipEnd.getMonth() + 1)

      await db.collection('members').doc(memberId).update({
        membershipStatus: 'active',
        membershipEndsAt: membershipEnd,
        lastPaymentAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      status: 'completed',
    })
  } catch (error) {
    console.error('Capture gym payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
