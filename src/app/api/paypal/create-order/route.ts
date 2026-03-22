import { NextRequest, NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, currency = 'USD' } = body

    if (!amount) {
      return NextResponse.json({ error: 'Amount required' }, { status: 400 })
    }

    const order = await createPayPalOrder(amount, currency)

    if (!order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    return NextResponse.json({ orderId: order.id })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
