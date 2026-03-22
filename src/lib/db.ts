// Database helper with Prisma client singleton
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ============================================
// MULTI-TENANT HELPERS
// ============================================

/**
 * Wraps a query with gym_id filter
 * CRITICAL: Always use this for tenant isolation
 */
export function withGymFilter<T extends { gymId?: string }>(
  where: T,
  gymId: string
): T & { gymId: string } {
  return {
    ...where,
    gymId,
  }
}

/**
 * Validates gym exists and is active
 */
export async function validateGym(gymId: string): Promise<boolean> {
  const gym = await prisma.gym.findFirst({
    where: {
      id: gymId,
      status: { in: ['trial', 'active'] },
    },
  })
  return !!gym
}

/**
 * Check membership status
 */
export async function checkMembershipStatus(memberId: string): Promise<{
  active: boolean
  membership?: {
    id: string
    status: string
    expiresAt: Date
    plan: { name: string; level: string }
  }
}> {
  const membership = await prisma.membership.findFirst({
    where: {
      memberId,
      status: 'active',
      expiresAt: { gt: new Date() },
    },
    include: {
      plan: true,
    },
    orderBy: {
      expiresAt: 'desc',
    },
  })

  return {
    active: !!membership,
    membership: membership
      ? {
          id: membership.id,
          status: membership.status,
          expiresAt: membership.expiresAt,
          plan: {
            name: membership.plan.name,
            level: membership.plan.level,
          },
        }
      : undefined,
  }
}

// ============================================
// QUERY HELPERS
// ============================================

/**
 * Paginated query helper
 */
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    perPage: number
    totalPages: number
    totalItems: number
  }
}

export async function paginate<T>(
  model: {
    findMany: (args: any) => Promise<T[]>
    count: (args: any) => Promise<number>
  },
  args: {
    where?: any
    page?: number
    perPage?: number
    orderBy?: any
    include?: any
  }
): Promise<PaginatedResult<T>> {
  const page = args.page || 1
  const perPage = args.perPage || 20
  const skip = (page - 1) * perPage

  const [data, totalItems] = await Promise.all([
    model.findMany({
      where: args.where,
      skip,
      take: perPage,
      orderBy: args.orderBy,
      include: args.include,
    }),
    model.count({ where: args.where }),
  ])

  return {
    data,
    pagination: {
      page,
      perPage,
      totalPages: Math.ceil(totalItems / perPage),
      totalItems,
    },
  }
}

// ============================================
// TRANSACTION HELPER
// ============================================

export async function withTransaction<T>(
  fn: (tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn)
}
