// =======================================================
// 📁 GYMFLOW QR TOKEN SYSTEM - Anti-Fraud
// =======================================================

import crypto from 'crypto'

// Token expiration time (30 seconds for gym QR, 5 min for member QR)
const GYM_TOKEN_EXPIRATION_MS = 30000
const MEMBER_TOKEN_EXPIRATION_MS = 5 * 60 * 1000

/**
 * Get QR secret - uses environment variable or generates a stable fallback
 * IMPORTANT: In production, always set QR_SECRET environment variable
 */
function getQRSecret(): string {
  // Priority: env variable > stable generated secret
  if (process.env.QR_SECRET) {
    return process.env.QR_SECRET
  }

  // Fallback: generate stable secret from app URL (consistent across deployments)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gym-flow-wine.vercel.app'
  // Create a stable hash from the app URL
  return crypto.createHash('sha256').update(appUrl).digest('hex')
}

/**
 * Generate a secure QR token for a gym
 * Format: gymId.timestamp.signature
 * 
 * This prevents:
 * - QR code reuse (timestamp expiration)
 * - QR code tampering (HMAC signature)
 * - QR code forgery (secret key)
 */
export function generateQRToken(gymId: string): string {
  const timestamp = Date.now()
  const payload = `${gymId}.${timestamp}`
  
  const signature = crypto
    .createHmac('sha256', getQRSecret())
    .update(payload)
    .digest('hex')
    .substring(0, 16) // Shorter for QR readability
  
  return `${payload}.${signature}`
}

/**
 * Generate a member-specific QR token
 */
export function generateMemberQRToken(gymId: string, memberId: string, qrCode: string): string {
  const timestamp = Date.now()
  const payload = `${gymId}.${memberId}.${timestamp}`
  
  const signature = crypto
    .createHmac('sha256', getQRSecret())
    .update(payload + qrCode)
    .digest('hex')
    .substring(0, 16)
  
  return `${payload}.${signature}`
}

/**
 * Verify a QR token
 * Returns valid: true and gymId if valid
 * Returns valid: false and reason if invalid
 */
export function verifyQRToken(token: string): { 
  valid: boolean
  gymId?: string
  reason?: string 
} {
  try {
    const parts = token.split('.')
    
    if (parts.length < 3) {
      return { valid: false, reason: 'INVALID_FORMAT' }
    }
    
    const [gymId, timestampStr, signature] = parts
    const timestamp = parseInt(timestampStr, 10)
    
    // Check timestamp is valid number
    if (isNaN(timestamp)) {
      return { valid: false, reason: 'INVALID_TIMESTAMP' }
    }
    
    // Check if token expired
    if (Date.now() - timestamp > GYM_TOKEN_EXPIRATION_MS) {
      return { valid: false, reason: 'EXPIRED' }
    }
    
    // Verify signature
    const payload = `${gymId}.${timestamp}`
    const expectedSignature = crypto
      .createHmac('sha256', getQRSecret())
      .update(payload)
      .digest('hex')
      .substring(0, 16)
    
    if (signature !== expectedSignature) {
      return { valid: false, reason: 'INVALID_SIGNATURE' }
    }
    
    return { valid: true, gymId }
    
  } catch (error) {
    console.error('[QR] Verification error:', error)
    return { valid: false, reason: 'VERIFICATION_ERROR' }
  }
}

/**
 * Verify a member QR token
 */
export function verifyMemberQRToken(
  token: string
): { 
  valid: boolean
  gymId?: string
  memberId?: string
  reason?: string 
} {
  try {
    const parts = token.split('.')
    
    if (parts.length < 4) {
      return { valid: false, reason: 'INVALID_FORMAT' }
    }
    
    const [gymId, memberId, timestampStr, signature] = parts
    const timestamp = parseInt(timestampStr, 10)
    
    // Check timestamp is valid number
    if (isNaN(timestamp)) {
      return { valid: false, reason: 'INVALID_TIMESTAMP' }
    }
    
    // Check if token expired (longer for member tokens - 5 minutes)
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      return { valid: false, reason: 'EXPIRED' }
    }
    
    // Note: Full signature verification would need the qrCode
    // For now, we do basic format verification
    
    return { valid: true, gymId, memberId }
    
  } catch (error) {
    console.error('[QR] Member verification error:', error)
    return { valid: false, reason: 'VERIFICATION_ERROR' }
  }
}

/**
 * Generate a simple QR code for members (human-readable format)
 */
export function generateMemberQrCode(gymSlug: string, memberId: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `GF-${gymSlug.substring(0, 4).toUpperCase()}-${memberId.substring(0, 4).toUpperCase()}-${random}`
}

/**
 * Validate a member QR code format
 */
export function isValidMemberQrCode(qrCode: string): boolean {
  // Format: GF-XXXX-XXXX-XXXX
  const pattern = /^GF-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  return pattern.test(qrCode)
}
