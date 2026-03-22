// Elite Training Engine - Adaptive System
// Pure functions for scoring, phases, and progression

import { prisma } from '../db'

// ============================================
// TYPES
// ============================================

export interface UserState {
  id: string
  fatigueScore: number      // 0-100
  consistencyScore: number  // 0-100
  performanceScore: number  // 0-100
  currentPhase: 'adaptation' | 'progression' | 'deload'
  phaseStartedAt: Date
  currentStreak: number
  longestStreak: number
  lastWorkoutAt: Date | null
  workoutsThisWeek: number
  workoutsLastWeek: number
  level: 'beginner' | 'intermediate' | 'advanced'
  levelProgress: number     // 0-100
  weeksAtCurrentLevel: number
  memberId: string
}

export interface PhaseConfig {
  phase: 'adaptation' | 'progression' | 'deload'
  volumeIncrease?: number
  intensityModifier?: number
  deloadFactor?: number
}

export interface WorkoutFeedback {
  completedSets: number
  totalSets: number
  difficulty?: number  // RPE 1-10
  exerciseId?: string
}

// ============================================
// SCORING FUNCTIONS (Pure)
// ============================================

/**
 * Calculate performance score delta
 * +10 for completing all sets
 * +15 for increasing weight
 * -10 for failed sets
 */
export function calculatePerformanceDelta(
  completedSets: number,
  totalSets: number,
  increasedWeight: boolean = false,
  failedSets: number = 0
): number {
  let delta = 0

  // Completion bonus
  if (completedSets === totalSets && totalSets > 0) {
    delta += 10
  }

  // Weight increase bonus
  if (increasedWeight) {
    delta += 15
  }

  // Failed sets penalty
  delta -= failedSets * 5

  return delta
}

/**
 * Calculate consistency score delta
 * +10 per workout completed
 * -15 if missed session
 */
export function calculateConsistencyDelta(
  workedOut: boolean,
  missedSession: boolean = false
): number {
  let delta = 0

  if (workedOut) {
    delta += 10
  }

  if (missedSession) {
    delta -= 15
  }

  return delta
}

/**
 * Calculate fatigue score delta
 * +10 per intense workout
 * +5 if high volume
 * -15 on rest day
 */
export function calculateFatigueDelta(
  workoutIntensity: 'low' | 'medium' | 'high',
  volume: 'low' | 'medium' | 'high',
  isRestDay: boolean = false
): number {
  let delta = 0

  if (isRestDay) {
    return -15
  }

  // Intensity impact
  if (workoutIntensity === 'high') delta += 10
  else if (workoutIntensity === 'medium') delta += 5

  // Volume impact
  if (volume === 'high') delta += 5
  else if (volume === 'medium') delta += 2

  return delta
}

/**
 * Clamp score to valid range
 */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score))
}

// ============================================
// PHASE DETERMINATION (Pure)
// ============================================

/**
 * Determine optimal phase based on scores
 */
export function determinePhase(state: Partial<UserState>): PhaseConfig {
  const { fatigueScore = 0, performanceScore = 50, consistencyScore = 50 } = state

  // High fatigue → deload
  if (fatigueScore > 80) {
    return {
      phase: 'deload',
      deloadFactor: 0.7,
      intensityModifier: 0.8,
    }
  }

  // Good performance and consistency → progression
  if (performanceScore > 70 && consistencyScore > 60) {
    return {
      phase: 'progression',
      volumeIncrease: 1,
      intensityModifier: 1.05,
    }
  }

  // New user or low performance → adaptation
  if (performanceScore < 40 || consistencyScore < 40) {
    return {
      phase: 'adaptation',
      intensityModifier: 0.9,
    }
  }

  // Default to current phase or adaptation
  return {
    phase: (state.currentPhase as 'adaptation' | 'progression' | 'deload') || 'adaptation',
  }
}

// ============================================
// PROGRESSION RULES (Pure)
// ============================================

/**
 * Calculate weight progression
 * +5% if completed all sets easy
 * -5% if failed last session
 */
export function calculateWeightProgression(
  completedAllSets: boolean,
  feltEasy: boolean,
  failedLastSession: boolean,
  currentWeight: number
): number {
  if (failedLastSession) {
    return currentWeight * 0.95
  }

  if (completedAllSets && feltEasy) {
    return currentWeight * 1.05
  }

  return currentWeight
}

/**
 * Determine if should increase training days
 */
export function shouldIncreaseTrainingDays(state: UserState): boolean {
  return (
    state.consistencyScore > 70 &&
    state.performanceScore > 70 &&
    state.currentStreak >= 4 &&
    state.level !== 'beginner'
  )
}

/**
 * Determine if level should increase
 */
export function shouldLevelUp(state: UserState): boolean {
  return (
    state.consistencyScore > 70 &&
    state.performanceScore > 70 &&
    state.weeksAtCurrentLevel >= 4
  )
}

/**
 * Determine if force deload is needed
 */
export function needsDeload(state: UserState): boolean {
  return state.fatigueScore > 85
}

// ============================================
// EXERCISE INTELLIGENCE (Pure)
// ============================================

export interface ExerciseConstraints {
  maxDifficulty: number
  maxSkillRequired: number
  maxFatigueImpact: number
  excludeTypes?: string[]
}

/**
 * Get exercise constraints based on user state
 */
export function getExerciseConstraints(state: UserState): ExerciseConstraints {
  const constraints: ExerciseConstraints = {
    maxDifficulty: 5,
    maxSkillRequired: 5,
    maxFatigueImpact: 10,
  }

  // Beginner constraints
  if (state.level === 'beginner') {
    constraints.maxDifficulty = 2
    constraints.maxSkillRequired = 2
  }

  // Intermediate constraints
  if (state.level === 'intermediate') {
    constraints.maxDifficulty = 4
    constraints.maxSkillRequired = 3
  }

  // Deload constraints
  if (state.currentPhase === 'deload' || state.fatigueScore > 70) {
    constraints.maxFatigueImpact = 5
  }

  return constraints
}

/**
 * Should swap exercise (failed 3 times)
 */
export function shouldSwapExercise(failCount: number): boolean {
  return failCount >= 3
}

// ============================================
// STATE MANAGEMENT (Database)
// ============================================

/**
 * Get or create user state
 */
export async function getUserState(memberId: string): Promise<UserState> {
  let state = await prisma.userState.findUnique({
    where: { memberId },
  })

  if (!state) {
    state = await prisma.userState.create({
      data: {
        memberId,
        fatigueScore: 0,
        consistencyScore: 50,
        performanceScore: 50,
        currentPhase: 'adaptation',
        level: 'beginner',
      },
    })
  }

  return state as UserState
}

/**
 * Update user state after workout
 */
export async function updateUserState(
  memberId: string,
  feedback: WorkoutFeedback
): Promise<UserState> {
  const currentState = await getUserState(memberId)

  // Calculate intensity and volume from feedback
  const completionRate = feedback.totalSets > 0 
    ? feedback.completedSets / feedback.totalSets 
    : 0
  
  const intensity: 'low' | 'medium' | 'high' = 
    feedback.difficulty && feedback.difficulty >= 8 ? 'high' :
    feedback.difficulty && feedback.difficulty >= 5 ? 'medium' : 'low'
  
  const volume: 'low' | 'medium' | 'high' = 
    feedback.totalSets >= 20 ? 'high' :
    feedback.totalSets >= 12 ? 'medium' : 'low'

  // Calculate deltas
  const performanceDelta = calculatePerformanceDelta(
    feedback.completedSets,
    feedback.totalSets,
    false, // increasedWeight - would need to check previous
    feedback.totalSets - feedback.completedSets
  )

  const fatigueDelta = calculateFatigueDelta(intensity, volume, false)

  // Update scores
  const newPerformanceScore = clampScore(currentState.performanceScore + performanceDelta)
  const newFatigueScore = clampScore(currentState.fatigueScore + fatigueDelta)
  const newConsistencyScore = clampScore(currentState.consistencyScore + 10)

  // Determine new phase
  const newPhaseConfig = determinePhase({
    ...currentState,
    performanceScore: newPerformanceScore,
    fatigueScore: newFatigueScore,
    consistencyScore: newConsistencyScore,
  })

  // Update streak
  const today = new Date()
  const lastWorkout = currentState.lastWorkoutAt
  let newStreak = currentState.currentStreak

  if (lastWorkout) {
    const daysSinceLastWorkout = Math.floor(
      (today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceLastWorkout <= 2) {
      newStreak += 1
    } else {
      newStreak = 1
    }
  } else {
    newStreak = 1
  }

  // Update in database
  const updated = await prisma.userState.update({
    where: { memberId },
    data: {
      performanceScore: newPerformanceScore,
      fatigueScore: newFatigueScore,
      consistencyScore: newConsistencyScore,
      currentPhase: newPhaseConfig.phase,
      currentStreak: newStreak,
      longestStreak: Math.max(currentState.longestStreak, newStreak),
      lastWorkoutAt: today,
      workoutsThisWeek: currentState.workoutsThisWeek + 1,
    },
  })

  return updated as UserState
}

/**
 * Apply progression rules and return phase config
 */
export function applyProgressionRules(
  state: UserState | null,
  targetPhase?: string
): PhaseConfig {
  if (!state) {
    return { phase: 'adaptation' }
  }

  // Force target phase if provided
  if (targetPhase) {
    return { phase: targetPhase as 'adaptation' | 'progression' | 'deload' }
  }

  // Check for forced deload
  if (needsDeload(state)) {
    return {
      phase: 'deload',
      deloadFactor: 0.7,
      intensityModifier: 0.8,
    }
  }

  // Check for level up
  if (shouldLevelUp(state)) {
    // This would be handled separately to update the level
    return {
      phase: 'progression',
      volumeIncrease: 1,
    }
  }

  // Return determined phase
  return determinePhase(state)
}

/**
 * Weekly state update (call at end of week)
 */
export async function weeklyStateUpdate(memberId: string): Promise<void> {
  const state = await getUserState(memberId)

  // Reduce fatigue over time
  const newFatigue = clampScore(state.fatigueScore - 20)

  // Check for level progression
  let newLevel = state.level
  let newLevelProgress = state.levelProgress
  let newWeeksAtLevel = state.weeksAtCurrentLevel + 1

  if (shouldLevelUp(state)) {
    if (state.level === 'beginner') {
      newLevel = 'intermediate'
      newLevelProgress = 0
      newWeeksAtLevel = 0
    } else if (state.level === 'intermediate') {
      newLevel = 'advanced'
      newLevelProgress = 0
      newWeeksAtLevel = 0
    }
  } else {
    // Increase level progress
    newLevelProgress = clampScore(state.levelProgress + 25)
  }

  await prisma.userState.update({
    where: { memberId },
    data: {
      fatigueScore: newFatigue,
      workoutsLastWeek: state.workoutsThisWeek,
      workoutsThisWeek: 0,
      level: newLevel,
      levelProgress: newLevelProgress,
      weeksAtCurrentLevel: newWeeksAtLevel,
    },
  })
}
