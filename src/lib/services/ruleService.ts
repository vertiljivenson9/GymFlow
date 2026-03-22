// RuleService - Plan to Template mapping rules
import { prisma, withGymFilter } from '../db'
import { z } from 'zod'

// ============================================
// TYPES & SCHEMAS
// ============================================

export const CreateRuleSchema = z.object({
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  planId: z.string().optional(), // null = default for level
  templateId: z.string(),
})

export interface RuleWithTemplate {
  id: string
  level: string
  planId: string | null
  template: {
    id: string
    name: string
    level: string
    daysPerWeek: number
  }
}

// ============================================
// RULE CRUD
// ============================================

/**
 * Create a new rule
 */
export async function createRule(
  gymId: string,
  data: z.infer<typeof CreateRuleSchema>
): Promise<RuleWithTemplate | null> {
  // Verify template belongs to gym
  const template = await prisma.template.findFirst({
    where: withGymFilter({ id: data.templateId }, gymId),
  })

  if (!template) return null

  // If planId specified, verify it belongs to gym
  if (data.planId) {
    const plan = await prisma.plan.findFirst({
      where: withGymFilter({ id: data.planId }, gymId),
    })
    if (!plan) return null
  }

  return prisma.planTemplateRule.create({
    data: {
      gymId,
      level: data.level,
      planId: data.planId || null,
      templateId: data.templateId,
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          level: true,
          daysPerWeek: true,
        },
      },
    },
  })
}

/**
 * List all rules for a gym
 */
export async function listRules(gymId: string): Promise<RuleWithTemplate[]> {
  return prisma.planTemplateRule.findMany({
    where: { gymId },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          level: true,
          daysPerWeek: true,
        },
      },
    },
    orderBy: [{ level: 'asc' }, { planId: 'asc' }],
  })
}

/**
 * Delete a rule
 */
export async function deleteRule(gymId: string, ruleId: string): Promise<boolean> {
  const rule = await prisma.planTemplateRule.findFirst({
    where: { id: ruleId, gymId },
  })

  if (!rule) return false

  await prisma.planTemplateRule.delete({ where: { id: ruleId } })
  return true
}

// ============================================
// RULE RESOLUTION (CORE ENGINE)
// ============================================

interface MemberContext {
  level: string
  planId?: string
}

/**
 * Resolve which template to use for a member
 * 
 * Priority:
 * 1. Exact match: planId + level
 * 2. Level match: null planId + level
 * 3. Default: fallback to first available template
 */
export async function resolveTemplate(
  gymId: string,
  member: MemberContext
): Promise<{
  templateId: string
  template: {
    id: string
    name: string
    level: string
    daysPerWeek: number
    days: any[]
  }
} | null> {
  // Try exact match (plan + level)
  if (member.planId) {
    const exactMatch = await prisma.planTemplateRule.findFirst({
      where: {
        gymId,
        planId: member.planId,
        level: member.level,
      },
      include: {
        template: {
          include: {
            days: {
              include: { blocks: { orderBy: { blockOrder: 'asc' } } },
              orderBy: { dayIndex: 'asc' },
            },
          },
        },
      },
    })

    if (exactMatch) {
      return {
        templateId: exactMatch.templateId,
        template: exactMatch.template as any,
      }
    }
  }

  // Try level-only match
  const levelMatch = await prisma.planTemplateRule.findFirst({
    where: {
      gymId,
      planId: null,
      level: member.level,
    },
    include: {
      template: {
        include: {
          days: {
            include: { blocks: { orderBy: { blockOrder: 'asc' } } },
            orderBy: { dayIndex: 'asc' },
          },
        },
      },
    },
  })

  if (levelMatch) {
    return {
      templateId: levelMatch.templateId,
      template: levelMatch.template as any,
    }
  }

  // Fallback: any active template for the gym
  const fallback = await prisma.template.findFirst({
    where: withGymFilter({ active: true, level: member.level }, gymId),
    include: {
      days: {
        include: { blocks: { orderBy: { blockOrder: 'asc' } } },
        orderBy: { dayIndex: 'asc' },
      },
    },
  })

  if (fallback) {
    return {
      templateId: fallback.id,
      template: fallback as any,
    }
  }

  // Ultimate fallback: any active template
  const ultimateFallback = await prisma.template.findFirst({
    where: withGymFilter({ active: true }, gymId),
    include: {
      days: {
        include: { blocks: { orderBy: { blockOrder: 'asc' } } },
        orderBy: { dayIndex: 'asc' },
      },
    },
  })

  if (ultimateFallback) {
    return {
      templateId: ultimateFallback.id,
      template: ultimateFallback as any,
    }
  }

  return null
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Setup default rules for a new gym
 */
export async function setupDefaultRules(gymId: string): Promise<void> {
  // Get all templates for the gym
  const templates = await prisma.template.findMany({
    where: withGymFilter({ active: true }, gymId),
  })

  // Group by level
  const byLevel = templates.reduce((acc, t) => {
    if (!acc[t.level]) acc[t.level] = []
    acc[t.level].push(t)
    return acc
  }, {} as Record<string, typeof templates>)

  // Create rules for each level
  for (const [level, levelTemplates] of Object.entries(byLevel)) {
    if (levelTemplates.length > 0) {
      // Use first template as default for level
      await prisma.planTemplateRule.create({
        data: {
          gymId,
          level,
          templateId: levelTemplates[0].id,
        },
      })
    }
  }
}
