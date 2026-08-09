export type DatabaseHealth = "unconfigured" | "ready" | "error";

export interface DatabaseStatus {
  health: DatabaseHealth;
  provider: "postgresql";
}

export { isDatabaseConfigured, prisma } from "./client";
export { consumeRateLimit } from "./rate-limit";
export type { RateLimitDecision } from "./rate-limit";
export * from "./generated/prisma/enums";
