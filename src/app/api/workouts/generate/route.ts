// Generate Workout API
import { NextRequest, NextResponse } from 'next/server'
import { generateWorkout } from '../../../../lib/services/workoutService'
import { withAuth, badRequest } from '../../../../lib/middleware/auth'

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json()
    const { memberId, forceRegenerate, targetPhase } = body

    if (!memberId) {
      return badRequest('Missing memberId')
    }

    const workout = await generateWorkout(req.user.gymId, memberId, {
      forceRegenerate,
      targetPhase,
    })

    return NextResponse.json(workout)
  } catch (error: any) {
    console.error('Generate workout error:', error)
    
    if (error.message === 'MEMBER_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'MEMBERSHIP_EXPIRED') {
      return NextResponse.json(
        { error: 'Membership expired', code: 'MEMBERSHIP_EXPIRED' },
        { status: 403 }
      )
    }
    
    if (error.message === 'NO_TEMPLATE_FOUND') {
      return NextResponse.json(
        { error: 'No template configured for this member level' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate workout' },
      { status: 500 }
    )
  }
})
