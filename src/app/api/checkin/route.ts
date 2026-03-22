// =======================================================
// 📁 API: CHECK-IN
// =======================================================

import { NextRequest, NextResponse } from 'next/server'
import { verifyQRToken } from '@/lib/qr'
import { performCheckin, performMemberCheckin } from '@/lib/checkin'
import { membersCollection, checkinsCollection } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, userId, gymId, memberId, qrCode } = body

    console.log('[API] Check-in request:', { token, userId, gymId, memberId, qrCode })

    // ========================================
    // CASE 1: Token-based check-in (QR with signature)
    // ========================================
    if (token) {
      // Verify QR token (anti-fraud)
      const verification = verifyQRToken(token)

      if (!verification.valid) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'QR inválido',
            reason: verification.reason 
          },
          { status: 400 }
        )
      }

      // Perform check-in with verified gymId
      const result = await performCheckin(userId, verification.gymId!, {
        qrToken: token
      })

      return NextResponse.json(result)
    }

    // ========================================
    // CASE 2: Member QR check-in
    // ========================================
    if (memberId && gymId && qrCode) {
      const result = await performMemberCheckin(gymId, memberId, qrCode)
      return NextResponse.json(result)
    }

    // ========================================
    // CASE 3: Direct check-in (needs userId + gymId)
    // ========================================
    if (userId && gymId) {
      const result = await performCheckin(userId, gymId)
      return NextResponse.json(result)
    }

    // ========================================
    // Invalid request
    // ========================================
    return NextResponse.json(
      { 
        success: false, 
        error: 'Missing required fields' 
      },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('[API] Check-in error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Check-in failed' },
      { status: 500 }
    )
  }
}

// GET check-in history
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const gymId = searchParams.get('gymId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!gymId) {
      return NextResponse.json(
        { error: 'Gym ID required' },
        { status: 400 }
      )
    }

    const checkins = await checkinsCollection.getByGym(gymId, limit)

    return NextResponse.json({ checkins })

  } catch (error: any) {
    console.error('[API] Get check-ins error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get check-ins' },
      { status: 500 }
    )
  }
}
