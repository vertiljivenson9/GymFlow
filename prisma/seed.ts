// Seed script for GymFlow
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create demo gym
  const gym = await prisma.gym.create({
    data: {
      slug: 'wellness-gym',
      name: 'Wellness Gym Cabarete',
      primaryColor: '#000000',
      phone: '+1 809 123 4567',
      address: 'Calle Principal, Cabarete, RD',
      description: 'Tu gimnasio de confianza en Cabarete',
      plan: 'pro',
      status: 'active',
    },
  })
  console.log('✅ Created gym:', gym.name)

  // 2. Create owner
  const hashedPassword = await bcrypt.hash('password123', 12)
  const owner = await prisma.user.create({
    data: {
      email: 'owner@wellnessgym.com',
      password: hashedPassword,
      name: 'Francis Javier',
      role: 'owner',
      gymId: gym.id,
    },
  })
  console.log('✅ Created owner:', owner.email)

  // 3. Create plans
  const basicPlan = await prisma.plan.create({
    data: {
      name: 'Basic',
      level: 'beginner',
      price: 49,
      duration: 30,
      features: JSON.stringify(['3 días/semana', 'Acceso QR', 'Soporte email']),
      gymId: gym.id,
    },
  })

  const proPlan = await prisma.plan.create({
    data: {
      name: 'Pro',
      level: 'intermediate',
      price: 99,
      duration: 30,
      features: JSON.stringify(['5 días/semana', 'Acceso QR', 'Motor adaptativo', 'Soporte prioritario']),
      gymId: gym.id,
    },
  })

  const elitePlan = await prisma.plan.create({
    data: {
      name: 'Elite',
      level: 'advanced',
      price: 149,
      duration: 30,
      features: JSON.stringify(['7 días/semana', 'Acceso QR', 'Motor adaptativo completo', 'Personal trainer virtual', 'Soporte 24/7']),
      gymId: gym.id,
    },
  })
  console.log('✅ Created 3 plans')

  // 4. Create exercises
  const exercises = [
    // PUSH
    { name: 'Bench Press', type: 'push', difficulty: 2, fatigueImpact: 6, skillRequired: 2, equipment: 'barbell', muscleGroups: ['chest', 'triceps', 'shoulders'] },
    { name: 'Push-ups', type: 'push', difficulty: 1, fatigueImpact: 3, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['chest', 'triceps'] },
    { name: 'Overhead Press', type: 'push', difficulty: 2, fatigueImpact: 6, skillRequired: 2, equipment: 'barbell', muscleGroups: ['shoulders', 'triceps'] },
    { name: 'Incline Dumbbell Press', type: 'push', difficulty: 2, fatigueImpact: 5, skillRequired: 1, equipment: 'dumbbell', muscleGroups: ['upper_chest', 'shoulders'] },
    { name: 'Dips', type: 'push', difficulty: 2, fatigueImpact: 5, skillRequired: 2, equipment: 'bodyweight', muscleGroups: ['triceps', 'chest'] },
    { name: 'Lateral Raises', type: 'push', difficulty: 1, fatigueImpact: 3, skillRequired: 1, equipment: 'dumbbell', muscleGroups: ['shoulders'] },
    
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
    
    // CARDIO
    { name: 'Jumping Jacks', type: 'cardio', difficulty: 1, fatigueImpact: 4, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['full_body'] },
    { name: 'Burpees', type: 'cardio', difficulty: 2, fatigueImpact: 7, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['full_body'] },
    { name: 'Mountain Climbers', type: 'cardio', difficulty: 1, fatigueImpact: 5, skillRequired: 1, equipment: 'bodyweight', muscleGroups: ['core', 'shoulders'] },
  ]

  for (const ex of exercises) {
    await prisma.exercise.create({
      data: {
        ...ex,
        muscleGroups: JSON.stringify(ex.muscleGroups),
        gymId: gym.id,
      },
    })
  }
  console.log('✅ Created', exercises.length, 'exercises')

  // 5. Create templates
  const beginnerTemplate = await prisma.template.create({
    data: {
      name: 'Beginner Full Body',
      description: '3 días full body para principiantes',
      level: 'beginner',
      goal: 'general',
      daysPerWeek: 3,
      gymId: gym.id,
      days: {
        create: [
          {
            dayIndex: 0,
            name: 'Full Body A',
            blocks: {
              create: [
                { blockType: 'push', blockOrder: 1, sets: 3, reps: '8-12', restSeconds: 90 },
                { blockType: 'pull', blockOrder: 2, sets: 3, reps: '8-12', restSeconds: 90 },
                { blockType: 'legs', blockOrder: 3, sets: 3, reps: '8-12', restSeconds: 90 },
                { blockType: 'core', blockOrder: 4, sets: 3, reps: '12-15', restSeconds: 60 },
              ],
            },
          },
          {
            dayIndex: 2,
            name: 'Full Body B',
            blocks: {
              create: [
                { blockType: 'legs', blockOrder: 1, sets: 3, reps: '8-12', restSeconds: 90 },
                { blockType: 'push', blockOrder: 2, sets: 3, reps: '8-12', restSeconds: 90 },
                { blockType: 'pull', blockOrder: 3, sets: 3, reps: '8-12', restSeconds: 90 },
                { blockType: 'core', blockOrder: 4, sets: 3, reps: '12-15', restSeconds: 60 },
              ],
            },
          },
          {
            dayIndex: 4,
            name: 'Full Body C',
            restDay: false,
            blocks: {
              create: [
                { blockType: 'pull', blockOrder: 1, sets: 3, reps: '8-12', restSeconds: 90 },
                { blockType: 'legs', blockOrder: 2, sets: 3, reps: '8-12', restSeconds: 90 },
                { blockType: 'push', blockOrder: 3, sets: 3, reps: '8-12', restSeconds: 90 },
                { blockType: 'core', blockOrder: 4, sets: 3, reps: '12-15', restSeconds: 60 },
              ],
            },
          },
        ],
      },
    },
  })

  const intermediateTemplate = await prisma.template.create({
    data: {
      name: 'Upper/Lower Split',
      description: '4 días upper/lower para intermedios',
      level: 'intermediate',
      goal: 'hypertrophy',
      daysPerWeek: 4,
      gymId: gym.id,
      days: {
        create: [
          {
            dayIndex: 0,
            name: 'Upper A',
            blocks: {
              create: [
                { blockType: 'push', blockOrder: 1, sets: 4, reps: '6-8', restSeconds: 120 },
                { blockType: 'push', blockOrder: 2, sets: 3, reps: '8-12', restSeconds: 90 },
                { blockType: 'pull', blockOrder: 3, sets: 4, reps: '6-8', restSeconds: 120 },
                { blockType: 'pull', blockOrder: 4, sets: 3, reps: '8-12', restSeconds: 90 },
              ],
            },
          },
          {
            dayIndex: 1,
            name: 'Lower A',
            blocks: {
              create: [
                { blockType: 'legs', blockOrder: 1, sets: 4, reps: '6-8', restSeconds: 120 },
                { blockType: 'legs', blockOrder: 2, sets: 3, reps: '8-12', restSeconds: 90 },
                { blockType: 'core', blockOrder: 3, sets: 3, reps: '12-15', restSeconds: 60 },
              ],
            },
          },
          {
            dayIndex: 3,
            name: 'Upper B',
            blocks: {
              create: [
                { blockType: 'pull', blockOrder: 1, sets: 4, reps: '6-8', restSeconds: 120 },
                { blockType: 'pull', blockOrder: 2, sets: 3, reps: '8-12', restSeconds: 90 },
                { blockType: 'push', blockOrder: 3, sets: 4, reps: '6-8', restSeconds: 120 },
                { blockType: 'push', blockOrder: 4, sets: 3, reps: '8-12', restSeconds: 90 },
              ],
            },
          },
          {
            dayIndex: 4,
            name: 'Lower B',
            blocks: {
              create: [
                { blockType: 'legs', blockOrder: 1, sets: 4, reps: '8-12', restSeconds: 90 },
                { blockType: 'legs', blockOrder: 2, sets: 4, reps: '8-12', restSeconds: 90 },
                { blockType: 'core', blockOrder: 3, sets: 4, reps: '12-15', restSeconds: 60 },
              ],
            },
          },
        ],
      },
    },
  })
  console.log('✅ Created 2 templates')

  // 6. Create rules
  await prisma.planTemplateRule.createMany({
    data: [
      { gymId: gym.id, level: 'beginner', templateId: beginnerTemplate.id },
      { gymId: gym.id, level: 'intermediate', templateId: intermediateTemplate.id },
      { gymId: gym.id, level: 'advanced', templateId: intermediateTemplate.id },
    ],
  })
  console.log('✅ Created rules')

  // 7. Create demo members
  const members = [
    { name: 'María García', level: 'beginner', qrCode: 'GF-MARIA01' },
    { name: 'Carlos Rodríguez', level: 'intermediate', qrCode: 'GF-CARLOS1' },
    { name: 'Ana Martínez', level: 'beginner', qrCode: 'GF-ANA001' },
  ]

  for (const m of members) {
    const member = await prisma.member.create({
      data: {
        name: m.name,
        level: m.level,
        qrCode: m.qrCode,
        gymId: gym.id,
      },
    })

    // Create membership
    await prisma.membership.create({
      data: {
        memberId: member.id,
        planId: m.level === 'beginner' ? basicPlan.id : proPlan.id,
        status: 'active',
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    // Create user state
    await prisma.userState.create({
      data: {
        memberId: member.id,
        level: m.level,
      },
    })
  }
  console.log('✅ Created 3 demo members')

  // 8. Create super admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@gymflow.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'owner',
      gymId: gym.id, // For now, associated with demo gym
    },
  })
  console.log('✅ Created super admin:', superAdmin.email)

  console.log('\n🎉 Seeding complete!')
  console.log('\n📋 Demo credentials:')
  console.log('  Owner: owner@wellnessgym.com / password123')
  console.log('  Admin: admin@gymflow.com / password123')
  console.log('\n📋 Demo QR codes:')
  console.log('  GF-MARIA01 (beginner)')
  console.log('  GF-CARLOS1 (intermediate)')
  console.log('  GF-ANA001 (beginner)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
