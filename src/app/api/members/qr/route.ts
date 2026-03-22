// QR Access API - No login required for members
import { NextRequest, NextResponse } from 'next/server'
import { validateQRAccess } from '../../../../lib/services/memberService'
import { badRequest } from '../../../../lib/middleware/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const qrCode = searchParams.get('qr')
    const gymId = searchParams.get('gymId')

    if (!qrCode || !gymId) {
      return badRequest('Missing qr or gymId parameter')
    }

    // Rate limiting would be added here in production
    // For now, we allow all requests

    const result = await validateQRAccess(gymId, qrCode)

    if (!result.valid) {
      return NextResponse.json(
        { 
          valid: false, 
          error: result.error,
          member: result.member ? {
            id: result.member.id,
            name: result.member.name,
          } : undefined,
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      valid: true,
      member: {
        id: result.member!.id,
        name: result.member!.name,
        level: result.member!.level,
      },
      membership: result.membership,
    })
  } catch (error) {
    console.error('QR validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
