/**
 * Generate unique order number
 * Format: AT-YYYYMMDD-XXXXXX (e.g., AT-20260101-123456)
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

  return `AT-${year}${month}${day}-${random}`;
}

/**
 * Generate unique referral code
 * Format: 8 uppercase alphanumeric characters
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters
  let code = '';

  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

/**
 * Generate OTP code
 * Format: 6 digit number
 */
export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
