// =======================================================
// 📁 GYMFLOW CHECK-IN SYSTEM
// =======================================================

import { getUserAccess, canCheckIn } from './access'
import { checkinsCollection, membersCollection, membersCollection as members } from './db'

export interface CheckinResult {
  success: boolean
  reason?: string
  checkin?: {
    id: string
    timestamp: number
    gymId: string
  }
  member?: {
    id: string
    name: string
  }
}

/**
 * Perform a check-in for a user
 * This is the main check-in logic
 */
export async function performCheckin(
  userId: string, 
  gymId: string,
  options?: {
    memberId?: string
    qrToken?: string
    skipAccessCheck?: boolean
  }
): Promise<CheckinResult> {
  try {
    // 1. Check user has access to this gym
    if (!options?.skipAccessCheck) {
      const access = await getUserAccess(userId, gymId)
      
      if (access.status !== 'ACTIVE') {
        return {
          success: false,
          reason: access.message || 'NO_ACCESS'
        }
      }
    }
    
    // 2. Check if too soon since last check-in (anti-spam)
    const lastCheckin = await checkinsCollection.getLast(userId, gymId)
    
    if (lastCheckin && !canCheckIn(lastCheckin.timestamp)) {
      const waitTime = Math.ceil((2 * 60 * 1000 - (Date.now() - lastCheckin.timestamp)) / 1000)
      return {
        success: false,
        reason: `Espera ${waitTime} segundos antes de otro check-in`
      }
    }
    
    // 3. Get member info if memberId provided
    let memberInfo = null
    if (options?.memberId) {
      memberInfo = await members.findById(options.memberId)
    }
    
    // 4. Create check-in record
    const checkin = await checkinsCollection.create({
      userId,
      gymId,
      memberId: options?.memberId,
      timestamp: Date.now(),
      qrToken: options?.qrToken
    })
    
    console.log('[CHECKIN] Success:', { userId, gymId, checkinId: checkin.id })
    
    return {
      success: true,
      checkin: {
        id: checkin.id,
        timestamp: checkin.timestamp,
        gymId: checkin.gymId
      },
      member: memberInfo ? {
        id: memberInfo.id,
        name: memberInfo.name
      } : undefined
    }
    
  } catch (error) {
    console.error('[CHECKIN] Error:', error)
    return {
      success: false,
      reason: 'Error al procesar check-in'
    }
  }
}

/**
 * Perform check-in for a member via QR code
 */
export async function performMemberCheckin(
  gymId: string,
  memberId: string,
  qrCode: string
): Promise<CheckinResult> {
  try {
    // 1. Find member
    const member = await membersCollection.findByQrCode(gymId, qrCode)
    
    if (!member || member.id !== memberId) {
      return {
        success: false,
        reason: 'Código QR no válido'
      }
    }
    
    // 2. Check member membership status
    if (member.membershipStatus === 'expired' || 
        (member.membershipEndsAt && member.membershipEndsAt < Date.now())) {
      return {
        success: false,
        reason: 'Membresía expirada'
      }
    }
    
    // 3. Check last check-in
    const lastCheckin = await checkinsCollection.getLast(memberId, gymId)
    
    if (lastCheckin && !canCheckIn(lastCheckin.timestamp)) {
      return {
        success: false,
        reason: 'Check-in demasiado reciente'
      }
    }
    
    // 4. Create check-in
    const checkin = await checkinsCollection.create({
      userId: memberId, // Use memberId as userId for members
      gymId,
      memberId,
      timestamp: Date.now()
    })
    
    return {
      success: true,
      checkin: {
        id: checkin.id,
        timestamp: checkin.timestamp,
        gymId: checkin.gymId
      },
      member: {
        id: member.id,
        name: member.name
      }
    }
    
  } catch (error) {
    console.error('[CHECKIN] Member check-in error:', error)
    return {
      success: false,
      reason: 'Error al procesar check-in'
    }
  }
}

/**
 * Get check-in statistics for a gym
 */
export async function getCheckinStats(gymId: string): Promise<{
  today: number
  thisWeek: number
  thisMonth: number
}> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const weekStart = todayStart - (now.getDay() * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  
  // In production, use proper aggregation queries
  // For now, get all and filter
  const checkins = await checkinsCollection.getByGym(gymId, 1000)
  
  return {
    today: checkins.filter(c => c.timestamp >= todayStart).length,
    thisWeek: checkins.filter(c => c.timestamp >= weekStart).length,
    thisMonth: checkins.filter(c => c.timestamp >= monthStart).length
  }
}
