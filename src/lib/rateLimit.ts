const hits = new Map<string, { count: number; resetAt: number }>();

/** Enkel rate-limit: max 10 kall per IP per 10 minutter. */
export function checkRateLimit(
  ip: string,
  limit = 10,
  windowMs = 10 * 60 * 1000,
): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}
