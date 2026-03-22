export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { memberId, workoutExerciseId, sets, dayIndex, gymId } = body

    const db = await getDb()

    if (!db) {
      return NextResponse.json({ success: true, demo: true })
    }

    if (dayIndex !== undefined) {
      // Complete workout day
      await db.collection('workout_logs').add({
        memberId,
        dayIndex,
        completedAt: new Date().toISOString(),
        gymId: gymId || 'demo-gym'
      })
      return NextResponse.json({ success: true })
    }

    // Log exercise
    await db.collection('exercise_logs').add({
      memberId,
      workoutExerciseId,
      sets,
      loggedAt: new Date().toISOString(),
      gymId: gymId || 'demo-gym'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Log workout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
