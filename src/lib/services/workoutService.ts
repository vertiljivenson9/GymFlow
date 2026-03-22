// WorkoutService - Workout generation and tracking
import { prisma, withGymFilter } from '../db'
import { resolveTemplate } from './ruleService'
import { pickExercise, ExerciseWithMetadata } from './exerciseService'
import { getMemberContext, MemberContext, checkMembershipStatus } from './memberService'
import { updateUserState, applyProgressionRules, getUserState, PhaseConfig } from '../engine/adaptive'

// ============================================
// TYPES
// ============================================

export interface GeneratedWorkout {
  id: string
  weekStart: Date
  phase: string
  days: {
    dayIndex: number
    name: string | null
    restDay: boolean
    exercises: {
      order: number
      exerciseId: string
      exerciseName: string
      sets: number
      reps: string
      weight: number
      restSeconds: number
    }[]
  }[]
}

// ============================================
// WORKOUT GENERATION PIPELINE
// ============================================

/**
 * Generate workout for a member
 * 
 * Pipeline:
 * 1. Get member
 * 2. Validate membership
 * 3. Resolve template
 * 4. Get template blocks
 * 5. Map blocks → exercises
 * 6. Apply plan modifiers
 * 7. Save workout
 */
export async function generateWorkout(
  gymId: string,
  memberId: string,
  options?: {
    forceRegenerate?: boolean
    targetPhase?: string
  }
): Promise<GeneratedWorkout | null> {
  // 1. Get member context
  const memberContext = await getMemberContext(gymId, memberId)
  if (!memberContext) {
    throw new Error('MEMBER_NOT_FOUND')
  }

  // 2. Validate membership
  if (!memberContext.hasActiveMembership) {
    throw new Error('MEMBERSHIP_EXPIRED')
  }

  // 3. Check if workout already exists for this week
  const weekStart = getWeekStart(new Date())
  const existing = await prisma.workout.findFirst({
    where: {
      memberId,
      weekStart,
    },
    include: {
      days: {
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { dayIndex: 'asc' },
      },
    },
  })

  if (existing && !options?.forceRegenerate) {
    return mapWorkoutToResponse(existing)
  }

  // 4. Resolve template
  const resolved = await resolveTemplate(gymId, {
    level: memberContext.level,
    planId: memberContext.planId,
  })

  if (!resolved) {
    throw new Error('NO_TEMPLATE_FOUND')
  }

  // 5. Get user state for adaptive rules
  const userState = await getUserState(memberId)
  const phaseConfig = applyProgressionRules(userState, options?.targetPhase)

  // 6. Generate workout days
  const workoutDays = await Promise.all(
    resolved.template.days.map(async (day) => {
      if (day.restDay) {
        return {
          dayIndex: day.dayIndex,
          name: day.name,
          restDay: true,
          exercises: [],
        }
      }

      // Map blocks to exercises
      const exercises = await Promise.all(
        day.blocks.map(async (block, index) => {
          const exercise = await pickExerciseForBlock(gymId, block.blockType, {
            memberLevel: memberContext.level,
            userState,
            phaseConfig,
            excludeIds: [], // Could track used exercises
          })

          if (!exercise) {
            return null
          }

          // Apply phase modifiers
          const modifiedSets = applySetsModifier(block.sets, phaseConfig)
          const modifiedReps = applyRepsModifier(block.reps, phaseConfig)

          return {
            order: index + 1,
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            sets: modifiedSets,
            reps: modifiedReps,
            weight: 0, // Will be set by member or from previous logs
            restSeconds: block.restSeconds,
          }
        })
      )

      return {
        dayIndex: day.dayIndex,
        name: day.name,
        restDay: false,
        exercises: exercises.filter((e): e is NonNullable<typeof e> => e !== null),
      }
    })
  )

  // 7. Save workout (transaction)
  const workout = await prisma.$transaction(async (tx) => {
    // Delete existing if forcing regenerate
    if (existing) {
      await tx.workout.delete({ where: { id: existing.id } })
    }

    return tx.workout.create({
      data: {
        memberId,
        weekStart,
        phase: phaseConfig.phase,
        days: {
          create: workoutDays.map(day => ({
            dayIndex: day.dayIndex,
            name: day.name,
            restDay: day.restDay,
            exercises: day.restDay ? undefined : {
              create: day.exercises.map(ex => ({
                order: ex.order,
                exerciseId: ex.exerciseId,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                restSeconds: ex.restSeconds,
              })),
            },
          })),
        },
      },
      include: {
        days: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { dayIndex: 'asc' },
        },
      },
    })
  })

  return mapWorkoutToResponse(workout)
}

/**
 * Pick exercise for a block with intelligence
 */
async function pickExerciseForBlock(
  gymId: string,
  blockType: string,
  options: {
    memberLevel: string
    userState: any
    phaseConfig: PhaseConfig
    excludeIds: string[]
  }
): Promise<ExerciseWithMetadata | null> {
  const { memberLevel, userState, phaseConfig, excludeIds } = options

  // Determine constraints based on level and phase
  const maxDifficulty = memberLevel === 'beginner' ? 2 : memberLevel === 'intermediate' ? 4 : 5
  const maxSkillRequired = memberLevel === 'beginner' ? 2 : memberLevel === 'intermediate' ? 3 : 5
  const maxFatigueImpact = phaseConfig.phase === 'deload' ? 5 : 10

  return pickExercise(gymId, blockType, {
    excludeIds,
    maxDifficulty,
    maxSkillRequired,
    maxFatigueImpact,
  })
}

/**
 * Apply sets modifier based on phase
 */
function applySetsModifier(sets: number, phaseConfig: PhaseConfig): number {
  if (phaseConfig.phase === 'deload') {
    return Math.max(1, Math.floor(sets * 0.7))
  }
  if (phaseConfig.phase === 'progression') {
    return sets + (phaseConfig.volumeIncrease || 0)
  }
  return sets
}

/**
 * Apply reps modifier based on phase
 */
function applyRepsModifier(reps: string, phaseConfig: PhaseConfig): string {
  // For now, keep original reps
  // In more advanced version, could modify rep ranges
  return reps
}

// ============================================
// WORKOUT RETRIEVAL
// ============================================

/**
 * Get today's workout for a member
 */
export async function getTodayWorkout(
  gymId: string,
  memberId: string
): Promise<GeneratedWorkout | null> {
  const weekStart = getWeekStart(new Date())
  const dayIndex = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
  const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1 // Convert to 0 = Monday

  const workout = await prisma.workout.findFirst({
    where: {
      memberId,
      weekStart,
    },
    include: {
      days: {
        where: { dayIndex: adjustedDayIndex },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  })

  if (!workout) return null

  return mapWorkoutToResponse(workout)
}

/**
 * Get full week workout
 */
export async function getWeekWorkout(
  gymId: string,
  memberId: string
): Promise<GeneratedWorkout | null> {
  const weekStart = getWeekStart(new Date())

  const workout = await prisma.workout.findFirst({
    where: {
      memberId,
      weekStart,
    },
    include: {
      days: {
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { dayIndex: 'asc' },
      },
    },
  })

  if (!workout) return null

  return mapWorkoutToResponse(workout)
}

// ============================================
// WORKOUT TRACKING
// ============================================

/**
 * Log workout exercise completion
 */
export async function logWorkoutExercise(
  gymId: string,
  memberId: string,
  data: {
    workoutExerciseId: string
    sets: {
      setNumber: number
      repsCompleted: number
      weight: number
      completed: boolean
      notes?: string
    }[]
    difficulty?: number
  }
) {
  // Verify workout exercise belongs to member's workout
  const workoutExercise = await prisma.workoutExercise.findFirst({
    where: {
      id: data.workoutExerciseId,
      workoutDay: {
        workout: { memberId },
      },
    },
    include: {
      workoutDay: true,
    },
  })

  if (!workoutExercise) {
    throw new Error('WORKOUT_EXERCISE_NOT_FOUND')
  }

  // Create workout log
  const log = await prisma.workoutLog.create({
    data: {
      memberId,
      exerciseId: workoutExercise.exerciseId,
      totalSets: data.sets.length,
      completedSets: data.sets.filter(s => s.completed).length,
      totalVolume: data.sets.reduce((sum, s) => sum + (s.completed ? s.repsCompleted * s.weight : 0), 0),
      difficulty: data.difficulty,
      exerciseLogs: {
        create: data.sets.map(set => ({
          setNumber: set.setNumber,
          repsCompleted: set.repsCompleted,
          weight: set.weight,
          completed: set.completed,
          notes: set.notes,
          workoutExerciseId: data.workoutExerciseId,
        })),
      },
    },
    include: {
      exerciseLogs: true,
    },
  })

  // Update user state after logging
  await updateUserState(memberId, {
    completedSets: data.sets.filter(s => s.completed).length,
    totalSets: data.sets.length,
    difficulty: data.difficulty,
    exerciseId: workoutExercise.exerciseId,
  })

  return log
}

/**
 * Complete a workout day
 */
export async function completeWorkoutDay(
  gymId: string,
  memberId: string,
  dayIndex: number
) {
  const weekStart = getWeekStart(new Date())

  const workout = await prisma.workout.findFirst({
    where: {
      memberId,
      weekStart,
    },
  })

  if (!workout) {
    throw new Error('WORKOUT_NOT_FOUND')
  }

  return prisma.workoutDay.updateMany({
    where: {
      workoutId: workout.id,
      dayIndex,
    },
    data: {
      completed: true,
      completedAt: new Date(),
    },
  })
}

// ============================================
// HELPERS
// ============================================

/**
 * Get Monday of the week for a date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Map Prisma result to response format
 */
function mapWorkoutToResponse(workout: any): GeneratedWorkout {
  return {
    id: workout.id,
    weekStart: workout.weekStart,
    phase: workout.phase,
    days: workout.days.map((day: any) => ({
      dayIndex: day.dayIndex,
      name: day.name,
      restDay: day.restDay,
      exercises: day.exercises.map((ex: any) => ({
        order: ex.order,
        exerciseId: ex.exerciseId,
        exerciseName: ex.exercise?.name || 'Unknown',
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        restSeconds: ex.restSeconds,
      })),
    })),
  }
}
