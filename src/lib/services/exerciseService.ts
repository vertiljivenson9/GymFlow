// ExerciseService - Exercise pool management
import { prisma, withGymFilter } from '../db'
import { z } from 'zod'

// ============================================
// TYPES & SCHEMAS
// ============================================

export const CreateExerciseSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['push', 'pull', 'legs', 'core', 'cardio', 'mobility']),
  difficulty: z.number().min(1).max(5).default(1),
  fatigueImpact: z.number().min(1).max(10).default(5),
  skillRequired: z.number().min(1).max(5).default(1),
  equipment: z.string().optional(),
  muscleGroups: z.array(z.string()).optional(),
  instructions: z.string().optional(),
})

export const UpdateExerciseSchema = CreateExerciseSchema.partial()

export interface ExerciseWithMetadata {
  id: string
  name: string
  type: string
  difficulty: number
  fatigueImpact: number
  skillRequired: number
  equipment: string | null
  muscleGroups: string[] | null
  instructions: string | null
  active: boolean
}

// ============================================
// EXERCISE CRUD
// ============================================

/**
 * Create a new exercise
 */
export async function createExercise(
  gymId: string,
  data: z.infer<typeof CreateExerciseSchema>
): Promise<ExerciseWithMetadata> {
  return prisma.exercise.create({
    data: {
      gymId,
      name: data.name,
      type: data.type,
      difficulty: data.difficulty,
      fatigueImpact: data.fatigueImpact,
      skillRequired: data.skillRequired,
      equipment: data.equipment,
      muscleGroups: data.muscleGroups ? JSON.stringify(data.muscleGroups) : null,
      instructions: data.instructions,
    },
  }) as Promise<ExerciseWithMetadata>
}

/**
 * Get exercise by ID
 */
export async function getExercise(
  gymId: string,
  exerciseId: string
): Promise<ExerciseWithMetadata | null> {
  return prisma.exercise.findFirst({
    where: withGymFilter({ id: exerciseId }, gymId),
  }) as Promise<ExerciseWithMetadata | null>
}

/**
 * List exercises with filters
 */
export async function listExercises(
  gymId: string,
  filters?: {
    type?: string
    difficulty?: number
    active?: boolean
  }
): Promise<ExerciseWithMetadata[]> {
  return prisma.exercise.findMany({
    where: withGymFilter({
      ...(filters?.type && { type: filters.type }),
      ...(filters?.difficulty && { difficulty: filters.difficulty }),
      ...(filters?.active !== undefined && { active: filters.active }),
    }, gymId),
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  }) as Promise<ExerciseWithMetadata[]>
}

/**
 * Update exercise
 */
export async function updateExercise(
  gymId: string,
  exerciseId: string,
  data: z.infer<typeof UpdateExerciseSchema>
): Promise<ExerciseWithMetadata | null> {
  const existing = await getExercise(gymId, exerciseId)
  if (!existing) return null

  return prisma.exercise.update({
    where: { id: exerciseId },
    data: {
      name: data.name,
      type: data.type,
      difficulty: data.difficulty,
      fatigueImpact: data.fatigueImpact,
      skillRequired: data.skillRequired,
      equipment: data.equipment,
      muscleGroups: data.muscleGroups ? JSON.stringify(data.muscleGroups) : undefined,
      instructions: data.instructions,
    },
  }) as Promise<ExerciseWithMetadata>
}

/**
 * Delete exercise (soft delete)
 */
export async function deleteExercise(
  gymId: string,
  exerciseId: string
): Promise<boolean> {
  const existing = await getExercise(gymId, exerciseId)
  if (!existing) return false

  await prisma.exercise.update({
    where: { id: exerciseId },
    data: { active: false },
  })

  return true
}

// ============================================
// EXERCISE SELECTION (ENGINE INTEGRATION)
// ============================================

/**
 * Pick exercise for a block type
 * This is the core function used by the workout generator
 */
export async function pickExercise(
  gymId: string,
  blockType: string,
  options?: {
    excludeIds?: string[]
    maxDifficulty?: number
    maxFatigueImpact?: number
    maxSkillRequired?: number
  }
): Promise<ExerciseWithMetadata | null> {
  const where: any = withGymFilter({
    type: blockType,
    active: true,
  }, gymId)

  // Apply exclusions
  if (options?.excludeIds?.length) {
    where.id = { notIn: options.excludeIds }
  }

  // Apply difficulty filter (for beginner/intermediate)
  if (options?.maxDifficulty) {
    where.difficulty = { lte: options.maxDifficulty }
  }

  // Apply skill filter
  if (options?.maxSkillRequired) {
    where.skillRequired = { lte: options.maxSkillRequired }
  }

  // Apply fatigue filter (for deload phases)
  if (options?.maxFatigueImpact) {
    where.fatigueImpact = { lte: options.maxFatigueImpact }
  }

  // Random selection from matching exercises
  const exercises = await prisma.exercise.findMany({ where })

  if (exercises.length === 0) return null

  // For determinism in tests, we could use a seed
  // For now, random selection
  const randomIndex = Math.floor(Math.random() * exercises.length)
  return exercises[randomIndex] as ExerciseWithMetadata
}

/**
 * Pick multiple exercises for a block type
 */
export async function pickExercises(
  gymId: string,
  blockType: string,
  count: number,
  options?: Parameters<typeof pickExercise>[2]
): Promise<ExerciseWithMetadata[]> {
  const result: ExerciseWithMetadata[] = []
  const excludeIds: string[] = options?.excludeIds || []

  for (let i = 0; i < count; i++) {
    const exercise = await pickExercise(gymId, blockType, {
      ...options,
      excludeIds,
    })

    if (!exercise) break

    result.push(exercise)
    excludeIds.push(exercise.id)
  }

  return result
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Seed default exercises for a new gym
 */
export async function seedDefaultExercises(gymId: string): Promise<void> {
  const defaultExercises = [
    // PUSH
    { name: 'Bench Press', type: 'push', difficulty: 2, fatigueImpact: 6, skillRequired: 2, equipment: 'barbell', muscleGroups: ['chest', 'triceps', 'shoulders'] },
    { name: 'Push-ups', type: 'push', difficulty: 1, fatigueImpact: 3, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['chest', 'triceps'] },
    { name: 'Overhead Press', type: 'push', difficulty: 2, fatigueImpact: 6, skillRequired: 2, equipment: 'barbell', muscleGroups: ['shoulders', 'triceps'] },
    { name: 'Dumbbell Flyes', type: 'push', difficulty: 1, fatigueImpact: 4, skillRequired: 1, equipment: 'dumbbell', muscleGroups: ['chest'] },
    { name: 'Incline Bench Press', type: 'push', difficulty: 2, fatigueImpact: 6, skillRequired: 2, equipment: 'barbell', muscleGroups: ['chest', 'shoulders'] },
    { name: 'Dips', type: 'push', difficulty: 2, fatigueImpact: 5, skillRequired: 2, equipment: 'bodyweight', muscleGroups: ['triceps', 'chest'] },
    
    // PULL
    { name: 'Deadlift', type: 'pull', difficulty: 3, fatigueImpact: 8, skillRequired: 3, equipment: 'barbell', muscleGroups: ['back', 'glutes', 'hamstrings'] },
    { name: 'Pull-ups', type: 'pull', difficulty: 2, fatigueImpact: 5, skillRequired: 2, equipment: 'bodyweight', muscleGroups: ['back', 'biceps'] },
    { name: 'Barbell Rows', type: 'pull', difficulty: 2, fatigueImpact: 6, skillRequired: 2, equipment: 'barbell', muscleGroups: ['back', 'biceps'] },
    { name: 'Lat Pulldown', type: 'pull', difficulty: 1, fatigueImpact: 4, skillRequired: 1, equipment: 'cable', muscleGroups: ['back', 'biceps'] },
    { name: 'Face Pulls', type: 'pull', difficulty: 1, fatigueImpact: 3, skillRequired: 1, equipment: 'cable', muscleGroups: ['rear_delts', 'traps'] },
    { name: 'Bicep Curls', type: 'pull', difficulty: 1, fatigueImpact: 3, skillRequired: 1, equipment: 'dumbbell', muscleGroups: ['biceps'] },
    
    // LEGS
    { name: 'Squats', type: 'legs', difficulty: 2, fatigueImpact: 8, skillRequired: 2, equipment: 'barbell', muscleGroups: ['quads', 'glutes', 'hamstrings'] },
    { name: 'Leg Press', type: 'legs', difficulty: 1, fatigueImpact: 6, skillRequired: 1, equipment: 'machine', muscleGroups: ['quads', 'glutes'] },
    { name: 'Lunges', type: 'legs', difficulty: 2, fatigueImpact: 6, skillRequired: 2, equipment: 'bodyweight', muscleGroups: ['quads', 'glutes'] },
    { name: 'Romanian Deadlift', type: 'legs', difficulty: 2, fatigueImpact: 7, skillRequired: 2, equipment: 'barbell', muscleGroups: ['hamstrings', 'glutes'] },
    { name: 'Leg Curls', type: 'legs', difficulty: 1, fatigueImpact: 4, skillRequired: 1, equipment: 'machine', muscleGroups: ['hamstrings'] },
    { name: 'Calf Raises', type: 'legs', difficulty: 1, fatigueImpact: 3, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['calves'] },
    
    // CORE
    { name: 'Plank', type: 'core', difficulty: 1, fatigueImpact: 3, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['abs', 'core'] },
    { name: 'Dead Bug', type: 'core', difficulty: 1, fatigueImpact: 2, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['abs', 'core'] },
    { name: 'Russian Twists', type: 'core', difficulty: 1, fatigueImpact: 3, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['obliques', 'abs'] },
    { name: 'Hanging Leg Raises', type: 'core', difficulty: 2, fatigueImpact: 4, skillRequired: 2, equipment: 'bodyweight', muscleGroups: ['abs', 'hip_flexors'] },
    { name: 'Ab Wheel Rollout', type: 'core', difficulty: 3, fatigueImpact: 5, skillRequired: 3, equipment: 'ab_wheel', muscleGroups: ['abs', 'core'] },
    
    // CARDIO
    { name: 'Jumping Jacks', type: 'cardio', difficulty: 1, fatigueImpact: 4, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['full_body'] },
    { name: 'Burpees', type: 'cardio', difficulty: 2, fatigueImpact: 7, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['full_body'] },
    { name: 'Mountain Climbers', type: 'cardio', difficulty: 1, fatigueImpact: 5, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['core', 'shoulders'] },
    { name: 'Jump Rope', type: 'cardio', difficulty: 1, fatigueImpact: 5, skillRequired: 2, equipment: 'rope', muscleGroups: ['calves', 'shoulders'] },
    
    // MOBILITY
    { name: 'Cat-Cow Stretch', type: 'mobility', difficulty: 1, fatigueImpact: 1, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['spine', 'back'] },
    { name: 'Hip Circles', type: 'mobility', difficulty: 1, fatigueImpact: 1, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['hips'] },
    { name: 'Shoulder Rolls', type: 'mobility', difficulty: 1, fatigueImpact: 1, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['shoulders'] },
    { name: 'World\'s Greatest Stretch', type: 'mobility', difficulty: 1, fatigueImpact: 2, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['hips', 'spine', 'shoulders'] },
  ]

  await prisma.exercise.createMany({
    data: defaultExercises.map(ex => ({
      ...ex,
      gymId,
      muscleGroups: JSON.stringify(ex.muscleGroups),
    })),
  })
}
