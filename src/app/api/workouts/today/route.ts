export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, badRequest } from '@/lib/edge-middleware'
import { getDb } from '@/lib/firebase-admin'

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return badRequest('Missing memberId parameter')
    }

    const db = await getDb()

    if (!db) {
      // Demo mode
      return NextResponse.json({
        id: 'demo-workout',
        dayIndex: 0,
        date: new Date().toISOString().split('T')[0],
        exercises: [
          { id: 'ex1', name: 'Bench Press', sets: 4, reps: '8-10' },
          { id: 'ex2', name: 'Rows', sets: 4, reps: '10-12' },
        ],
        demo: true
      })
    }

    // Get today's workout
    const today = new Date().toISOString().split('T')[0]
    const snapshot = await db.collection('workouts')
      .where('memberId', '==', memberId)
      .where('date', '==', today)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return NextResponse.json({ error: 'No workout found for today' }, { status: 404 })
    }

    const workoutDoc = snapshot.docs[0]
    return NextResponse.json({
      id: workoutDoc.id,
      ...workoutDoc.data()
    })
  } catch (error) {
    console.error('Get workout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
