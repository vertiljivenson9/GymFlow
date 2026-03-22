export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { register } from '@/lib/edge-auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, gymId, role } = body

    if (!email || !password || !gymId) {
      return NextResponse.json({ error: 'Email, password and gymId required' }, { status: 400 })
    }

    const result = await register({ email, password, name, gymId, role })

    return NextResponse.json({
      user: result.user,
      token: result.token,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json({ error: error.message || 'Failed to register' }, { status: 400 })
  }
}
