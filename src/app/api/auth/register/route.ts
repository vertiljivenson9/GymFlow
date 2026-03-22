import { NextRequest, NextResponse } from 'next/server'
import { register } from '../../../../lib/services/authService'
import { RegisterSchema } from '../../../../lib/services/authService'
import { badRequest } from '../../../../lib/middleware/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = RegisterSchema.safeParse(body)

    if (!validated.success) {
      return badRequest('Invalid input: ' + validated.error.issues[0].message)
    }

    const result = await register(validated.data)

    return NextResponse.json({
      user: result.user,
      token: result.token,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to register' },
      { status: 400 }
    )
  }
}
