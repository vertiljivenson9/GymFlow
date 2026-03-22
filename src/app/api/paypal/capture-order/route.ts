import { NextRequest, NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const result = await capturePayPalOrder(orderId)

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 })
    }

    // Here you would update the gym's subscription status in Firebase
    // For demo, just return success

    return NextResponse.json({
      success: true,
      message: 'Payment captured successfully',
      data: result.data
    })
  } catch (error) {
    console.error('Capture order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
