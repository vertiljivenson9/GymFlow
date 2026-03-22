export const runtime = 'edge';

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'

export async function POST(request: Request) {
  try {
    const db = await getDb()

    // Demo mode if Firebase Admin not configured
    if (!db) {
      return NextResponse.json({
        success: true,
        demo: true,
        message: 'Firebase Admin not configured - running in demo mode'
      })
    }

    const body = await request.json()
    const { serviceId, serviceName, date, time, timeSlotId, customerName, customerEmail, customerPhone, price } = body

    const bookingRef = db.collection('bookings').doc()
    const bookingData = {
      serviceId,
      serviceName,
      date,
      time,
      timeSlotId,
      customerName,
      customerEmail,
      customerPhone,
      price,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    await bookingRef.set(bookingData)

    return NextResponse.json({
      success: true,
      data: {
        id: bookingRef.id,
        ...bookingData,
      }
    })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const db = await getDb()

  // Demo mode if Firebase Admin not configured
  if (!db) {
    return NextResponse.json({
      success: true,
      demo: true,
      data: []
    })
  }

  try {
    const bookingsSnapshot = await db.collection('bookings').orderBy('createdAt', 'desc').limit(50).get()
    const bookings = bookingsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ success: true, data: bookings })
  } catch (error) {
    console.error('Fetch bookings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
