import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'

const DEFAULT_SERVICES = [
  {
    id: 'pt-001',
    name: 'Personal Training',
    description: 'One-on-one session with a certified trainer.',
    duration: 60,
    price: 75,
    category: 'training',
    active: true,
  },
  {
    id: 'gc-001',
    name: 'Group Strength',
    description: 'High-energy group workout.',
    duration: 45,
    price: 25,
    category: 'class',
    active: true,
  },
  {
    id: 'yw-001',
    name: 'Yoga',
    description: 'Peaceful yoga session.',
    duration: 60,
    price: 20,
    category: 'wellness',
    active: true,
  },
  {
    id: 'mt-001',
    name: 'Sports Massage',
    description: 'Deep tissue massage for recovery.',
    duration: 60,
    price: 90,
    category: 'wellness',
    active: true,
  },
]

export async function GET() {
  const db = await getDb()

  if (!db) {
    return NextResponse.json({ success: true, demo: true, data: DEFAULT_SERVICES })
  }

  try {
    const servicesSnapshot = await db.collection('services').where('active', '==', true).get()

    if (servicesSnapshot.empty) {
      return NextResponse.json({ success: true, data: DEFAULT_SERVICES })
    }

    const services = servicesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ success: true, data: services })
  } catch (error) {
    console.error('Fetch services error:', error)
    return NextResponse.json({ success: true, data: DEFAULT_SERVICES })
  }
}
