import { NextRequest, NextResponse } from 'next/server'
import { setupGym } from '@/lib/edge-auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gymName, slug, email, password, name } = body

    if (!gymName || !slug || !email || !password || !name) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    const result = await setupGym({ gymName, slug, email, password, name })

    return NextResponse.json({
      user: result.user,
      token: result.token,
      gym: result.gym,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: error.message || 'Failed to setup gym' }, { status: 400 })
  }
}
