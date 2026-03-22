import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/edge-auth'
import { getDb } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ error: 'Missing memberId parameter' }, { status: 400 })
    }

    const db = await getDb()

    if (!db) {
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
}
