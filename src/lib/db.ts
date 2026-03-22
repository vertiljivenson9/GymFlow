// =======================================================
// 📦 GYMFLOW DATABASE LAYER - Firestore Implementation
// =======================================================

import { db } from './firebase-admin'

// Types
export interface Gym {
  id: string
  slug: string
  name: string
  logo?: string
  primaryColor: string
  phone?: string
  address?: string
  description?: string
  createdAt: Date
}

export interface Plan {
  id: string
  name: string
  price: string
  currency: string
  interval: 'day' | 'week' | 'month' | 'year'
  features: string[]
  active: boolean
}

export interface Subscription {
  id: string
  userId: string
  gymId: string
  planId: string
  status: 'active' | 'expired' | 'cancelled' | 'pending'
  currentPeriodStart: number
  currentPeriodEnd: number
  paypalOrderId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Payment {
  id: string
  orderID: string
  userId: string
  gymId: string
  planId: string
  amount: string
  currency: string
  status: 'created' | 'completed' | 'failed' | 'refunded'
  createdAt: Date
  capturedAt?: Date
}

export interface Checkin {
  id: string
  userId: string
  gymId: string
  memberId?: string
  timestamp: number
  qrToken?: string
}

export interface Member {
  id: string
  gymId: string
  name: string
  email?: string
  phone?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  qrCode: string
  membershipStatus: 'active' | 'expired' | 'none'
  membershipEndsAt?: number
  createdAt: Date
}

// =======================================================
// GYMS
// =======================================================
export const gymsCollection = {
  async findBySlug(slug: string): Promise<Gym | null> {
    if (!db) {
      console.log('[DB] Firestore not available, returning null')
      return null
    }
    
    const snapshot = await db.collection('gyms').where('slug', '==', slug).limit(1).get()
    
    if (snapshot.empty) return null
    
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Gym
  },

  async findById(id: string): Promise<Gym | null> {
    if (!db) return null
    
    const doc = await db.collection('gyms').doc(id).get()
    
    if (!doc.exists) return null
    
    return { id: doc.id, ...doc.data() } as Gym
  },

  async create(data: Omit<Gym, 'id' | 'createdAt'>): Promise<Gym> {
    if (!db) throw new Error('Database not available')
    
    const docRef = await db.collection('gyms').add({
      ...data,
      createdAt: new Date()
    })
    
    const doc = await docRef.get()
    return { id: doc.id, ...doc.data() } as Gym
  }
}

// =======================================================
// PLANS
// =======================================================
export const plansCollection = {
  defaultPlans: [
    { id: 'monthly', name: 'Mensual', price: '49', currency: 'USD', interval: 'month' as const, features: ['Miembros ilimitados', 'Motor de entrenamiento', 'Acceso QR', 'Soporte email'], active: true },
    { id: 'yearly', name: 'Anual', price: '470', currency: 'USD', interval: 'year' as const, features: ['Todo del plan mensual', '2 meses gratis', 'Soporte prioritario', 'Personalización'], active: true },
  ],

  async find(planId: string): Promise<Plan | null> {
    // First try Firestore
    if (db) {
      const doc = await db.collection('plans').doc(planId).get()
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as Plan
      }
    }
    
    // Fallback to default plans
    return this.defaultPlans.find(p => p.id === planId) || null
  },

  async list(): Promise<Plan[]> {
    if (!db) return this.defaultPlans
    
    const snapshot = await db.collection('plans').where('active', '==', true).get()
    
    if (snapshot.empty) return this.defaultPlans
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan))
  }
}

// =======================================================
// SUBSCRIPTIONS
// =======================================================
export const subscriptionsCollection = {
  async findActive(userId: string, gymId: string): Promise<Subscription | null> {
    if (!db) return null
    
    const snapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .where('gymId', '==', gymId)
      .where('status', '==', 'active')
      .orderBy('currentPeriodEnd', 'desc')
      .limit(1)
      .get()
    
    if (snapshot.empty) return null
    
    const doc = snapshot.docs[0]
    const data = doc.data()
    
    return {
      id: doc.id,
      ...data,
      currentPeriodEnd: data.currentPeriodEnd?._seconds 
        ? data.currentPeriodEnd._seconds * 1000 
        : data.currentPeriodEnd
    } as Subscription
  },

  async findByGym(gymId: string): Promise<Subscription[]> {
    if (!db) return []
    
    const snapshot = await db.collection('subscriptions')
      .where('gymId', '==', gymId)
      .orderBy('createdAt', 'desc')
      .get()
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription))
  },

  async create(data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    if (!db) throw new Error('Database not available')
    
    const now = new Date()
    const docRef = await db.collection('subscriptions').add({
      ...data,
      createdAt: now,
      updatedAt: now
    })
    
    const doc = await docRef.get()
    return { id: doc.id, ...doc.data() } as Subscription
  },

  async update(id: string, data: Partial<Subscription>): Promise<void> {
    if (!db) return
    
    await db.collection('subscriptions').doc(id).update({
      ...data,
      updatedAt: new Date()
    })
  }
}

// =======================================================
// PAYMENTS
// =======================================================
export const paymentsCollection = {
  async create(data: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    if (!db) throw new Error('Database not available')
    
    const docRef = await db.collection('payments').add({
      ...data,
      createdAt: new Date()
    })
    
    const doc = await docRef.get()
    return { id: doc.id, ...doc.data() } as Payment
  },

  async findByOrderId(orderID: string): Promise<Payment | null> {
    if (!db) return null
    
    const snapshot = await db.collection('payments')
      .where('orderID', '==', orderID)
      .limit(1)
      .get()
    
    if (snapshot.empty) return null
    
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Payment
  },

  async update(orderID: string, data: Partial<Payment>): Promise<void> {
    if (!db) return
    
    const snapshot = await db.collection('payments')
      .where('orderID', '==', orderID)
      .limit(1)
      .get()
    
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update(data)
    }
  }
}

// =======================================================
// CHECKINS
// =======================================================
export const checkinsCollection = {
  async create(data: Omit<Checkin, 'id'>): Promise<Checkin> {
    if (!db) throw new Error('Database not available')
    
    const docRef = await db.collection('checkins').add(data)
    const doc = await docRef.get()
    
    console.log('[CHECKIN] Created:', data)
    
    return { id: doc.id, ...doc.data() } as Checkin
  },

  async getLast(userId: string, gymId: string): Promise<Checkin | null> {
    if (!db) return null
    
    const snapshot = await db.collection('checkins')
      .where('userId', '==', userId)
      .where('gymId', '==', gymId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get()
    
    if (snapshot.empty) return null
    
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Checkin
  },

  async getByGym(gymId: string, limit: number = 50): Promise<Checkin[]> {
    if (!db) return []
    
    const snapshot = await db.collection('checkins')
      .where('gymId', '==', gymId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Checkin))
  }
}

// =======================================================
// MEMBERS
// =======================================================
export const membersCollection = {
  async findById(memberId: string): Promise<Member | null> {
    if (!db) return null
    
    const doc = await db.collection('members').doc(memberId).get()
    
    if (!doc.exists) return null
    
    return { id: doc.id, ...doc.data() } as Member
  },

  async findByQrCode(gymId: string, qrCode: string): Promise<Member | null> {
    if (!db) return null
    
    const snapshot = await db.collection('members')
      .where('gymId', '==', gymId)
      .where('qrCode', '==', qrCode)
      .limit(1)
      .get()
    
    if (snapshot.empty) return null
    
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Member
  },

  async findByGym(gymId: string): Promise<Member[]> {
    if (!db) return []
    
    const snapshot = await db.collection('members')
      .where('gymId', '==', gymId)
      .get()
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member))
  },

  async create(data: Omit<Member, 'id' | 'createdAt'>): Promise<Member> {
    if (!db) throw new Error('Database not available')
    
    const docRef = await db.collection('members').add({
      ...data,
      createdAt: new Date()
    })
    
    const doc = await docRef.get()
    return { id: doc.id, ...doc.data() } as Member
  },

  async update(id: string, data: Partial<Member>): Promise<void> {
    if (!db) return
    
    await db.collection('members').doc(id).update(data)
  }
}

// Export unified db object for backward compatibility
export const gymflowDb = {
  gyms: gymsCollection,
  plans: plansCollection,
  subscriptions: subscriptionsCollection,
  payments: paymentsCollection,
  checkins: checkinsCollection,
  members: membersCollection,
}
