// Log Workout API
import { NextRequest, NextResponse } from 'next/server'
import { logWorkoutExercise, completeWorkoutDay } from '../../../../lib/services/workoutService'
import { withAuth, badRequest } from '../../../../lib/middleware/auth'
import { z } from 'zod'

const LogWorkoutSchema = z.object({
  memberId: z.string(),
  workoutExerciseId: z.string(),
  sets: z.array(z.object({
    setNumber: z.number(),
    repsCompleted: z.number(),
    weight: z.number(),
    completed: z.boolean(),
    notes: z.string().optional(),
  })),
  difficulty: z.number().min(1).max(10).optional(),
})

const CompleteDaySchema = z.object({
  memberId: z.string(),
  dayIndex: z.number(),
})

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Allow unauthenticated access for QR-based logging
    // In production, you'd want some form of session validation
  }
  
  try {
    const body = await req.json()
    
    // Check if completing day or logging exercise
    if (body.dayIndex !== undefined) {
      return handleCompleteDay(req, body)
    }
    
    return handleLogExercise(req, body)
  } catch (error) {
    console.error('Log workout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleLogExercise(req: NextRequest, body: any) {
  const validated = LogWorkoutSchema.safeParse(body)
  
  if (!validated.success) {
    return badRequest('Invalid input: ' + validated.error.issues[0].message)
  }

  // For now, use gymId from body or a default
  // In production, this should be validated through auth
  const gymId = body.gymId || 'demo-gym'

  const log = await logWorkoutExercise(gymId, validated.data.memberId, {
    workoutExerciseId: validated.data.workoutExerciseId,
    sets: validated.data.sets,
    difficulty: validated.data.difficulty,
  })

  return NextResponse.json(log)
}

async function handleCompleteDay(req: NextRequest, body: any) {
  const validated = CompleteDaySchema.safeParse(body)
  
  if (!validated.success) {
    return badRequest('Invalid input: ' + validated.error.issues[0].message)
  }

  const gymId = body.gymId || 'demo-gym'

  await completeWorkoutDay(gymId, validated.data.memberId, validated.data.dayIndex)

  return NextResponse.json({ success: true })
}
