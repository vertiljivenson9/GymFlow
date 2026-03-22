import { NextRequest, NextResponse } from 'next/server'
import { login } from '../../../../lib/services/authService'
import { LoginSchema } from '../../../../lib/services/authService'
import { badRequest, unauthorized } from '../../../../lib/middleware/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = LoginSchema.safeParse(body)

    if (!validated.success) {
      return badRequest('Invalid input: ' + validated.error.issues[0].message)
    }

    const result = await login(validated.data.email, validated.data.password)

    if (!result) {
      return unauthorized('Invalid credentials')
    }

    return NextResponse.json({
      user: result.user,
      token: result.token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
