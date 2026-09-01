/**
 * Zero-cost launch mode is ON unless explicitly disabled.
 * Keep it enabled on Vercel Hobby to prevent paid AI/monetization features
 * from being activated accidentally.
 */
export function zeroCostMode(): boolean {
  const raw = process.env.ZERO_COST_MODE?.trim().toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "off";
}
