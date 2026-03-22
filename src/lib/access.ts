// =======================================================
// 📁 GYMFLOW ACCESS CONTROL
// =======================================================

import { subscriptionsCollection, Subscription } from './db'

export type AccessStatus = 
  | 'ACTIVE'           // Has valid subscription
  | 'NO_SUBSCRIPTION'  // Never subscribed
  | 'EXPIRED'          // Subscription expired
  | 'CANCELLED'        // Subscription cancelled

export interface AccessResult {
  status: AccessStatus
  subscription?: Subscription
  remainingDays?: number
  message?: string
}

/**
 * Check if a user has access to a gym
 * This is the main access control function
 */
export async function getUserAccess(userId: string, gymId: string): Promise<AccessResult> {
  try {
    const subscription = await subscriptionsCollection.findActive(userId, gymId)
    
    // No subscription found
    if (!subscription) {
      return {
        status: 'NO_SUBSCRIPTION',
        message: 'No tienes una suscripción activa para este gimnasio'
      }
    }
    
    // Check if subscription is active
    if (subscription.status === 'cancelled') {
      return {
        status: 'CANCELLED',
        subscription,
        message: 'Tu suscripción ha sido cancelada'
      }
    }
    
    // Check if subscription period has ended
    const now = Date.now()
    if (subscription.currentPeriodEnd < now) {
      // Update subscription status in DB
      await subscriptionsCollection.update(subscription.id, { status: 'expired' })
      
      return {
        status: 'EXPIRED',
        subscription,
        message: 'Tu suscripción ha expirado'
      }
    }
    
    // Calculate remaining days
    const remainingDays = Math.ceil((subscription.currentPeriodEnd - now) / (24 * 60 * 60 * 1000))
    
    return {
      status: 'ACTIVE',
      subscription,
      remainingDays,
      message: `Suscripción activa - ${remainingDays} días restantes`
    }
    
  } catch (error) {
    console.error('[ACCESS] Error checking access:', error)
    return {
      status: 'NO_SUBSCRIPTION',
      message: 'Error al verificar acceso'
    }
  }
}

/**
 * Check if a member has access (simpler check for members)
 */
export async function getMemberAccess(membershipStatus: string, membershipEndsAt?: number): AccessResult {
  if (membershipStatus !== 'active') {
    return {
      status: 'NO_SUBSCRIPTION',
      message: 'Membresía no activa'
    }
  }
  
  if (!membershipEndsAt) {
    return {
      status: 'NO_SUBSCRIPTION',
      message: 'Sin fecha de membresía'
    }
  }
  
  const now = Date.now()
  if (membershipEndsAt < now) {
    return {
      status: 'EXPIRED',
      message: 'Membresía expirada'
    }
  }
  
  const remainingDays = Math.ceil((membershipEndsAt - now) / (24 * 60 * 60 * 1000))
  
  return {
    status: 'ACTIVE',
    remainingDays,
    message: `Membresía activa - ${remainingDays} días restantes`
  }
}

/**
 * Check if check-in is allowed (not too soon)
 */
export function canCheckIn(lastCheckinTimestamp?: number, minIntervalMs: number = 2 * 60 * 1000): boolean {
  if (!lastCheckinTimestamp) return true
  
  return Date.now() - lastCheckinTimestamp >= minIntervalMs
}
