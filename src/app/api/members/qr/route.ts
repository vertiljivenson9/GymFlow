import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const qrCode = searchParams.get('qr')
    const gymId = searchParams.get('gymId')

    if (!qrCode || !gymId) {
      return NextResponse.json({ error: 'Missing qr or gymId parameter' }, { status: 400 })
    }

    const db = await getDb()

    if (!db) {
      return NextResponse.json({
        valid: true,
        member: {
          id: 'demo-member',
          name: 'Demo Member',
          level: 'intermediate'
        },
        membership: {
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        demo: true
      })
    }

    const snapshot = await db.collection('members')
      .where('qrCode', '==', qrCode)
      .where('gymId', '==', gymId)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid QR code'
      }, { status: 403 })
    }

    const memberDoc = snapshot.docs[0]
    const memberData = memberDoc.data()

    const membershipSnapshot = await db.collection('memberships')
      .where('memberId', '==', memberDoc.id)
      .where('status', '==', 'active')
      .limit(1)
      .get()

    if (membershipSnapshot.empty) {
      return NextResponse.json({
        valid: false,
        error: 'No active membership',
        member: { id: memberDoc.id, name: memberData.name }
      }, { status: 403 })
    }

    return NextResponse.json({
      valid: true,
      member: {
        id: memberDoc.id,
        name: memberData.name,
        level: memberData.level || 'beginner'
      },
      membership: {
        id: membershipSnapshot.docs[0].id,
        ...membershipSnapshot.docs[0].data()
      }
    })
  } catch (error) {
    console.error('QR validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
