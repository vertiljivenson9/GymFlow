import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

const DEFAULT_SERVICES = [
  {
    id: 'pt-001',
    name: 'Personal Training',
    description: 'One-on-one session with a certified trainer. Customized workout plan tailored to your goals.',
    duration: 60,
    price: 75,
    category: 'training',
    active: true,
  },
  {
    id: 'gc-001',
    name: 'Group Strength',
    description: 'High-energy group workout focusing on strength and conditioning. All fitness levels welcome.',
    duration: 45,
    price: 25,
    category: 'class',
    active: true,
  },
  {
    id: 'yw-001',
    name: 'Sunrise Yoga',
    description: 'Start your day with a peaceful yoga session overlooking the Caribbean. Mats provided.',
    duration: 60,
    price: 20,
    category: 'wellness',
    active: true,
  },
  {
    id: 'mt-001',
    name: 'Sports Massage',
    description: 'Deep tissue massage for recovery and relaxation. Perfect after an intense workout.',
    duration: 60,
    price: 90,
    category: 'wellness',
    active: true,
  },
]

export async function GET() {
  try {
    const servicesSnapshot = await db.collection('services').where('active', '==', true).get()
    
    if (servicesSnapshot.empty) {
      return NextResponse.json({ success: true, data: DEFAULT_SERVICES })
    }

    const services = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ success: true, data: services })
  } catch (error) {
    console.error('Fetch services error:', error)
    return NextResponse.json({ success: true, data: DEFAULT_SERVICES })
  }
}
