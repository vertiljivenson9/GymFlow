// Today's Workout API
import { NextRequest, NextResponse } from 'next/server'
import { getTodayWorkout } from '../../../../lib/services/workoutService'
import { withAuth, badRequest } from '../../../../lib/middleware/auth'

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return badRequest('Missing memberId parameter')
    }

    const workout = await getTodayWorkout(req.user.gymId, memberId)

    if (!workout) {
      return NextResponse.json(
        { error: 'No workout found for today' },
        { status: 404 }
      )
    }

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Get workout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
