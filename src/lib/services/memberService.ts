// MemberService - Member management
import { prisma, withGymFilter, checkMembershipStatus } from '../db'
import { z } from 'zod'
import { nanoid } from 'nanoid'

// Simple ID generator if nanoid not available
function generateId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ============================================
// TYPES & SCHEMAS
// ============================================

export const CreateMemberSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
})

export const UpdateMemberSchema = CreateMemberSchema.partial()

export const CreateMembershipSchema = z.object({
  planId: z.string(),
  startsAt: z.date().optional(),
})

export interface MemberWithMembership {
  id: string
  name: string
  phone: string | null
  email: string | null
  qrCode: string
  level: string
  gymId: string
  memberships: {
    id: string
    status: string
    expiresAt: Date
    plan: {
      id: string
      name: string
      level: string
    }
  }[]
}

// ============================================
// MEMBER CRUD
// ============================================

/**
 * Create a new member
 */
export async function createMember(
  gymId: string,
  data: z.infer<typeof CreateMemberSchema>
): Promise<MemberWithMembership> {
  const qrCode = `GF-${generateId(8).toUpperCase()}`

  return prisma.member.create({
    data: {
      gymId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      level: data.level,
      qrCode,
    },
    include: {
      memberships: {
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
}

/**
 * Get member by ID
 */
export async function getMember(
  gymId: string,
  memberId: string
): Promise<MemberWithMembership | null> {
  return prisma.member.findFirst({
    where: withGymFilter({ id: memberId }, gymId),
    include: {
      memberships: {
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
}

/**
 * Get member by QR code
 * Used for QR access (no login required)
 */
export async function getMemberByQR(
  gymId: string,
  qrCode: string
): Promise<MemberWithMembership | null> {
  return prisma.member.findFirst({
    where: {
      qrCode,
      gymId,
    },
    include: {
      memberships: {
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
}

/**
 * List members with filters
 */
export async function listMembers(
  gymId: string,
  filters?: {
    level?: string
    active?: boolean
  }
): Promise<MemberWithMembership[]> {
  return prisma.member.findMany({
    where: withGymFilter({
      ...(filters?.level && { level: filters.level }),
    }, gymId),
    include: {
      memberships: {
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  })
}

/**
 * Update member
 */
export async function updateMember(
  gymId: string,
  memberId: string,
  data: z.infer<typeof UpdateMemberSchema>
): Promise<MemberWithMembership | null> {
  const existing = await getMember(gymId, memberId)
  if (!existing) return null

  return prisma.member.update({
    where: { id: memberId },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      level: data.level,
    },
    include: {
      memberships: {
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
}

/**
 * Delete member
 */
export async function deleteMember(gymId: string, memberId: string): Promise<boolean> {
  const existing = await getMember(gymId, memberId)
  if (!existing) return false

  await prisma.member.delete({ where: { id: memberId } })
  return true
}

// ============================================
// MEMBERSHIP MANAGEMENT
// ============================================

/**
 * Create a membership for a member
 */
export async function createMembership(
  gymId: string,
  memberId: string,
  data: z.infer<typeof CreateMembershipSchema>
) {
  // Verify member belongs to gym
  const member = await getMember(gymId, memberId)
  if (!member) return null

  // Get plan details
  const plan = await prisma.plan.findFirst({
    where: withGymFilter({ id: data.planId }, gymId),
  })

  if (!plan) return null

  const startsAt = data.startsAt || new Date()
  const expiresAt = new Date(startsAt)
  expiresAt.setDate(expiresAt.getDate() + plan.duration)

  return prisma.membership.create({
    data: {
      memberId,
      planId: plan.id,
      status: 'active',
      startsAt,
      expiresAt,
    },
    include: {
      plan: true,
    },
  })
}

/**
 * Check if member has active membership
 */
export async function hasActiveMembership(
  gymId: string,
  memberId: string
): Promise<boolean> {
  const member = await getMember(gymId, memberId)
  if (!member) return false

  const status = await checkMembershipStatus(memberId)
  return status.active
}

/**
 * Get membership status
 */
export async function getMembershipStatus(
  gymId: string,
  memberId: string
) {
  const member = await getMember(gymId, memberId)
  if (!member) return null

  return checkMembershipStatus(memberId)
}

// ============================================
// QR ACCESS
// ============================================

/**
 * Validate QR access and return member if valid
 * This is used for the QR scan entry flow
 */
export async function validateQRAccess(
  gymId: string,
  qrCode: string
): Promise<{
  valid: boolean
  member?: MemberWithMembership
  membership?: {
    active: boolean
    expiresAt?: Date
    planName?: string
  }
  error?: string
}> {
  const member = await getMemberByQR(gymId, qrCode)

  if (!member) {
    return { valid: false, error: 'MEMBER_NOT_FOUND' }
  }

  const status = await checkMembershipStatus(member.id)

  if (!status.active) {
    return {
      valid: false,
      member,
      error: 'MEMBERSHIP_EXPIRED',
      membership: {
        active: false,
        expiresAt: status.membership?.expiresAt,
        planName: status.membership?.plan.name,
      },
    }
  }

  return {
    valid: true,
    member,
    membership: {
      active: true,
      expiresAt: status.membership?.expiresAt,
      planName: status.membership?.plan.name,
    },
  }
}

// ============================================
// MEMBER CONTEXT (for workout generation)
// ============================================

export interface MemberContext {
  id: string
  name: string
  level: string
  gymId: string
  hasActiveMembership: boolean
  planId?: string
  planLevel?: string
}

/**
 * Get member context for workout generation
 */
export async function getMemberContext(
  gymId: string,
  memberId: string
): Promise<MemberContext | null> {
  const member = await getMember(gymId, memberId)
  if (!member) return null

  const status = await checkMembershipStatus(memberId)

  return {
    id: member.id,
    name: member.name,
    level: member.level,
    gymId: member.gymId,
    hasActiveMembership: status.active,
    planId: status.membership?.plan.id,
    planLevel: status.membership?.plan.level,
  }
}
