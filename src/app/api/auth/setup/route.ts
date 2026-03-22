import { NextRequest, NextResponse } from 'next/server'
import { setupGym } from '../../../../lib/services/authService'
import { GymSetupSchema } from '../../../../lib/services/authService'
import { badRequest } from '../../../../lib/middleware/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = GymSetupSchema.safeParse(body)

    if (!validated.success) {
      return badRequest('Invalid input: ' + validated.error.issues[0].message)
    }

    const result = await setupGym(validated.data)

    return NextResponse.json({
      user: result.user,
      token: result.token,
      gym: result.gym,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to setup gym' },
      { status: 400 }
    )
  }
}
