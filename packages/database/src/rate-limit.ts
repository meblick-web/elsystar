import { prisma } from "./client";

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  backend: "postgresql" | "unavailable";
}

export async function consumeRateLimit(input: {
  scope: string;
  keyHash: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitDecision> {
  const { scope, keyHash, limit, windowSeconds } = input;
  const nowMs = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const expiresAt = new Date(windowStartMs + windowMs + 60_000);
  const retryAfterSeconds = Math.max(1, Math.ceil((windowStartMs + windowMs - nowMs) / 1000));

  if (!prisma) {
    return { allowed: true, limit, remaining: limit, retryAfterSeconds, backend: "unavailable" };
  }

  try {
    const bucket = await prisma.securityRateLimit.upsert({
      where: { scope_keyHash_windowStart: { scope, keyHash, windowStart } },
      create: { scope, keyHash, windowStart, expiresAt, count: 1 },
      update: { count: { increment: 1 }, expiresAt },
      select: { count: true },
    });

    if (bucket.count === 1) {
      // Opportunistic cleanup keeps the table bounded without a dedicated scheduler.
      void prisma.securityRateLimit.deleteMany({ where: { expiresAt: { lt: new Date(nowMs - 60_000) } } }).catch(() => undefined);
    }

    return {
      allowed: bucket.count <= limit,
      limit,
      remaining: Math.max(0, limit - bucket.count),
      retryAfterSeconds,
      backend: "postgresql",
    };
  } catch (error) {
    console.error("security_rate_limit_failed", { scope, error });
    // Fail open if the rate-limit backend itself is unavailable; the business endpoint
    // can still decide to fail closed if it requires PostgreSQL for its main operation.
    return { allowed: true, limit, remaining: limit, retryAfterSeconds, backend: "unavailable" };
  }
}
