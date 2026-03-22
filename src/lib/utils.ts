// ============================================
// DOMAIN UTILITIES - Multi-tenant SaaS
// ============================================

/**
 * Get the base URL for the application
 * Works in both client and server side
 * Handles Vercel preview deployments correctly
 */
export function getBaseUrl(): string {
  // Client-side: use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Server-side: use env or fallback
  return process.env.NEXT_PUBLIC_APP_URL || 'https://gym-flow-wine.vercel.app'
}

/**
 * Generate gym check-in URL
 * Uses slug for SEO and branding (not ID)
 */
export function getGymCheckinUrl(gymSlug: string): string {
  return `${getBaseUrl()}/g/${gymSlug}/checkin`
}

/**
 * Generate member check-in URL with tracking
 */
export function getMemberCheckinUrl(gymSlug: string, memberId: string, code: string): string {
  return `${getBaseUrl()}/g/${gymSlug}/checkin?member=${memberId}&code=${code}`
}

/**
 * Generate gym public page URL
 */
export function getGymPublicUrl(gymSlug: string): string {
  return `${getBaseUrl()}/gym/${gymSlug}`
}

// ============================================
// GYM CONTEXT - QR → PayPal Flow
// ============================================

const GYM_CONTEXT_KEY = 'gymflow_context'

interface GymContext {
  gymId: string
  gymSlug: string
  gymName: string
  enteredAt: string // ISO timestamp
}

/**
 * Save gym context when user enters via QR
 * Used later in checkout flow
 */
export function saveGymContext(gymId: string, gymSlug: string, gymName: string): void {
  if (typeof window === 'undefined') return
  
  const context: GymContext = {
    gymId,
    gymSlug,
    gymName,
    enteredAt: new Date().toISOString()
  }
  
  localStorage.setItem(GYM_CONTEXT_KEY, JSON.stringify(context))
}

/**
 * Get saved gym context
 */
export function getGymContext(): GymContext | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(GYM_CONTEXT_KEY)
    if (!stored) return null
    
    return JSON.parse(stored) as GymContext
  } catch {
    return null
  }
}

/**
 * Clear gym context after checkout
 */
export function clearGymContext(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GYM_CONTEXT_KEY)
}

// ============================================
// PAYPAL UTILITIES
// ============================================

/**
 * Check if PayPal SDK is already loaded
 */
export function isPayPalLoaded(): boolean {
  if (typeof window === 'undefined') return false
  return typeof window.paypal !== 'undefined'
}

/**
 * Check if PayPal script tag exists
 */
export function getPayPalScript(): HTMLScriptElement | null {
  if (typeof document === 'undefined') return null
  return document.querySelector('script[src*="paypal.com/sdk/js"]')
}
