export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, badRequest } from '@/lib/edge-middleware'
import { getDb } from '@/lib/firebase-admin'

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json()
    const { memberId } = body

    if (!memberId) {
      return badRequest('Missing memberId')
    }

    const db = await getDb()

    if (!db) {
      // Demo mode - return mock workout
      return NextResponse.json({
        id: 'demo-workout',
        dayIndex: 0,
        date: new Date().toISOString().split('T')[0],
        exercises: [
          { id: 'ex1', name: 'Bench Press', sets: 4, reps: '8-10', weight: 0, notes: '' },
          { id: 'ex2', name: 'Rows', sets: 4, reps: '10-12', weight: 0, notes: '' },
          { id: 'ex3', name: 'Shoulder Press', sets: 3, reps: '10-12', weight: 0, notes: '' },
        ],
        demo: true
      })
    }

    // Generate workout logic here
    return NextResponse.json({
      id: 'workout-' + Date.now(),
      dayIndex: 0,
      date: new Date().toISOString().split('T')[0],
      exercises: [],
    })
  } catch (error) {
    console.error('Generate workout error:', error)
    return NextResponse.json({ error: 'Failed to generate workout' }, { status: 500 })
  }
})
