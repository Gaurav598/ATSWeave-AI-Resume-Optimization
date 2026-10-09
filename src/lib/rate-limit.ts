import { prisma } from "@/lib/prisma";

/** Sliding-window rate limit stored in DB (works across serverless instances sharing the same DB). */
export async function enforceRateLimit(
  key: string,
  limit = Number(process.env.AI_RATE_LIMIT_PER_HOUR || 20),
  windowHours = 1,
) {
  if (!Number.isInteger(limit) || limit < 1 || !Number.isFinite(windowHours) || windowHours <= 0) {
    throw new Error("Invalid rate-limit configuration");
  }
  const now = new Date();
  const windowMs = windowHours * 60 * 60 * 1000;
  const windowStartCutoff = new Date(now.getTime() - windowMs);
  // Conditional updates are atomic in the database. A read followed by an
  // unconditional increment lets concurrent requests exceed the quota.
  for (let attempt = 0; attempt < 5; attempt++) {
    const reset = await prisma.rateLimit.updateMany({
      where: { key, windowStart: { lt: windowStartCutoff } },
      data: { count: 1, windowStart: now },
    });
    if (reset.count) return { allowed: true, remaining: limit - 1 };

    const existing = await prisma.rateLimit.findUnique({ where: { key } });
    if (!existing) {
      try {
        await prisma.rateLimit.create({ data: { key, count: 1, windowStart: now } });
        return { allowed: true, remaining: limit - 1 };
      } catch (error) {
        // A concurrent request may have created this key. Retry only that race.
        if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "P2002") throw error;
        continue;
      }
    }
    if (existing.windowStart < windowStartCutoff) continue;
    if (existing.count >= limit) return { allowed: false, remaining: 0 };

    const incremented = await prisma.rateLimit.updateMany({
      where: { key, windowStart: { gte: windowStartCutoff }, count: { lt: limit } },
      data: { count: { increment: 1 } },
    });
    if (incremented.count) {
      const current = await prisma.rateLimit.findUnique({ where: { key } });
      return { allowed: true, remaining: Math.max(0, limit - (current?.count ?? limit)) };
    }
  }
  // Database contention should never silently grant extra requests.
  return { allowed: false, remaining: 0 };
}
