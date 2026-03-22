// Auth Service - JWT + Firebase Admin
import { SignJWT, jwtVerify } from 'jose'
import { getDb } from './firebase-admin'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gymflow-super-secret-key-change-in-production'
)

// Password hashing using Web Crypto API (Edge compatible)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'gymflow-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// JWT Token functions
export async function generateToken(payload: { userId: string; gymId: string; role: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: string; gymId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; gymId: string; role: string }
  } catch {
    return null
  }
}

// Login
export async function login(email: string, password: string): Promise<{ user: any; token: string } | null> {
  const db = await getDb()

  if (!db) {
    // Demo mode
    if (email === 'demo@gymflow.com' && password === 'demo123') {
      const token = await generateToken({ userId: 'demo-user', gymId: 'demo-gym', role: 'owner' })
      return {
        user: { id: 'demo-user', email, name: 'Demo User', role: 'owner', gymId: 'demo-gym' },
        token
      }
    }
    return null
  }

  try {
    const usersRef = db.collection('users')
    const snapshot = await usersRef.where('email', '==', email).limit(1).get()

    if (snapshot.empty) return null

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()

    const isValid = await verifyPassword(password, userData.password)
    if (!isValid) return null

    const token = await generateToken({
      userId: userDoc.id,
      gymId: userData.gymId,
      role: userData.role || 'member'
    })

    return {
      user: {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'member',
        gymId: userData.gymId
      },
      token
    }
  } catch (error) {
    console.error('Login error:', error)
    return null
  }
}

// Register
export async function register(data: { email: string; password: string; name?: string; gymId: string; role?: string }): Promise<{ user: any; token: string }> {
  const db = await getDb()

  if (!db) {
    const token = await generateToken({ userId: 'demo-user', gymId: data.gymId, role: data.role || 'member' })
    return {
      user: { id: 'demo-user', email: data.email, name: data.name, role: data.role || 'member', gymId: data.gymId },
      token
    }
  }

  const hashedPassword = await hashPassword(data.password)

  try {
    const userRef = await db.collection('users').add({
      email: data.email,
      password: hashedPassword,
      name: data.name || '',
      gymId: data.gymId,
      role: data.role || 'member',
      createdAt: new Date().toISOString()
    })

    const token = await generateToken({
      userId: userRef.id,
      gymId: data.gymId,
      role: data.role || 'member'
    })

    return {
      user: {
        id: userRef.id,
        email: data.email,
        name: data.name,
        role: data.role || 'member',
        gymId: data.gymId
      },
      token
    }
  } catch (error) {
    console.error('Register error:', error)
    throw new Error('Failed to register user')
  }
}

// Setup Gym
export async function setupGym(data: { gymName: string; slug: string; email: string; password: string; name: string }): Promise<{ user: any; token: string; gym: any }> {
  const db = await getDb()
  const hashedPassword = await hashPassword(data.password)

  let gymId = 'demo-gym'

  if (db) {
    // Check if slug exists
    const existing = await db.collection('gyms').where('slug', '==', data.slug).limit(1).get()
    if (!existing.empty) {
      throw new Error('Slug already in use')
    }

    // Create gym
    const gymRef = await db.collection('gyms').add({
      name: data.gymName,
      slug: data.slug,
      plan: 'basic',
      status: 'trial',
      createdAt: new Date().toISOString()
    })
    gymId = gymRef.id

    // Create owner user
    await db.collection('users').add({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      gymId: gymId,
      role: 'owner',
      createdAt: new Date().toISOString()
    })
  }

  const token = await generateToken({
    userId: 'owner-' + gymId,
    gymId: gymId,
    role: 'owner'
  })

  return {
    user: {
      id: 'owner-' + gymId,
      email: data.email,
      name: data.name,
      role: 'owner',
      gymId: gymId
    },
    token,
    gym: { id: gymId, slug: data.slug, name: data.gymName }
  }
}
