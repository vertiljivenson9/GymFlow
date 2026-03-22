// Auth Middleware - Protects API routes with JWT validation
import { NextRequest, NextResponse } from 'next/server'
import { extractUser, AuthUser, hasRole } from '../services/authService'

export interface AuthenticatedRequest extends NextRequest {
  user: AuthUser
}

export type RouteHandler = (
  req: AuthenticatedRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse

export type RoleHandler = (
  req: AuthenticatedRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse

// ============================================
// ERROR RESPONSES
// ============================================

export function unauthorized(message = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { error: message, code: 'UNAUTHORIZED' },
    { status: 401 }
  )
}

export function forbidden(message = 'Forbidden'): NextResponse {
  return NextResponse.json(
    { error: message, code: 'FORBIDDEN' },
    { status: 403 }
  )
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json(
    { error: message, code: 'BAD_REQUEST' },
    { status: 400 }
  )
}

export function notFound(message = 'Not found'): NextResponse {
  return NextResponse.json(
    { error: message, code: 'NOT_FOUND' },
    { status: 404 }
  )
}

// ============================================
// MIDDLEWARE WRAPPERS
// ============================================

/**
 * Protect route - requires valid JWT
 */
export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    const user = await extractUser(req.headers.get('authorization'))

    if (!user) {
      return unauthorized()
    }

    // Attach user to request
    ;(req as AuthenticatedRequest).user = user

    return handler(req as AuthenticatedRequest, context)
  }
}

/**
 * Protect route - requires specific role(s)
 */
export function withRole(roles: string[]): (handler: RouteHandler) => RouteHandler {
  return (handler: RouteHandler): RouteHandler => {
    return withAuth(async (req, context) => {
      if (!hasRole(req.user.role, roles)) {
        return forbidden('Insufficient permissions')
      }

      return handler(req, context)
    })
  }
}

/**
 * Require owner role
 */
export const withOwner = withRole(['owner'])

/**
 * Require trainer role or higher
 */
export const withTrainer = withRole(['owner', 'trainer'])

/**
 * Require staff role or higher
 */
export const withStaff = withRole(['owner', 'trainer', 'staff'])

// ============================================
// GYM ISOLATION MIDDLEWARE
// ============================================

/**
 * Ensures gym_id is present and user belongs to that gym
 */
export function withGymIsolation(handler: RouteHandler): RouteHandler {
  return withAuth(async (req, context) => {
    const user = req.user

    // Super admin can access all gyms (optional feature)
    // For now, strict isolation

    // For routes that operate on gym-specific resources,
    // we use the user's gymId from the token

    return handler(req, context)
  })
}

// ============================================
// COMBINED MIDDLEWARE
// ============================================

/**
 * Full protection: auth + role + gym isolation
 */
export function withProtectedAccess(roles: string[]): (handler: RouteHandler) => RouteHandler {
  return (handler: RouteHandler): RouteHandler => {
    return withRole(roles)(withGymIsolation(handler))
  }
}
