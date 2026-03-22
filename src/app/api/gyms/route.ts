import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - List all gyms (for super admin) or get gym by slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const ownerId = searchParams.get('ownerId')

    if (slug) {
      const gym = await prisma.gym.findUnique({
        where: { slug },
        include: {
          services: { where: { active: true } },
          trainers: true,
        },
      })
      
      if (!gym) {
        return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
      }
      
      return NextResponse.json(gym)
    }

    if (ownerId) {
      const gym = await prisma.gym.findUnique({
        where: { ownerId },
        include: {
          services: { where: { active: true } },
          trainers: true,
        },
      })
      
      return NextResponse.json(gym)
    }

    // List all gyms (super admin)
    const gyms = await prisma.gym.findMany({
      include: {
        _count: { select: { members: true, bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(gyms)
  } catch (error) {
    console.error('Error fetching gyms:', error)
    return NextResponse.json({ error: 'Failed to fetch gyms' }, { status: 500 })
  }
}

// POST - Create new gym
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, logo, primaryColor, phone, address, description, ownerId, services, trainers } = body

    // Check if slug already exists
    const existing = await prisma.gym.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 400 })
    }

    const gym = await prisma.gym.create({
      data: {
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
        services: services ? {
          create: services.map((s: { name: string; duration: number; price: number }) => ({
            name: s.name,
            duration: s.duration,
            price: s.price,
          }))
        } : undefined,
        trainers: trainers ? {
          create: trainers.map((t: { name: string; role: string; image: string }) => ({
            name: t.name,
            role: t.role,
            image: t.image,
          }))
        } : undefined,
      },
      include: {
        services: true,
        trainers: true,
      },
    })

    return NextResponse.json(gym, { status: 201 })
  } catch (error) {
    console.error('Error creating gym:', error)
    return NextResponse.json({ error: 'Failed to create gym' }, { status: 500 })
  }
}

// PUT - Update gym
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, logo, primaryColor, phone, address, description, services, trainers } = body

    // Update gym basic info
    const gym = await prisma.gym.update({
      where: { id },
      data: {
        name,
        logo,
        primaryColor,
        phone,
        address,
        description,
      },
    })

    // Update services if provided
    if (services) {
      // Delete existing services
      await prisma.service.deleteMany({ where: { gymId: id } })
      
      // Create new services
      await prisma.service.createMany({
        data: services.map((s: { name: string; duration: number; price: number }) => ({
          name: s.name,
          duration: s.duration,
          price: s.price,
          gymId: id,
        })),
      })
    }

    // Update trainers if provided
    if (trainers) {
      await prisma.trainer.deleteMany({ where: { gymId: id } })
      
      await prisma.trainer.createMany({
        data: trainers.map((t: { name: string; role: string; image: string }) => ({
          name: t.name,
          role: t.role,
          image: t.image,
          gymId: id,
        })),
      })
    }

    return NextResponse.json(gym)
  } catch (error) {
    console.error('Error updating gym:', error)
    return NextResponse.json({ error: 'Failed to update gym' }, { status: 500 })
  }
}
