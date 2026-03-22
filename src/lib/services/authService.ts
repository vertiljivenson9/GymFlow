// AuthService - JWT-based authentication with multi-tenant support
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { z } from 'zod'

const prisma = new PrismaClient()

// JWT Secret - In production, use environment variable
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gymflow-super-secret-key-change-in-production'
)

const JWT_EXPIRES_IN = '7d'

// ============================================
// TYPES & SCHEMAS
// ============================================

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2).optional(),
  gymId: z.string(),
  role: z.enum(['owner', 'trainer', 'staff', 'member']).default('member'),
})

export const GymSetupSchema = z.object({
  gymName: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
})

export interface JwtPayload {
  userId: string
  gymId: string
  role: 'owner' | 'trainer' | 'staff' | 'member'
}

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: string
  gymId: string
  gym?: {
    id: string
    name: string
    slug: string
    logo: string | null
    primaryColor: string
  }
}

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate JWT token
 */
export async function generateToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JwtPayload
  } catch {
    return null
  }
}

/**
 * Login user with email and password
 */
export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      gym: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          primaryColor: true,
        },
      },
    },
  })

  if (!user || !user.active) {
    return null
  }

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return null
  }

  const token = await generateToken({
    userId: user.id,
    gymId: user.gymId,
    role: user.role as JwtPayload['role'],
  })

  // Create session
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      gymId: user.gymId,
      gym: user.gym,
    },
    token,
  }
}

/**
 * Register new user
 */
export async function register(data: z.infer<typeof RegisterSchema>): Promise<{ user: AuthUser; token: string }> {
  // Check if email exists
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existing) {
    throw new Error('Email already registered')
  }

  // Verify gym exists
  const gym = await prisma.gym.findUnique({
    where: { id: data.gymId },
  })

  if (!gym) {
    throw new Error('Gym not found')
  }

  const hashedPassword = await hashPassword(data.password)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
      gymId: data.gymId,
    },
    include: {
      gym: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          primaryColor: true,
        },
      },
    },
  })

  const token = await generateToken({
    userId: user.id,
    gymId: user.gymId,
    role: user.role as JwtPayload['role'],
  })

  // Create session
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      gymId: user.gymId,
      gym: user.gym,
    },
    token,
  }
}

/**
 * Setup new gym with owner account
 */
export async function setupGym(data: z.infer<typeof GymSetupSchema>): Promise<{ user: AuthUser; token: string; gym: { id: string; slug: string; name: string } }> {
  // Check if slug exists
  const existingSlug = await prisma.gym.findUnique({
    where: { slug: data.slug },
  })

  if (existingSlug) {
    throw new Error('Slug already in use')
  }

  // Check if email exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    throw new Error('Email already registered')
  }

  const hashedPassword = await hashPassword(data.password)

  // Create gym and owner in transaction
  const result = await prisma.$transaction(async (tx) => {
    const gym = await tx.gym.create({
      data: {
        name: data.gymName,
        slug: data.slug,
        plan: 'basic',
        status: 'trial',
      },
    })

    const user = await tx.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'owner',
        gymId: gym.id,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
          },
        },
      },
    })

    return { gym, user }
  })

  const token = await generateToken({
    userId: result.user.id,
    gymId: result.user.gymId,
    role: 'owner',
  })

  // Create session
  await prisma.session.create({
    data: {
      userId: result.user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      gymId: result.user.gymId,
      gym: result.user.gym,
    },
    token,
    gym: {
      id: result.gym.id,
      slug: result.gym.slug,
      name: result.gym.name,
    },
  }
}

/**
 * Logout user (invalidate session)
 */
export async function logout(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token },
  })
}

/**
 * Get user from token
 */
export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  const payload = await verifyToken(token)
  if (!payload) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          gym: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              primaryColor: true,
            },
          },
        },
      },
    },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    gymId: session.user.gymId,
    gym: session.user.gym,
  }
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Middleware helper - Extract and verify token from headers
 */
export async function extractUser(authHeader: string | null): Promise<AuthUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  return getUserFromToken(token)
}
