/**
 * Normalizes Kenyan phone numbers to M-Pesa format (254XXXXXXXXX)
 * Accepts various input formats:
 * - 254712345678
 * - 0712345678
 * - +254712345678
 * - 254-712-345-678
 * - (254) 712 345 678
 * - etc.
 */
export function normalizeMpesaPhone(phone) {
  if (!phone) return ''
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Handle different formats
  if (cleaned.startsWith('254')) {
    // Already in 254 format
    return cleaned
  } else if (cleaned.startsWith('0')) {
    // Convert 07XXXXXXXX to 2547XXXXXXXX
    return '254' + cleaned.substring(1)
  } else if (cleaned.length === 9) {
    // Assume it's missing the country code (7XXXXXXXX)
    return '254' + cleaned
  } else if (cleaned.length === 10 && cleaned.startsWith('7')) {
    // 7XXXXXXXXX format
    return '254' + cleaned
  }
  
  // If it doesn't match any pattern, return as is (will be validated)
  return cleaned
}

/**
 * Validates if a phone number is a valid Kenyan M-Pesa number
 */
export function validateMpesaPhone(phone) {
  const normalized = normalizeMpesaPhone(phone)
  
  // M-Pesa numbers should be 254 followed by 9 digits (total 12 digits)
  // First digit after 254 should be 7 (mobile numbers)
  const mpesaRegex = /^2547\d{8}$/
  
  return mpesaRegex.test(normalized)
}

/**
 * Formats phone number for display
 */
export function formatPhoneDisplay(phone) {
  const normalized = normalizeMpesaPhone(phone)
  
  if (normalized.length === 12 && normalized.startsWith('2547')) {
    // Format as 254 7XX XXX XXX
    return `${normalized.substring(0, 3)} ${normalized.substring(3, 4)} ${normalized.substring(4, 7)} ${normalized.substring(7, 10)}`
  }
  
  return normalized
}

