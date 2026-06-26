/**
 * Formats a number as Nigerian Naira (NGN)
 * Supports numbers, strings, bigints, and objects (like Prisma Decimal)
 */
export function formatCurrency(amount: number | string | bigint | object | null | undefined): string {
  if (amount === null || amount === undefined) return "₦0.00";
  const strValue = typeof amount === "object" ? amount.toString() : String(amount);
  const value = parseFloat(strValue);
  
  if (isNaN(value)) return "₦0.00";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats currency in compact form (K/M/B suffixes) for space-constrained UI like StatCards.
 * Values under ₦10,000 are shown in full without decimals.
 */
export function formatCompactCurrency(amount: number | string | bigint | object | null | undefined): string {
  if (amount === null || amount === undefined) return "₦0";
  const strValue = typeof amount === "object" ? amount.toString() : String(amount);
  const value = parseFloat(strValue);
  if (isNaN(value)) return "₦0";

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    const n = abs / 1_000_000_000;
    return `${sign}₦${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    const n = abs / 1_000_000;
    return `${sign}₦${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}M`;
  }
  if (abs >= 10_000) {
    const n = abs / 1_000;
    return `${sign}₦${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}K`;
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats currency without the symbol
 */
export function formatAmount(amount: number | string | object | null | undefined): string {
  if (amount === null || amount === undefined) return "0.00";
  const strValue = typeof amount === "object" ? amount.toString() : String(amount);
  const value = parseFloat(strValue);
  if (isNaN(value)) return "0.00";

  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
  }).format(value);
}
