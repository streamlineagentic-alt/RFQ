/**
 * Generate unique RFQ number
 * Format: RFQ-YYYYMMDD-XXXX
 * Example: RFQ-20260215-0001
 */
export const generateRfqNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // Random 4-digit number for uniqueness
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  return `RFQ-${year}${month}${day}-${random}`;
};
