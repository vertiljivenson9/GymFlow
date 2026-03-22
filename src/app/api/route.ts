import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    name: 'GymFlow API',
    version: '1.0.0',
    endpoints: {
      auth: ['/api/auth/login', '/api/auth/register', '/api/auth/setup'],
      gyms: ['/api/gyms'],
      bookings: ['/api/bookings'],
      services: ['/api/services'],
      availability: ['/api/availability'],
      workouts: ['/api/workouts/generate', '/api/workouts/today', '/api/workouts/log'],
      members: ['/api/members/qr'],
    }
  })
}
