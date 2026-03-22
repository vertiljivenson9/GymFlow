export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'

const DEFAULT_GYM = {
  id: 'demo-gym',
  slug: 'demo',
  name: 'Demo Gym',
  logo: null,
  primaryColor: '#000000',
  phone: '+1 555 123 4567',
  address: '123 Fitness Street',
  description: 'Your premium fitness destination',
  services: [
    { id: 'pt-001', name: 'Personal Training', duration: 60, price: 75 },
    { id: 'gc-001', name: 'Group Classes', duration: 45, price: 25 },
    { id: 'yw-001', name: 'Yoga', duration: 60, price: 20 },
  ],
  trainers: [
    { id: 't1', name: 'John Smith', role: 'Head Trainer', image: null },
    { id: 't2', name: 'Maria Garcia', role: 'Yoga Instructor', image: null },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const ownerId = searchParams.get('ownerId')

    const db = await getDb()

    if (!db) {
      return NextResponse.json(DEFAULT_GYM)
    }

    if (slug) {
      const snapshot = await db.collection('gyms').where('slug', '==', slug).limit(1).get()

      if (snapshot.empty) {
        return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
      }

      const gymDoc = snapshot.docs[0]
      return NextResponse.json({
        id: gymDoc.id,
        ...gymDoc.data(),
        services: DEFAULT_GYM.services,
        trainers: DEFAULT_GYM.trainers
      })
    }

    if (ownerId) {
      const snapshot = await db.collection('gyms').where('ownerId', '==', ownerId).limit(1).get()

      if (snapshot.empty) {
        return NextResponse.json(null)
      }

      const gymDoc = snapshot.docs[0]
      return NextResponse.json({
        id: gymDoc.id,
        ...gymDoc.data()
      })
    }

    // List all gyms
    const snapshot = await db.collection('gyms').orderBy('createdAt', 'desc').limit(50).get()
    const gyms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(gyms)
  } catch (error) {
    console.error('Error fetching gyms:', error)
    return NextResponse.json(DEFAULT_GYM)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, logo, primaryColor, phone, address, description, ownerId } = body

    const db = await getDb()

    if (!db) {
      return NextResponse.json({
        id: 'demo-gym',
        name,
        slug,
        logo,
        primaryColor: primaryColor || '#000000',
        phone,
        address,
        description,
        demo: true
      }, { status: 201 })
    }

    // Check if slug exists
    const existing = await db.collection('gyms').where('slug', '==', slug).limit(1).get()
    if (!existing.empty) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 400 })
    }

    const gymRef = await db.collection('gyms').add({
      name,
      slug,
      logo,
      primaryColor: primaryColor || '#000000',
      phone,
      address,
      description,
      ownerId,
      plan: 'basic',
      status: 'trial',
      createdAt: new Date().toISOString()
    })

    return NextResponse.json({
      id: gymRef.id,
      name,
      slug,
      logo,
      primaryColor,
      phone,
      address,
      description
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating gym:', error)
    return NextResponse.json({ error: 'Failed to create gym' }, { status: 500 })
  }
}
