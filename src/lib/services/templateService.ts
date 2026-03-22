// TemplateService - Workout template management
import { prisma, withGymFilter } from '../db'
import { z } from 'zod'

// ============================================
// TYPES & SCHEMAS
// ============================================

export const CreateTemplateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  goal: z.string().optional(),
  daysPerWeek: z.number().min(1).max(7).default(3),
  days: z.array(z.object({
    dayIndex: z.number().min(0).max(6),
    name: z.string().optional(),
    restDay: z.boolean().default(false),
    blocks: z.array(z.object({
      blockType: z.enum(['push', 'pull', 'legs', 'core', 'cardio', 'mobility']),
      blockOrder: z.number(),
      sets: z.number().min(1).max(10).default(3),
      reps: z.string().default('8-12'),
      restSeconds: z.number().min(0).max(600).default(90),
      notes: z.string().optional(),
    })).optional(),
  })).optional(),
})

export const UpdateTemplateSchema = CreateTemplateSchema.partial()

export interface TemplateWithDays {
  id: string
  name: string
  description: string | null
  level: string
  goal: string | null
  daysPerWeek: number
  days: {
    id: string
    dayIndex: number
    name: string | null
    restDay: boolean
    blocks: {
      id: string
      blockType: string
      blockOrder: number
      sets: number
      reps: string
      restSeconds: number
      notes: string | null
    }[]
  }[]
}

// ============================================
// TEMPLATE CRUD
// ============================================

/**
 * Create a new workout template
 */
export async function createTemplate(
  gymId: string,
  data: z.infer<typeof CreateTemplateSchema>
): Promise<TemplateWithDays> {
  return prisma.template.create({
    data: {
      gymId,
      name: data.name,
      description: data.description,
      level: data.level,
      goal: data.goal,
      daysPerWeek: data.daysPerWeek,
      days: data.days ? {
        create: data.days.map(day => ({
          dayIndex: day.dayIndex,
          name: day.name,
          restDay: day.restDay,
          blocks: day.blocks ? {
            create: day.blocks.map(block => ({
              blockType: block.blockType,
              blockOrder: block.blockOrder,
              sets: block.sets,
              reps: block.reps,
              restSeconds: block.restSeconds,
              notes: block.notes,
            }))
          } : undefined,
        }))
      } : undefined,
    },
    include: {
      days: {
        include: {
          blocks: {
            orderBy: { blockOrder: 'asc' },
          },
        },
        orderBy: { dayIndex: 'asc' },
      },
    },
  })
}

/**
 * Get template by ID
 */
export async function getTemplate(
  gymId: string,
  templateId: string
): Promise<TemplateWithDays | null> {
  return prisma.template.findFirst({
    where: withGymFilter({ id: templateId }, gymId),
    include: {
      days: {
        include: {
          blocks: {
            orderBy: { blockOrder: 'asc' },
          },
        },
        orderBy: { dayIndex: 'asc' },
      },
    },
  })
}

/**
 * List all templates for a gym
 */
export async function listTemplates(
  gymId: string,
  filters?: {
    level?: string
    active?: boolean
  }
): Promise<TemplateWithDays[]> {
  return prisma.template.findMany({
    where: withGymFilter({
      ...(filters?.level && { level: filters.level }),
      ...(filters?.active !== undefined && { active: filters.active }),
    }, gymId),
    include: {
      days: {
        include: {
          blocks: {
            orderBy: { blockOrder: 'asc' },
          },
        },
        orderBy: { dayIndex: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Update template
 */
export async function updateTemplate(
  gymId: string,
  templateId: string,
  data: z.infer<typeof UpdateTemplateSchema>
): Promise<TemplateWithDays | null> {
  // First verify template belongs to gym
  const existing = await getTemplate(gymId, templateId)
  if (!existing) return null

  return prisma.template.update({
    where: { id: templateId },
    data: {
      name: data.name,
      description: data.description,
      level: data.level,
      goal: data.goal,
      daysPerWeek: data.daysPerWeek,
      active: true,
    },
    include: {
      days: {
        include: {
          blocks: {
            orderBy: { blockOrder: 'asc' },
          },
        },
        orderBy: { dayIndex: 'asc' },
      },
    },
  })
}

/**
 * Delete template (soft delete by setting active = false)
 */
export async function deleteTemplate(
  gymId: string,
  templateId: string
): Promise<boolean> {
  const existing = await getTemplate(gymId, templateId)
  if (!existing) return false

  await prisma.template.update({
    where: { id: templateId },
    data: { active: false },
  })

  return true
}

// ============================================
// TEMPLATE DAY MANAGEMENT
// ============================================

/**
 * Add day to template
 */
export async function addTemplateDay(
  gymId: string,
  templateId: string,
  data: {
    dayIndex: number
    name?: string
    restDay?: boolean
  }
) {
  // Verify template belongs to gym
  const template = await getTemplate(gymId, templateId)
  if (!template) return null

  return prisma.templateDay.create({
    data: {
      templateId,
      dayIndex: data.dayIndex,
      name: data.name,
      restDay: data.restDay || false,
    },
    include: {
      blocks: true,
    },
  })
}

/**
 * Add block to template day
 */
export async function addTemplateBlock(
  gymId: string,
  templateDayId: string,
  data: {
    blockType: string
    blockOrder: number
    sets: number
    reps: string
    restSeconds?: number
    notes?: string
  }
) {
  // Verify template day belongs to gym via template
  const templateDay = await prisma.templateDay.findFirst({
    where: {
      id: templateDayId,
      template: { gymId },
    },
  })

  if (!templateDay) return null

  return prisma.templateBlock.create({
    data: {
      templateDayId,
      blockType: data.blockType,
      blockOrder: data.blockOrder,
      sets: data.sets,
      reps: data.reps,
      restSeconds: data.restSeconds || 90,
      notes: data.notes,
    },
  })
}

/**
 * Update template block
 */
export async function updateTemplateBlock(
  gymId: string,
  blockId: string,
  data: Partial<{
    blockType: string
    blockOrder: number
    sets: number
    reps: string
    restSeconds: number
    notes: string
  }>
) {
  const block = await prisma.templateBlock.findFirst({
    where: {
      id: blockId,
      templateDay: {
        template: { gymId },
      },
    },
  })

  if (!block) return null

  return prisma.templateBlock.update({
    where: { id: blockId },
    data,
  })
}

/**
 * Delete template block
 */
export async function deleteTemplateBlock(gymId: string, blockId: string): Promise<boolean> {
  const block = await prisma.templateBlock.findFirst({
    where: {
      id: blockId,
      templateDay: {
        template: { gymId },
      },
    },
  })

  if (!block) return false

  await prisma.templateBlock.delete({ where: { id: blockId } })
  return true
}
