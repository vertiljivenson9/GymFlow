// =======================================================
// 📁 GYMFLOW SUBSCRIPTION UTILITIES
// =======================================================

/**
 * Calculate the end timestamp of a subscription period
 * @param interval - 'day', 'week', 'month', or 'year'
 * @param startDate - Optional start date (defaults to now)
 * @returns Timestamp in milliseconds
 */
export function calculatePeriodEnd(interval: string, startDate?: number): number {
  const start = startDate || Date.now()
  
  switch (interval) {
    case 'day':
      return start + 24 * 60 * 60 * 1000 // 1 day
    
    case 'week':
      return start + 7 * 24 * 60 * 60 * 1000 // 7 days
    
    case 'month':
      // Use Date API for accurate month calculation
      const monthDate = new Date(start)
      monthDate.setMonth(monthDate.getMonth() + 1)
      return monthDate.getTime()
    
    case 'year':
      // Use Date API for accurate year calculation
      const yearDate = new Date(start)
      yearDate.setFullYear(yearDate.getFullYear() + 1)
      return yearDate.getTime()
    
    default:
      // Default to 30 days
      return start + 30 * 24 * 60 * 60 * 1000
  }
}

/**
 * Calculate remaining days in subscription
 */
export function getRemainingDays(periodEnd: number): number {
  const remaining = periodEnd - Date.now()
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)))
}

/**
 * Check if subscription is expired
 */
export function isExpired(periodEnd: number): boolean {
  return periodEnd < Date.now()
}

/**
 * Format period for display
 */
export function formatPeriod(interval: string): string {
  switch (interval) {
    case 'day': return '1 día'
    case 'week': return '1 semana'
    case 'month': return '1 mes'
    case 'year': return '1 año'
    default: return interval
  }
}

/**
 * Format price with currency
 */
export function formatPrice(amount: string, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: currency
  }).format(parseFloat(amount))
}
