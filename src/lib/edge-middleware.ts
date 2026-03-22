// Lightweight auth middleware for Edge Runtime
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './edge-auth'

export interface AuthenticatedRequest extends NextRequest {
  user: { id: string; email: string; name: string; role: string; gymId: string }
}

export function unauthorized(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message, code: 'UNAUTHORIZED' }, { status: 401 })
}

export function forbidden(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 })
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message, code: 'BAD_REQUEST' }, { status: 400 })
}

export type RouteHandler = (req: AuthenticatedRequest) => Promise<NextResponse> | NextResponse

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req) => {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized()
    }

    const token = authHeader.slice(7)
    const payload = await verifyToken(token)

    if (!payload) {
      return unauthorized()
    }

    ;(req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: '',
      name: '',
      role: payload.role,
      gymId: payload.gymId
    }

    return handler(req as AuthenticatedRequest)
  }
}

export function withRole(roles: string[]): (handler: RouteHandler) => RouteHandler {
  return (handler: RouteHandler): RouteHandler => {
    return withAuth(async (req) => {
      if (!roles.includes(req.user.role)) {
        return forbidden()
      }
      return handler(req)
    })
  }
}

export const withOwner = withRole(['owner'])
export const withTrainer = withRole(['owner', 'trainer'])
