export const runtime = 'edge';

import { NextResponse } from 'next/server'

function generateTimeSlots(date: string) {
  const slots = []
  for (let hour = 6; hour < 20; hour += 2) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`
    const endTime = `${(hour + 2).toString().padStart(2, '0')}:00`
    slots.push({
      id: `${date}-${startTime}`,
      startTime,
      endTime,
      available: Math.random() > 0.3,
    })
  }
  return slots
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')

  if (!startDate) {
    return NextResponse.json(
      { success: false, error: 'Missing startDate parameter' },
      { status: 400 }
    )
  }

  const availability = []
  const start = new Date(startDate)

  for (let i = 0; i < 14; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    availability.push({
      date: dateStr,
      slots: generateTimeSlots(dateStr),
    })
  }

  return NextResponse.json({ success: true, data: availability })
}
