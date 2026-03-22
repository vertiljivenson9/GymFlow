import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { memberId } = body

    if (!memberId) {
      return NextResponse.json({ error: 'Missing memberId' }, { status: 400 })
    }

    const db = await getDb()

    if (!db) {
      return NextResponse.json({
        id: 'demo-workout',
        dayIndex: 0,
        date: new Date().toISOString().split('T')[0],
        exercises: [
          { id: 'ex1', name: 'Bench Press', sets: 4, reps: '8-10', weight: 0 },
          { id: 'ex2', name: 'Rows', sets: 4, reps: '10-12', weight: 0 },
          { id: 'ex3', name: 'Shoulder Press', sets: 3, reps: '10-12', weight: 0 },
        ],
        demo: true
      })
    }

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
}
